import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const rotateSchema = z.object({
  winningTeamId: z.string(),
  losingTeamId: z.string(),
  newWaitingTeamId: z.string(),
})

export async function POST(
  req: Request,
  context: { params: { id: string; seasonId: string; fixtureId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id, seasonId, fixtureId } = await Promise.resolve(context.params)

    // Verify fixture exists and belongs to the user
    const fixture = await prisma.fixture.findFirst({
      where: {
        id: fixtureId,
        seasonId,
        season: {
          league: {
            id,
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
      return new NextResponse("Fixture not found", { status: 404 })
    }

    const json = await req.json()
    const validatedData = rotateSchema.parse(json)

    // Update the fixture with the new team positions
    const updatedFixture = await prisma.fixture.update({
      where: { id: fixtureId },
      data: {
        matches: {
          update: {
            where: { id: fixture.matches[0].id },
            data: {
              homeTeamId: validatedData.winningTeamId,
              awayTeamId: validatedData.newWaitingTeamId,
              waitingTeamId: validatedData.losingTeamId
            }
          }
        }
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
                createdAt: 'desc'
              }
            }
          }
        }
      }
    })

    if (!updatedFixture) {
      return new NextResponse("Failed to fetch updated fixture", { status: 500 })
    }

    // Convert dates to ISO strings
    const formattedFixture = {
      ...updatedFixture,
      date: updatedFixture.date.toISOString(),
      createdAt: updatedFixture.createdAt.toISOString(),
      updatedAt: updatedFixture.updatedAt.toISOString(),
      matches: updatedFixture.matches.map(match => ({
        ...match,
        createdAt: match.createdAt.toISOString(),
        updatedAt: match.updatedAt.toISOString(),
        events: match.events.map(event => ({
          ...event,
          createdAt: event.createdAt.toISOString(),
          updatedAt: event.updatedAt.toISOString(),
          timestamp: event.timestamp?.toISOString() || null
        }))
      }))
    }

    return NextResponse.json(formattedFixture)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 })
    }

    console.error("[ROTATE_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 