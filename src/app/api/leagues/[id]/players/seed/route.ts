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

    const mockPlayers = [
      { name: "Asaf", email: "asaf@example.com" },
      { name: "Nissim", email: "nissim@example.com" },
      { name: "Oren Abudi", email: "oren@example.com" },
      { name: "Yuval", email: "yuval@example.com" },
      { name: "Avi", email: "avi@example.com" },
      { name: "Golan", email: "golan@example.com" },
      { name: "Tal Ben Ari", email: "tal@example.com" },
      { name: "Nir", email: "nir@example.com" },
      { name: "Ofer", email: "ofer@example.com" },
      { name: "Ran", email: "ran@example.com" },
      { name: "Matan", email: "matan@example.com" },
      { name: "Hari", email: "hari@example.com" },
      { name: "Iezra", email: "iezra@example.com" },
      { name: "Eyal", email: "eyal@example.com" },
      { name: "Dan Shemesh", email: "dan@example.com" },
      { name: "Amit Shamiss", email: "amit@example.com" },
      { name: "Avi Shem-tov", email: "avist@example.com" },
      { name: "Doron", email: "doron@example.com" },
      { name: "Eliav", email: "eliav@example.com" },
      { name: "Mazorya", email: "mazorya@example.com" },
      { name: "Omer", email: "omer@example.com" },
      { name: "Alon Shalil", email: "alon@example.com" },
      { name: "Itzik", email: "itzik@example.com" },
      { name: "Hagi", email: "hagi@example.com" },
      { name: "Asaf Karavany", email: "asafk@example.com" }
    ]

    // Create users and players in transaction
    const createdPlayers = await Promise.all(
      mockPlayers.map(async (playerData) => {
        // Create user first
        const user = await prisma.user.create({
          data: {
            name: playerData.name,
            email: playerData.email,
            role: 'USER',
          }
        })

        // Then create player linked to the user
        const player = await prisma.player.create({
          data: {
            name: playerData.name,
            userId: user.id,
            leagueId: id,
          },
          include: {
            user: true
          }
        })

        return player
      })
    )

    return NextResponse.json(createdPlayers)
  } catch (error) {
    console.error("[PLAYERS_SEED]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 