import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type RouteParams = Promise<{ 
  id: string
  seasonId: string
  fixtureId: string 
}>

export async function POST(
  req: Request,
  props: { params: RouteParams }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const params = await props.params
    const { id: leagueId, seasonId, fixtureId } = params

    // Verify the fixture exists and belongs to the user
    const fixture = await prisma.fixture.findFirst({
      where: {
        id: fixtureId,
        seasonId: seasonId,
        season: {
          leagueId: leagueId,
          league: {
            ownerId: session.user.id
          }
        }
      },
      include: {
        matches: {
          include: {
            homeTeam: true,
            awayTeam: true,
            waitingTeam: true
          }
        }
      }
    })

    if (!fixture) {
      return new NextResponse("Fixture not found", { status: 404 })
    }

    if (fixture.matches.length === 0) {
      return new NextResponse("No matches found in fixture", { status: 400 })
    }

    const match = fixture.matches[0]
    
    // Rotate teams: home -> waiting, away -> home, waiting -> away
    const updatedMatch = await prisma.match.update({
      where: {
        id: match.id
      },
      data: {
        homeTeamId: match.awayTeamId,
        awayTeamId: match.waitingTeamId,
        waitingTeamId: match.homeTeamId
      },
      include: {
        homeTeam: {
          include: {
            players: {
              include: {
                player: true
              }
            }
          }
        },
        awayTeam: {
          include: {
            players: {
              include: {
                player: true
              }
            }
          }
        },
        waitingTeam: {
          include: {
            players: {
              include: {
                player: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedMatch)
  } catch (error) {
    console.error("[ROTATE_POST]", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Error",
      { status: 500 }
    )
  }
} 