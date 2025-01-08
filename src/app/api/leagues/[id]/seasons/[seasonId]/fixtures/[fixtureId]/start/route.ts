import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

type RouteParams = Promise<{
  id: string
  seasonId: string
  fixtureId: string
}>

const startMatchSchema = z.object({
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
  })
})

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

    // Validate request body
    const body = await request.json()
    const result = startMatchSchema.safeParse(body)
    
    if (!result.success) {
      return new NextResponse("Invalid request data", { status: 400 })
    }

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
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 })
    }

    console.error("[FIXTURE_START]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 