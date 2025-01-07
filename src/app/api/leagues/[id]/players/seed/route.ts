import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MOCK_PLAYERS = [
  { name: "John Doe" },
  { name: "Jane Smith" },
  { name: "Bob Johnson" },
  { name: "Alice Brown" },
  { name: "Charlie Wilson" },
  { name: "David Lee" },
  { name: "Eva Garcia" },
  { name: "Frank Miller" },
  { name: "Grace Taylor" },
  { name: "Henry Martinez" },
  { name: "Ivy Chen" },
  { name: "Jack Anderson" },
  { name: "Kelly White" },
  { name: "Liam Thomas" },
  { name: "Mia Rodriguez" },
]

export async function POST(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = context.params

    const league = await prisma.league.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
    })

    if (!league) {
      return new NextResponse("League not found", { status: 404 })
    }

    // Delete existing players first
    await prisma.player.deleteMany({
      where: {
        leagueId: id,
      },
    })

    // Create new mock players
    const players = await prisma.player.createMany({
      data: MOCK_PLAYERS.map(player => ({
        name: player.name,
        leagueId: id,
      })),
    })

    return NextResponse.json({ message: "Players seeded successfully", count: players.count })
  } catch (error) {
    console.error("[PLAYERS_SEED]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 