import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    console.log("[FIXTURES_GET] User:", {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role
    })

    // First get all leagues for debugging
    const userLeagues = await prisma.league.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          {
            players: {
              some: {
                userId: session.user.id
              }
            }
          }
        ]
      },
      include: {
        seasons: {
          include: {
            fixtures: true
          }
        }
      }
    })

    console.log("[FIXTURES_GET] User's leagues:", userLeagues.map(l => ({
      id: l.id,
      name: l.name,
      isOwner: l.ownerId === session.user.id,
      seasonCount: l.seasons.length,
      fixtureCount: l.seasons.reduce((acc, s) => acc + s.fixtures.length, 0)
    })))

    // Get all seasons from user's leagues
    const seasonIds = userLeagues.flatMap(l => l.seasons.map(s => s.id))
    console.log("[FIXTURES_GET] Season IDs:", seasonIds)

    const fixtures = await prisma.fixture.findMany({
      where: {
        seasonId: {
          in: seasonIds
        }
      },
      include: {
        season: {
          include: {
            league: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        matches: {
          include: {
            homeTeam: true,
            awayTeam: true,
            events: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    console.log("[FIXTURES_GET] Found fixtures:", fixtures.map(f => ({
      id: f.id,
      seasonId: f.seasonId,
      leagueId: f.season.league.id,
      status: f.status,
      date: f.date
    })))

    return NextResponse.json(fixtures)
  } catch (error) {
    console.error("[FIXTURES_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 