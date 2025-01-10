import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    // Get user's players and their events
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        players: {
          include: {
            events: {
              include: {
                match: {
                  include: {
                    fixture: {
                      include: {
                        season: {
                          include: {
                            league: true
                          }
                        }
                      }
                    }
                  }
                }
              },
              orderBy: {
                timestamp: 'desc'
              }
            }
          }
        }
      }
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    // Get all events across all players
    const events = user.players.flatMap(player => player.events)
    
    // Calculate match participation (unique matches)
    const uniqueMatches = new Set(events.map(event => event.matchId))
    const totalMatches = uniqueMatches.size

    // Calculate goals and assists
    const totalGoals = events.filter(event => event.type === "GOAL").length
    const totalAssists = events.filter(event => event.type === "ASSIST").length

    // Calculate win rate (if we have match results in events)
    const matchResults = events.filter(event => event.type === "MATCH_RESULT")
    const wins = matchResults.filter(event => event.subType === "WIN").length
    const winRate = matchResults.length > 0 ? wins / matchResults.length : 0

    // Get recent matches (using match IDs to group events)
    const recentMatchIds = Array.from(uniqueMatches).slice(0, 10)
    const recentMatchEvents = events.filter(event => recentMatchIds.includes(event.matchId))

    const recentMatches = recentMatchIds.map(matchId => {
      const matchEvents = recentMatchEvents.filter(event => event.matchId === matchId)
      const firstEvent = matchEvents[0] // Use first event to get match details
      return {
        id: matchId,
        date: firstEvent.match.fixture.date,
        leagueName: firstEvent.match.fixture.season.league.name,
        result: matchEvents.find(e => e.type === "MATCH_RESULT")?.subType || "UNKNOWN",
        goals: matchEvents.filter(e => e.type === "GOAL").length
      }
    })

    // Calculate achievements
    const achievements = [
      {
        id: "1",
        name: "First Match",
        description: "Played your first match",
        earnedDate: events[0]?.timestamp?.toISOString() || new Date().toISOString()
      },
      {
        id: "2",
        name: "Goal Scorer",
        description: "Scored your first goal",
        earnedDate: events.find(e => e.type === "GOAL")?.timestamp?.toISOString() || new Date().toISOString()
      }
    ].filter(achievement => {
      if (achievement.name === "First Match") {
        return totalMatches > 0
      }
      if (achievement.name === "Goal Scorer") {
        return events.some(e => e.type === "GOAL")
      }
      return false
    })

    const stats = {
      totalMatches,
      totalGoals,
      totalAssists,
      winRate,
      recentMatches,
      achievements
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 