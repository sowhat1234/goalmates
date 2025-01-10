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

    // Get league statistics
    const stats = await prisma.league.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            players: true,
            seasons: true,
          },
        },
      },
    })

    return NextResponse.json({
      totalPlayers: stats?._count.players ?? 0,
      totalSeasons: stats?._count.seasons ?? 0,
    })
  } catch (error) {
    console.error("Error fetching league statistics:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 