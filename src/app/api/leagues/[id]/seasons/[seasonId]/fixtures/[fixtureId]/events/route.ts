import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const eventSchema = z.object({
  type: z.enum([
    "GOAL",
    "ASSIST",
    "SAVE",
    "YELLOW_CARD",
    "RED_CARD",
    "WOW_MOMENT"
  ]),
  playerId: z.string(),
  matchId: z.string(),
  team: z.string()
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

    const params = await Promise.resolve(context.params)
    const { id, seasonId, fixtureId } = params

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
                },
              },
            },
            awayTeam: {
              include: {
                players: {
                  include: {
                    player: true
                  }
                },
              },
            },
            waitingTeam: {
              include: {
                players: {
                  include: {
                    player: true
                  }
                },
              },
            },
            events: {
              include: {
                player: true,
              },
            },
          },
        },
      },
    })

    if (!fixture) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const json = await req.json()
    const validatedData = eventSchema.parse(json)

    // Verify that the player belongs to one of the teams in the match
    const match = fixture.matches.find((m) => m.id === validatedData.matchId)
    if (!match) {
      return new NextResponse("Match not found", { status: 404 })
    }

    // Verify that the player belongs to the specified team
    const playerTeam = validatedData.team === match.homeTeam.id ? match.homeTeam
      : validatedData.team === match.awayTeam.id ? match.awayTeam
      : validatedData.team === match.waitingTeam.id ? match.waitingTeam
      : null

    if (!playerTeam) {
      return new NextResponse("Invalid team specified", { status: 400 })
    }

    const playerInTeam = playerTeam.players.some(teamPlayer => teamPlayer.playerId === validatedData.playerId)
    if (!playerInTeam) {
      return new NextResponse("Player not in specified team", { status: 400 })
    }

    const event = await prisma.event.create({
      data: {
        type: validatedData.type,
        playerId: validatedData.playerId,
        matchId: validatedData.matchId,
        team: validatedData.team
      },
      include: {
        player: true,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error in POST /events:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    )
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string; seasonId: string; fixtureId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const events = await prisma.event.findMany({
      where: {
        match: {
          fixtureId: params.fixtureId,
          fixture: {
            seasonId: params.seasonId,
            season: {
              league: {
                id: params.id,
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