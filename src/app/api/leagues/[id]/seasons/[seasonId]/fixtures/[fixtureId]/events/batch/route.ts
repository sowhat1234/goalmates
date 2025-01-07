import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const eventSchema = z.object({
  type: z.enum([
    "GOAL",
    "ASSIST",
    "SAVE",
    "YELLOW_CARD",
    "RED_CARD",
    "WOW_MOMENT",
    "WIN"
  ]),
  playerId: z.string().optional(),
  matchId: z.string(),
  team: z.string()
})

const batchEventSchema = z.object({
  events: z.array(eventSchema)
})

export async function POST(
  request: Request,
  context: { params: { id: string; seasonId: string; fixtureId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { events } = batchEventSchema.parse(await request.json())
    const { id, seasonId, fixtureId } = await Promise.resolve(context.params)

    // Validate that the fixture exists and belongs to the season
    const fixture = await prisma.fixture.findFirst({
      where: {
        id: fixtureId,
        season: {
          id: seasonId,
          league: {
            id,
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

    if (!fixture) {
      return new NextResponse("Fixture not found", { status: 404 })
    }

    const match = fixture.matches[0]

    // Process all events in a transaction
    await prisma.$transaction(
      events.map(event => {
        // Skip player validation for WIN events
        if (event.type === "WIN") {
          return prisma.event.create({
            data: {
              type: event.type,
              playerId: match.homeTeam.players[0].player.id, // Use first player as placeholder for WIN events
              matchId: event.matchId,
              team: event.team
            }
          })
        }

        // For non-WIN events, validate that the player is in the specified team
        const team = event.team === match.homeTeam.id
          ? match.homeTeam
          : event.team === match.awayTeam.id
            ? match.awayTeam
            : match.waitingTeam

        if (!event.playerId) {
          throw new Error(`Player ID is required for event type ${event.type}`)
        }

        const playerInTeam = team.players.some((tp: { player: { id: string } }) => tp.player.id === event.playerId)
        if (!playerInTeam) {
          throw new Error(`Player not in specified team for event type ${event.type}`)
        }

        return prisma.event.create({
          data: {
            type: event.type,
            playerId: event.playerId,
            matchId: event.matchId,
            team: event.team
          }
        })
      })
    )

    // Fetch and return updated fixture with all relationships
    const updatedFixture = await prisma.fixture.findFirst({
      where: {
        id: fixtureId,
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

    if (!updatedFixture) {
      return new NextResponse("Failed to fetch updated fixture", { status: 500 })
    }

    // Convert dates to ISO strings
    const formattedFixture = {
      ...updatedFixture,
      date: updatedFixture.date.toISOString(),
      createdAt: updatedFixture.createdAt.toISOString(),
      updatedAt: updatedFixture.updatedAt.toISOString(),
      matches: updatedFixture.matches.map(match => ({
        ...match,
        createdAt: match.createdAt.toISOString(),
        updatedAt: match.updatedAt.toISOString(),
        events: match.events.map(event => ({
          ...event,
          createdAt: event.createdAt.toISOString(),
          updatedAt: event.updatedAt.toISOString(),
          timestamp: event.timestamp?.toISOString() || null
        }))
      }))
    }

    return NextResponse.json(formattedFixture)
  } catch (error) {
    console.error("Failed to record events:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to record events",
      { status: 400 }
    )
  }
} 