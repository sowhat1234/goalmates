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

    // Get active leagues count
    const activeLeagues = await prisma.league.count({
      where: {
        ownerId: session.user.id,
      },
    })

    // Get total players count across all leagues
    const totalPlayers = await prisma.player.count({
      where: {
        league: {
          ownerId: session.user.id,
        },
      },
    })

    // Get upcoming fixtures count
    const upcomingFixtures = await prisma.fixture.count({
      where: {
        season: {
          league: {
            ownerId: session.user.id,
          },
        },
        date: {
          gte: new Date(),
        },
        status: "WAITING_TO_START",
      },
    })

    // Get total matches count
    const totalMatches = await prisma.match.count({
      where: {
        fixture: {
          season: {
            league: {
              ownerId: session.user.id,
            },
          },
        },
      },
    })

    return NextResponse.json({
      activeLeagues,
      totalPlayers,
      upcomingFixtures,
      totalMatches,
    })
  } catch (error) {
    console.error("[DASHBOARD_STATS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}