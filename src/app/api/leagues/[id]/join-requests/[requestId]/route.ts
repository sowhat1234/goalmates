import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type RouteParams = Promise<{ id: string; requestId: string }>

export async function PATCH(
  request: Request,
  props: { params: RouteParams }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const params = await props.params
    const { id, requestId } = params

    // Check if the user is the league owner or an admin
    const league = await prisma.league.findUnique({
      where: { id },
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

    const { action } = await request.json()

    if (!action || !["accept", "reject"].includes(action)) {
      return new NextResponse("Invalid action", { status: 400 })
    }

    // Get the join request
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
      select: {
        userId: true,
        status: true,
      },
    })

    if (!joinRequest) {
      return new NextResponse("Join request not found", { status: 404 })
    }

    if (joinRequest.status !== "PENDING") {
      return new NextResponse("Join request has already been processed", { status: 400 })
    }

    // Update the join request status
    const status = action === "accept" ? "ACCEPTED" : "REJECTED"
    await prisma.joinRequest.update({
      where: { id: requestId },
      data: { status },
    })

    // If accepted, add the user as a player in the league
    if (action === "accept") {
      // Check if the user is already a player in the league
      const existingPlayer = await prisma.player.findFirst({
        where: {
          userId: joinRequest.userId,
          leagueId: id,
        },
      })

      if (!existingPlayer) {
        // Get the user's name
        const user = await prisma.user.findUnique({
          where: { id: joinRequest.userId },
          select: { name: true },
        })

        await prisma.player.create({
          data: {
            userId: joinRequest.userId,
            leagueId: id,
            name: user?.name || "Unknown Player",
          },
        })
      }
    }

    return NextResponse.json({ message: `Request ${status.toLowerCase()}` })
  } catch (error) {
    console.error("Error updating join request:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 