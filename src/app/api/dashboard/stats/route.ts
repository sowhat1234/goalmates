import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get user's leagues with counts (both owned and joined)
    const leagues = await prisma.league.findMany({
      where: {
        OR: [
          {
            ownerId: session.user.id // Leagues owned by the user
          },
          {
            players: {
              some: {
                userId: session.user.id // Leagues where user is a player
              }
            }
          }
        ]
      },
      include: {
        _count: {
          select: {
            players: true,
            seasons: true
          }
        },
        players: {
          where: {
            userId: session.user.id
          },
          include: {
            events: {
              take: 5,
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        }
      }
    })

    // Calculate totals
    const totalLeagues = leagues.length
    const totalPlayers = leagues.reduce((acc, league) => acc + league._count.players, 0)

    // Get user's matches through their player records
    const userMatches = leagues.flatMap(league => 
      league.players.flatMap(player => 
        player.events.map(event => ({
          id: event.id,
          date: event.timestamp,
          leagueName: league.name,
          seasonName: 'Current Season', // We can update this when we implement seasons
          result: event.type // This will show the event type (GOAL, ASSIST, etc.)
        }))
      )
    )

    return NextResponse.json({
      totalLeagues,
      totalPlayers,
      totalMatches: userMatches.length,
      recentMatches: userMatches.slice(0, 5),
      upcomingFixtures: [] // We'll implement this when we add fixture scheduling
    })
  } catch (error) {
    console.error("[DASHBOARD_STATS]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}