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

const createEventSchema = z.object({
  type: z.enum(["GOAL", "ASSIST", "SAVE", "YELLOW_CARD", "RED_CARD", "WOW_MOMENT"]),
  playerId: z.string(),
  matchId: z.string(),
  timestamp: z.string().optional(),
  team: z.string(),
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

    if (!fixture) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const json = await request.json()
    const body = createEventSchema.parse(json)

    // Verify the match belongs to the fixture
    const match = fixture.matches.find(m => m.id === body.matchId)
    if (!match) {
      return new NextResponse("Match not found", { status: 404 })
    }

    // Verify the team belongs to the match
    const team = body.team === match.homeTeam.id
      ? match.homeTeam
      : body.team === match.awayTeam.id
        ? match.awayTeam
        : body.team === match.waitingTeam.id
          ? match.waitingTeam
          : null

    if (!team) {
      return new NextResponse("Team not found in match", { status: 404 })
    }

    // Verify the player belongs to the specified team
    const playerInTeam = team.players.some(p => p.playerId === body.playerId)
    if (!playerInTeam) {
      return new NextResponse("Player not found in specified team", { status: 404 })
    }

    const event = await prisma.event.create({
      data: {
        type: body.type,
        playerId: body.playerId,
        matchId: body.matchId,
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
        team: body.team,
      },
      include: {
        player: true,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 })
    }

    console.error("[EVENTS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

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

    const events = await prisma.event.findMany({
      where: {
        match: {
          fixtureId: fixtureId,
          fixture: {
            seasonId: seasonId,
            season: {
              league: {
                id: id,
                ownerId: session.user.id,
              },
            },
          },
        },
      },
      include: {
        player: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("[EVENTS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 