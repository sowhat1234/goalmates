import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type RouteParams = Promise<{ id: string }>

export async function GET(
  request: Request,
  props: { params: RouteParams }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const params = await props.params
    const { id } = params

    // Check if the user is a player in the league or an admin
    const league = await prisma.league.findUnique({
      where: { id },
      include: {
        players: {
          where: {
            userId: session.user.id,
          },
        },
      },
    })

    if (!league) {
      return new NextResponse("League not found", { status: 404 })
    }

    if (league.players.length === 0 && session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Fetch players for the league with their stats
    const players = await prisma.player.findMany({
      where: {
        leagueId: id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        events: {
          select: {
            type: true,
          },
        },
      },
    })

    // Transform the data to include calculated stats
    const transformedPlayers = players.map(player => ({
      id: player.id,
      name: player.name,
      user: player.user,
      matches: new Set(player.events.map(e => e.type === "MATCH")).size,
      goals: player.events.filter(e => e.type === "GOAL").length,
      assists: player.events.filter(e => e.type === "ASSIST").length,
    }))

    return NextResponse.json(transformedPlayers)
  } catch (error) {
    console.error("Error fetching players:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(
  request: Request,
  props: { params: RouteParams }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const params = await props.params
    const { id } = params

    // Check if the user is the league owner or an admin
    const league = await prisma.league.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { players: { some: { userId: session.user.id } } },
        ],
      },
    })

    if (!league) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const json = await request.json()

    const player = await prisma.player.create({
      data: {
        name: json.name,
        userId: json.userId,
        leagueId: id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(player)
  } catch (error) {
    console.error("[PLAYERS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 