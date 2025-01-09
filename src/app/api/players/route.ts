import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    console.log("[PLAYERS_GET] Session:", {
      id: session?.user?.id,
      email: session?.user?.email,
      name: session?.user?.name,
    })

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // First get all leagues to verify the query
    const allLeagues = await prisma.league.findMany()
    console.log("[PLAYERS_GET] All Leagues:", allLeagues)

    // Then get leagues owned by the user
    const userLeagues = await prisma.league.findMany({
      where: {
        ownerId: session.user.id,
      },
      include: {
        players: {
          include: {
            league: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    console.log("[PLAYERS_GET] User Leagues:", userLeagues)

    // Flatten the players array from all leagues
    const players = userLeagues.flatMap(league => league.players)
    console.log("[PLAYERS_GET] Players:", players)

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

    console.log("[PLAYERS_GET] Players with stats:", playersWithStats)
    return NextResponse.json(playersWithStats)
  } catch (error) {
    console.error("[PLAYERS_GET] Error:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 