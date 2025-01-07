import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createFixtureSchema = z.object({
  date: z.string(),
  homeTeam: z.object({
    name: z.string(),
    players: z.array(z.string()),
    color: z.string()
  }),
  awayTeam: z.object({
    name: z.string(),
    players: z.array(z.string()),
    color: z.string()
  }),
  waitingTeam: z.object({
    name: z.string(),
    players: z.array(z.string()),
    color: z.string()
  })
})

export async function POST(
  req: Request,
  context: { params: { id: string; seasonId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id, seasonId } = context.params

    const league = await prisma.league.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
      include: {
        seasons: {
          where: {
            id: seasonId,
          },
        },
      },
    })

    if (!league || league.seasons.length === 0) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const json = await req.json()
    const validatedData = createFixtureSchema.parse(json)

    // Verify all players exist and belong to the league
    const allPlayerIds = [
      ...validatedData.homeTeam.players,
      ...validatedData.awayTeam.players,
      ...validatedData.waitingTeam.players
    ]

    const players = await prisma.player.findMany({
      where: {
        id: {
          in: allPlayerIds
        },
        leagueId: id
      }
    })

    if (players.length !== allPlayerIds.length) {
      return new NextResponse("One or more players not found in the league", { status: 400 })
    }

    // Create the fixture with teams and player relationships
    const fixture = await prisma.fixture.create({
      data: {
        date: new Date(validatedData.date),
        seasonId,
        matches: {
          create: {
            homeTeam: {
              create: {
                name: validatedData.homeTeam.name,
                color: validatedData.homeTeam.color,
                players: {
                  create: validatedData.homeTeam.players.map(playerId => ({
                    player: {
                      connect: { id: playerId }
                    }
                  }))
                }
              }
            },
            awayTeam: {
              create: {
                name: validatedData.awayTeam.name,
                color: validatedData.awayTeam.color,
                players: {
                  create: validatedData.awayTeam.players.map(playerId => ({
                    player: {
                      connect: { id: playerId }
                    }
                  }))
                }
              }
            },
            waitingTeam: {
              create: {
                name: validatedData.waitingTeam.name,
                color: validatedData.waitingTeam.color,
                players: {
                  create: validatedData.waitingTeam.players.map(playerId => ({
                    player: {
                      connect: { id: playerId }
                    }
                  }))
                }
              }
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
            }
          }
        }
      }
    })

    return NextResponse.json(fixture)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 })
    }

    console.error("[FIXTURES_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET(
  req: Request,
  context: { params: { id: string; seasonId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id, seasonId } = context.params

    const fixtures = await prisma.fixture.findMany({
      where: {
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
            }
          }
        }
      },
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json(fixtures)
  } catch (error) {
    console.error("[FIXTURES_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 