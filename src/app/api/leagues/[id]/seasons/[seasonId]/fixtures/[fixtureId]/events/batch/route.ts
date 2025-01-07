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
    const { events } = await req.json()

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
    const createdEvents = await prisma.$transaction(async (tx) => {
      const results = []

      for (const event of events) {
        // Verify the match belongs to the fixture
        const matchBelongsToFixture = fixture.matches.some(match => match.id === event.matchId)
        if (!matchBelongsToFixture) {
          throw new Error("Match does not belong to the fixture")
        }

        // Create new event
        const newEvent = await tx.event.create({
          data: {
            type: event.type,
            playerId: event.playerId,
            matchId: event.matchId,
            team: event.team
          },
          include: {
            player: true
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