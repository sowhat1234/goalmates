import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type RouteParams = Promise<{
  id: string
  seasonId: string
}>

const createFixtureSchema = z.object({
  date: z.string(),
  homeTeam: z.object({
    name: z.string(),
    color: z.string(),
    players: z.array(z.string()),
  }),
  awayTeam: z.object({
    name: z.string(),
    color: z.string(),
    players: z.array(z.string()),
  }),
  waitingTeam: z.object({
    name: z.string(),
    color: z.string(),
    players: z.array(z.string()),
  }),
})

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
    const { id, seasonId } = params

    // Verify league ownership and get fixtures
    const fixtures = await prisma.fixture.findMany({
      where: {
        seasonId,
        season: {
          leagueId: id,
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
            waitingTeam: true,
            events: {
              include: {
                player: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(fixtures)
  } catch (error) {
    console.error("[FIXTURES_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

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
    const { id, seasonId } = params

    // Verify league ownership
    const league = await prisma.league.findFirst({
      where: {
        id: id,
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

    const json = await request.json()
    const body = createFixtureSchema.parse(json)

    const fixture = await prisma.fixture.create({
      data: {
        date: new Date(body.date),
        seasonId,
        status: "WAITING_TO_START",
        matches: {
          create: [{
            homeTeam: {
              create: {
                name: body.homeTeam.name,
                color: body.homeTeam.color,
                players: {
                  create: body.homeTeam.players.map((playerId) => ({
                    playerId,
                  })),
                },
              },
            },
            awayTeam: {
              create: {
                name: body.awayTeam.name,
                color: body.awayTeam.color,
                players: {
                  create: body.awayTeam.players.map((playerId) => ({
                    playerId,
                  })),
                },
              },
            },
            waitingTeam: {
              create: {
                name: body.waitingTeam.name,
                color: body.waitingTeam.color,
                players: {
                  create: body.waitingTeam.players.map((playerId) => ({
                    playerId,
                  })),
                },
              },
            },
          }],
        },
      },
      include: {
        matches: {
          include: {
            homeTeam: {
              include: {
                players: {
                  include: {
                    player: true,
                  },
                },
              },
            },
            awayTeam: {
              include: {
                players: {
                  include: {
                    player: true,
                  },
                },
              },
            },
            waitingTeam: {
              include: {
                players: {
                  include: {
                    player: true,
                  },
                },
              },
            },
          },
        },
      },
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