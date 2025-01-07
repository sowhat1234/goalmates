import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const players = await prisma.player.findMany({
      where: {
        leagueId: params.id,
        league: {
          ownerId: session.user.id,
        },
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(players)
  } catch (error) {
    console.error("[PLAYERS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const league = await prisma.league.findFirst({
      where: {
        id: params.id,
        ownerId: session.user.id,
      },
    })

    if (!league) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const json = await req.json()

    const player = await prisma.player.create({
      data: {
        name: json.name,
        leagueId: params.id,
      },
      select: {
        id: true,
        name: true,
      },
    })

    return NextResponse.json(player)
  } catch (error) {
    console.error("[PLAYERS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 