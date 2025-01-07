import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id: leagueId } = context.params
    const { players } = await req.json()

    // Verify the league exists and belongs to the user
    const league = await prisma.league.findFirst({
      where: {
        id: leagueId,
        ownerId: session.user.id
      }
    })

    if (!league) {
      return new NextResponse("League not found", { status: 404 })
    }

    // Validate players array
    if (!Array.isArray(players) || players.length === 0) {
      return new NextResponse("Invalid players data", { status: 400 })
    }

    // Create all players in a transaction
    const createdPlayers = await prisma.$transaction(async (tx) => {
      const results = []

      for (const player of players) {
        // Create new player directly in the league
        const newPlayer = await tx.player.create({
          data: {
            name: player.name,
            league: {
              connect: {
                id: leagueId
              }
            }
          }
        })

        results.push(newPlayer)
      }

      return results
    })

    return NextResponse.json(createdPlayers)
  } catch (error) {
    console.error("[PLAYERS_BATCH_POST]", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Error",
      { status: 500 }
    )
  }
} 