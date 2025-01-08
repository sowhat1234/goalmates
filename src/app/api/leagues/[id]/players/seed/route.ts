import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

type RouteParams = Promise<{ id: string }>

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

    // Create 15 mock players
    const mockPlayers = [
      "Asaf",
      "Nissim",
      "Oren Abudi",
      "Yuval M",
      "Avi",
      "Golan",
      "Tal Ben Ari",
      "Nir",
      "Ofer",
      "Ran",
      "Matan",
      "Hari",
      "Iezra",
      "Eyal",
      "Dan Shemesh",
      "Amit Shamiss",
      "Avi Shem-tov",
      "Doron",
      "Eliav",
      "Mazorya",
      "Omer",
      "Alon Shalil",
      "Itzik",
      "Hagi",
      "Asaf Karavany"
    ]

    const players = await Promise.all(
      mockPlayers.map((name) =>
        prisma.player.create({
          data: {
            name,
            leagueId: id,
          },
        })
      )
    )

    return NextResponse.json(players)
  } catch (error) {
    console.error("[PLAYERS_SEED]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 