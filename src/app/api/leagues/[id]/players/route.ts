import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

type RouteParams = Promise<{ id: string }>

const createPlayerSchema = z.object({
  name: z.string().min(1),
})

export async function GET(
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

    const players = await prisma.player.findMany({
      where: {
        leagueId: id,
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

    const league = await prisma.league.findFirst({
      where: {
        id: id,
        ownerId: session.user.id,
      },
    })

    if (!league) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const json = await request.json()
    const body = createPlayerSchema.parse(json)

    const player = await prisma.player.create({
      data: {
        name: body.name,
        leagueId: id,
      },
      select: {
        id: true,
        name: true,
      },
    })

    return NextResponse.json(player)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 })
    }

    console.error("[PLAYERS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 