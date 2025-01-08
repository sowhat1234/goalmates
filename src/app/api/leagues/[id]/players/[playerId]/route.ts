import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"


type RouteParams = Promise<{
  id: string
  playerId: string
}>

interface EventData {
  type: string;
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
    const { id: leagueId, playerId } = params

    // Fetch player with their stats
    const player = await prisma.player.findFirst({
      where: {
        id: playerId,
        leagueId: leagueId,
        league: {
          ownerId: session.user.id,
        },
      },
    })

    if (!player) {
      return new NextResponse("Player not found", { status: 404 })
    }

    // Calculate player stats from events
    const events = await prisma.event.findMany({
      where: {
        playerId: playerId,
        match: {
          fixture: {
            season: {
              league: {
                id: leagueId,
              },
            },
          },
        },
      },
    })

    const stats = {
      goals: events.filter((e: EventData) => e.type === "GOAL").length,
      assists: events.filter((e: EventData) => e.type === "ASSIST").length,
      saves: events.filter((e: EventData) => e.type === "SAVE").length,
      yellowCards: events.filter((e: EventData)  => e.type === "YELLOW_CARD").length,
      redCards: events.filter((e: EventData) => e.type === "RED_CARD").length,
      wowMoments: events.filter((e: EventData) => e.type === "WOW_MOMENT").length,
    }

    return NextResponse.json({
      id: player.id,
      name: player.name,
      stats,
    })
  } catch (error) {
    console.error("[PLAYER_GET]", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Error",
      { status: 500 }
    )
  }
} 