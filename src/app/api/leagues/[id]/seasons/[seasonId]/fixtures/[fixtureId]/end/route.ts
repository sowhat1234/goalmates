import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  context: { params: { id: string; seasonId: string; fixtureId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id: leagueId, seasonId, fixtureId } = context.params

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

    // Update the fixture status to FINISHED
    const updatedFixture = await prisma.fixture.update({
      where: {
        id: fixtureId
      },
      data: {
        status: "FINISHED"
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