import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

type RouteParams = Promise<{
  id: string
  seasonId: string
  fixtureId: string
}>

export async function GET(
  request: Request,
  { params }: { params: RouteParams }
) {
  try {
    console.log('GET request received for fixture')
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log('Unauthorized: No session or user')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // We need to await the params in Next.js 15
    const resolvedParams = await params
    console.log('Resolved params:', resolvedParams)
    const { id, seasonId, fixtureId } = resolvedParams

    // First check if user has access to the league
    const league = await prisma.league.findUnique({
      where: { id },
      include: {
        players: {
          where: {
            userId: session.user.id
          }
        }
      }
    })

    if (!league) {
      console.log('League not found:', id)
      return new NextResponse('League not found', { status: 404 })
    }

    console.log('League found:', league.id)
    const isOwner = league.ownerId === session.user.id
    const isPlayer = league.players.length > 0
    const isAdmin = session.user.role === "ADMIN"

    if (!isOwner && !isPlayer && !isAdmin) {
      console.log('User not authorized for league:', {
        isOwner,
        isPlayer,
        isAdmin,
        userId: session.user.id,
        leagueId: league.id
      })
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Then fetch the fixture
    const fixture = await prisma.fixture.findFirst({
      where: {
        id: fixtureId,
        seasonId: seasonId,
        season: {
          league: {
            id,
          },
        },
      },
      include: {
        matches: {
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
            },
            events: {
              include: {
                player: true,
                assistPlayer: true
              },
              orderBy: {
                createdAt: "desc"
              }
            }
          }
        }
      }
    })

    if (!fixture) {
      console.log('Fixture not found:', {
        fixtureId,
        seasonId,
        leagueId: id
      })
      return new NextResponse('Fixture not found', { status: 404 })
    }

    console.log('Fixture found:', fixture.id)
    return NextResponse.json(fixture)
  } catch (error) {
    console.error('Error in fixture GET route:', error)
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Server Error',
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: RouteParams }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const resolvedParams = await params
    const { id: leagueId, seasonId, fixtureId } = resolvedParams

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
            events: true,
            homeTeam: true,
            awayTeam: true,
            waitingTeam: true
          }
        }
      }
    })

    if (!fixture) {
      return new NextResponse(
        JSON.stringify({ error: "Fixture not found" }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Delete everything in a transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // 1. Delete all events from all matches
      await tx.event.deleteMany({
        where: {
          matchId: {
            in: fixture.matches.map(m => m.id)
          }
        }
      })

      // 2. Delete all player-team relationships
      const teamIds = fixture.matches.flatMap(m => [
        m.homeTeamId,
        m.awayTeamId,
        m.waitingTeamId
      ])

      await tx.playerTeam.deleteMany({
        where: {
          teamId: {
            in: teamIds
          }
        }
      })

      // 3. Delete all matches
      await tx.match.deleteMany({
        where: {
          fixtureId: fixture.id
        }
      })

      // 4. Delete all teams
      await tx.team.deleteMany({
        where: {
          id: {
            in: teamIds
          }
        }
      })

      // 5. Finally delete the fixture
      await tx.fixture.delete({
        where: {
          id: fixture.id
        }
      })
    })

    return new NextResponse(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error("[FIXTURE_DELETE]", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Error",
      { status: 500 }
    )
  }
} 