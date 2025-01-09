import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Verify league ownership
    const league = await prisma.league.findUnique({
      where: {
        id: params.id,
        ownerId: session.user.id,
      },
    })

    if (!league) {
      return new NextResponse("League not found", { status: 404 })
    }

    const json = await request.json()
    const { players } = json

    if (!Array.isArray(players) || players.length === 0) {
      return new NextResponse("Invalid players data", { status: 400 })
    }

    // Validate each player
    for (const player of players) {
      if (!player.name || typeof player.name !== "string" || player.name.length < 1) {
        return new NextResponse("Invalid player name", { status: 400 })
      }
      if (!player.email || typeof player.email !== "string" || !player.email.includes("@")) {
        return new NextResponse("Invalid player email", { status: 400 })
      }
    }

    // Create all players in a transaction
    const createdPlayers = await prisma.$transaction(
      players.map((player) =>
        prisma.player.create({
          data: {
            name: player.name,
            userId: session.user.id,
            leagueId: params.id,
          },
        })
      )
    )

    return NextResponse.json(createdPlayers)
  } catch (error) {
    console.error("[LEAGUE_PLAYERS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Verify league ownership
    const league = await prisma.league.findUnique({
      where: {
        id: params.id,
        ownerId: session.user.id,
      },
    })

    if (!league) {
      return new NextResponse("League not found", { status: 404 })
    }

    const players = await prisma.player.findMany({
      where: {
        leagueId: params.id,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(players)
  } catch (error) {
    console.error("[LEAGUE_PLAYERS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 