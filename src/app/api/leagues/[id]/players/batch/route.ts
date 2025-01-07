import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

type RouteParams = Promise<{ id: string }>

const createPlayersSchema = z.object({
  players: z.array(
    z.object({
      name: z.string().min(1),
    })
  ),
})

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

    // Verify league ownership
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
    const body = createPlayersSchema.parse(json)

    const players = await prisma.player.createMany({
      data: body.players.map((player) => ({
        name: player.name,
        leagueId: id,
      })),
    })

    return NextResponse.json({ count: players.count })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 })
    }

    console.error("[PLAYERS_BATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 