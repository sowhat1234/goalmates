import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type RouteParams = Promise<{ 
  id: string
  seasonId: string
  fixtureId: string 
}>

export async function POST(
  req: Request,
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
            homeTeam: true,
            awayTeam: true,
            waitingTeam: true
          }
        }
      }
    })

    if (!fixture) {
      return new NextResponse("Fixture not found", { status: 404 })
    }

    if (fixture.matches.length === 0) {
      return new NextResponse("No matches found in fixture", { status: 400 })
    }

    // Find the current active match
    const currentMatch = fixture.matches.find(m => m.status === 'IN_PROGRESS')
    if (!currentMatch) {
      return new NextResponse("No active match found", { status: 400 })
    }
    
    // Get the team IDs from the request body
    const body = await req.json()
    const { winningTeamId, losingTeamId } = body

    // First mark the current match as completed and create a WIN event
    await prisma.$transaction([
      prisma.match.update({
        where: {
          id: currentMatch.id
        },
        data: {
          status: "COMPLETED",
          winningTeamId: winningTeamId
        }
      }),
      prisma.event.create({
        data: {
          type: "WIN",
          matchId: currentMatch.id,
          team: winningTeamId,
          playerId: winningTeamId,
          timestamp: new Date().toISOString()
        }
      })
    ])

    // Create a new match with rotated teams
    const newTeams = {
      homeTeamId: winningTeamId,         // Winner stays as home team
      awayTeamId: currentMatch.waitingTeamId,   // Waiting team becomes away team
      waitingTeamId: losingTeamId,       // Losing team becomes waiting team
    }

    // Validate that all team IDs are unique
    const teamIds = Object.values(newTeams)
    if (new Set(teamIds).size !== teamIds.length) {
      return new NextResponse("Invalid team rotation: Teams must be unique", { status: 400 })
    }

    const newMatch = await prisma.match.create({
      data: {
        fixtureId: fixture.id,
        ...newTeams,
        status: "IN_PROGRESS"
      },
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
            player: true,
            assistPlayer: true
          }
        }
      }
    })

    // Return both the new match and updated fixture
    const updatedFixture = await prisma.fixture.findUnique({
      where: { id: fixture.id },
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
              orderBy: {
                timestamp: 'desc'
              },
              include: {
                player: true,
                assistPlayer: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    return NextResponse.json({ match: newMatch, fixture: updatedFixture })
  } catch (error) {
    console.error("[ROTATE_POST]", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Error",
      { status: 500 }
    )
  }
} 