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

    console.log("[DASHBOARD_STATS] User role:", session.user.role)
    const isAdmin = session.user.role === 'ADMIN'

    // For admin users, get all leagues. For regular users, get only their leagues
    const leagues = await prisma.league.findMany({
      where: isAdmin ? undefined : {
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
        owner: true,
        _count: {
          select: {
            players: true,
            seasons: true
          }
        },
        players: {
          include: {
            user: true,
            events: {
              take: 5,
              orderBy: {
                createdAt: 'desc'
              },
              include: {
                match: {
                  include: {
                    fixture: {
                      include: {
                        season: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        seasons: {
          include: {
            fixtures: {
              where: {
                date: {
                  gte: new Date()
                }
              },
              orderBy: {
                date: 'asc'
              },
              take: 5
            }
          }
        }
      }
    })

    console.log("[DASHBOARD_STATS] User ID:", session.user.id)
    console.log("[DASHBOARD_STATS] User Role:", session.user.role)
    console.log("[DASHBOARD_STATS] Found leagues:", leagues.length)
    console.log("[DASHBOARD_STATS] League details:", leagues.map(l => ({
      id: l.id,
      name: l.name,
      ownerId: l.ownerId,
      ownerName: l.owner?.name,
      playerCount: l._count.players,
      players: l.players.map(p => ({
        id: p.id,
        name: p.name,
        userId: p.userId,
        userName: p.user?.name
      }))
    })))

    // Calculate totals
    const totalLeagues = leagues.length
    const totalPlayers = leagues.reduce((acc, league) => acc + league._count.players, 0)
    const totalMatches = leagues.reduce((acc, league) => 
      acc + league.players.reduce((pAcc, player) => 
        pAcc + player.events.length, 0
      ), 0
    )

    // Get user's matches through their player records
    const userMatches = leagues.flatMap(league => 
      league.players.filter(player => player.userId === session.user.id)
        .flatMap(player => 
          player.events.map(event => ({
            id: event.id,
            date: event.timestamp,
            leagueName: league.name,
            seasonName: event.match?.fixture?.season?.name || 'Current Season',
            result: event.type,
            leagueId: league.id,
            seasonId: event.match?.fixture?.season?.id,
            fixtureId: event.match?.fixture?.id
          }))
        )
    )

    // Get upcoming fixtures
    const upcomingFixtures = leagues.flatMap(league =>
      league.seasons.flatMap(season =>
        season.fixtures.map(fixture => ({
          id: fixture.id,
          date: fixture.date,
          leagueName: league.name,
          seasonName: season.name
        }))
      )
    )

    const stats = {
      totalLeagues,
      totalPlayers,
      totalMatches,
      recentMatches: userMatches.slice(0, 5),
      upcomingFixtures: upcomingFixtures.slice(0, 5)
    }

    console.log("[DASHBOARD_STATS] Returning stats:", stats)
    return NextResponse.json(stats)
  } catch (error) {
    console.error("[DASHBOARD_STATS]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}