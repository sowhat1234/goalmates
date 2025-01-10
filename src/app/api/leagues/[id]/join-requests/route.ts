import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if the user is the league owner, a player, or an admin
    const league = await prisma.league.findUnique({
      where: { id: params.id },
      include: {
        players: {
          where: {
            userId: session.user.id
          }
        }
      }
    })

    if (!league) {
      return new NextResponse("League not found", { status: 404 })
    }

    const isOwner = league.ownerId === session.user.id
    const isPlayer = league.players.length > 0
    const isAdmin = session.user.role === "ADMIN"

    if (!isOwner && !isPlayer && !isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Fetch join requests for the league
    const joinRequests = await prisma.joinRequest.findMany({
      where: {
        leagueId: params.id,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(joinRequests)
  } catch (error) {
    console.error("Error fetching join requests:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if the user is the league owner or an admin
    const league = await prisma.league.findUnique({
      where: { id: params.id },
      select: {
        ownerId: true,
      },
    })

    if (!league) {
      return new NextResponse("League not found", { status: 404 })
    }

    if (league.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { requestId, action } = await request.json()

    if (!requestId || !action || !["accept", "reject"].includes(action)) {
      return new NextResponse("Invalid request", { status: 400 })
    }

    // Update the join request status
    const status = action === "accept" ? "ACCEPTED" : "REJECTED"
    const joinRequest = await prisma.joinRequest.update({
      where: { id: requestId },
      data: { status },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    })

    // If accepted, add the user as a player in the league
    if (action === "accept") {
      await prisma.player.create({
        data: {
          userId: joinRequest.userId,
          leagueId: params.id,
          name: joinRequest.user.name || "Unknown Player",
        },
      })
    }

    return NextResponse.json({ message: `Request ${status.toLowerCase()}` })
  } catch (error) {
    console.error("Error updating join request:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 