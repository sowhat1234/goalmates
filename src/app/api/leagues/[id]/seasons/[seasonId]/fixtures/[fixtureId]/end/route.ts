import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

type RouteParams = Promise<{
  id: string
  seasonId: string
  fixtureId: string
}>

export async function POST(
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

    // Verify the league and season exist and belong to the user
    const league = await prisma.league.findFirst({
      where: {
        id: leagueId,
        ownerId: session.user.id,
        seasons: {
          some: {
            id: seasonId,
            fixtures: {
              some: {
                id: fixtureId
              }
            }
          }
        }
      }
    })

    if (!league) {
      return new NextResponse("Not Found", { status: 404 })
    }

    // Update the fixture with the new status and return it with all relationships
    const updatedFixture = await prisma.fixture.update({
      where: {
        id: fixtureId
      },
      data: {
        status: "COMPLETED"
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

    return NextResponse.json(updatedFixture)
  } catch (error) {
    console.error("[FIXTURE_END]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 