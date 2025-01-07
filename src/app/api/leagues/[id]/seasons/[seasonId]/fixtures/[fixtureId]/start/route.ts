import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const startMatchSchema = z.object({
  homeTeamId: z.string(),
  awayTeamId: z.string(),
  waitingTeamId: z.string()
})

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

    const json = await request.json()
    const validatedData = startMatchSchema.parse(json)

    // Create a new match with the validated team IDs
    const match = await prisma.match.create({
      data: {
        fixtureId,
        homeTeamId: validatedData.homeTeamId,
        awayTeamId: validatedData.awayTeamId,
        waitingTeamId: validatedData.waitingTeamId
      }
    })

    // Update the fixture with the new status and return it with all relationships
    const updatedFixture = await prisma.fixture.update({
      where: {
        id: fixtureId,
        matches: {
          some: {
            id: match.id
          }
        }
      },
      data: {
        status: "IN_PROGRESS"
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
    console.error("[FIXTURE_START]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 