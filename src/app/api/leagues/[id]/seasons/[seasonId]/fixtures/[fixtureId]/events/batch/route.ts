import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PrismaClient } from "@prisma/client"

type RouteParams = Promise<{ 
  id: string
  seasonId: string
  fixtureId: string 
}>

const batchEventSchema = z.object({
  events: z.array(z.object({
    type: z.enum(["GOAL", "ASSIST", "SAVE", "YELLOW_CARD", "RED_CARD", "WOW_MOMENT", "WIN"]),
    playerId: z.union([z.string(), z.literal("")]),
    matchId: z.string(),
    team: z.string()
  }))
})

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
    const body = await req.json()
    
    // Validate the request body against the schema
    const { events } = batchEventSchema.parse(body)

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
        matches: true
      }
    })

    if (!fixture) {
      return new NextResponse("Fixture not found", { status: 404 })
    }

    // Validate events array
    if (!Array.isArray(events) || events.length === 0) {
      return new NextResponse("Invalid events data", { status: 400 })
    }

    // Create all events in a transaction
    const createdEvents = await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
      const results = []

      for (const event of events) {
        // Verify the match belongs to the fixture
        const matchBelongsToFixture = fixture.matches.some((match: { id: string }) => match.id === event.matchId)
        if (!matchBelongsToFixture) {
          throw new Error("Match does not belong to the fixture")
        }

        // Create new event with conditional player inclusion
        const eventData = {
          type: event.type,
          matchId: event.matchId,
          team: event.team,
          ...(event.type !== "WIN" ? { playerId: event.playerId } : {})  // Only include playerId for non-WIN events
        }

        const newEvent = await tx.event.create({
          data: eventData,
          include: {
            player: event.type !== "WIN"  // Only include player for non-WIN events
          }
        })

        results.push(newEvent)
      }

      return results
    })

    return NextResponse.json(createdEvents)
  } catch (error) {
    console.error("[EVENTS_BATCH_POST]", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Error",
      { status: 500 }
    )
  }
} 