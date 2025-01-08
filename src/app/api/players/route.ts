import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const players = await prisma.player.findMany({
      where: {
        league: {
          ownerId: session.user.id,
        },
      },
      include: {
        league: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Fetch statistics for each player
    const playersWithStats = await Promise.all(
      players.map(async (player) => {
        const events = await prisma.event.findMany({
          where: {
            playerId: player.id,
          },
        })

        const stats = {
          goals: events.filter(e => e.type === "GOAL").length,
          assists: events.filter(e => e.type === "ASSIST").length,
          saves: events.filter(e => e.type === "SAVE").length,
          yellowCards: events.filter(e => e.type === "YELLOW_CARD").length,
          redCards: events.filter(e => e.type === "RED_CARD").length,
          wowMoments: events.filter(e => e.type === "WOW_MOMENT").length,
        }

        return {
          ...player,
          stats,
        }
      })
    )

    return NextResponse.json(playersWithStats)
  } catch (error) {
    console.error("[PLAYERS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 