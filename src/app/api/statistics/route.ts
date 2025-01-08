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

    // Get all players with their events
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
        events: true,
      },
    })

    // Calculate player statistics
    const playersWithStats = players.map(player => ({
      id: player.id,
      name: player.name,
      league: player.league,
      stats: {
        goals: player.events.filter(e => e.type === "GOAL").length,
        assists: player.events.filter(e => e.type === "ASSIST").length,
        saves: player.events.filter(e => e.type === "SAVE").length,
        yellowCards: player.events.filter(e => e.type === "YELLOW_CARD").length,
        redCards: player.events.filter(e => e.type === "RED_CARD").length,
        wowMoments: player.events.filter(e => e.type === "WOW_MOMENT").length,
      },
    }))

    // Sort players by different statistics
    const topScorers = [...playersWithStats].sort((a, b) => b.stats.goals - a.stats.goals)
    const topAssists = [...playersWithStats].sort((a, b) => b.stats.assists - a.stats.assists)
    const topSaves = [...playersWithStats].sort((a, b) => b.stats.saves - a.stats.saves)

    // Get league statistics
    const leagues = await prisma.league.findMany({
      where: {
        ownerId: session.user.id,
      },
      include: {
        seasons: {
          include: {
            fixtures: {
              include: {
                matches: {
                  include: {
                    events: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    const leagueStats = leagues.map(league => {
      const matches = league.seasons.flatMap(season => 
        season.fixtures.flatMap(fixture => fixture.matches)
      )
      const events = matches.flatMap(match => match.events)

      return {
        id: league.id,
        name: league.name,
        totalMatches: matches.length,
        totalGoals: events.filter(e => e.type === "GOAL").length,
        totalAssists: events.filter(e => e.type === "ASSIST").length,
        totalSaves: events.filter(e => e.type === "SAVE").length,
      }
    })

    return NextResponse.json({
      topScorers,
      topAssists,
      topSaves,
      leagueStats,
    })
  } catch (error) {
    console.error("[STATISTICS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 