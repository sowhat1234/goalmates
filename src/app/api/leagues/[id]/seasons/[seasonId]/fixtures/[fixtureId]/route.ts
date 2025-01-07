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
  props: { params: RouteParams }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const params = await props.params
    const { id, seasonId, fixtureId } = params

    console.log('Fetching fixture:', { id, seasonId, fixtureId })

    const fixture = await prisma.fixture.findFirst({
      where: {
        id: fixtureId,
        seasonId: seasonId,
        season: {
          league: {
            id: id,
            ownerId: session.user.id,
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
                player: true
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
      console.log('Fixture not found:', { id, seasonId, fixtureId })
      return new NextResponse("Not Found", { status: 404 })
    }

    console.log('Fixture found:', { id: fixture.id })
    return NextResponse.json(fixture)
  } catch (error) {
    console.error("[FIXTURE_GET]", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Error",
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
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