import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Handle join request (accept/reject)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Verify league ownership
    const league = await prisma.league.findUnique({
      where: {
        id: params.id,
        ownerId: session.user.id,
      },
    })

    if (!league) {
      return new NextResponse("League not found or not authorized", { status: 404 })
    }

    const json = await request.json()
    const { status, response } = json

    if (!["ACCEPTED", "REJECTED"].includes(status)) {
      return new NextResponse("Invalid status", { status: 400 })
    }

    // Update join request
    const joinRequest = await prisma.joinRequest.update({
      where: {
        id: params.requestId,
        leagueId: params.id,
      },
      data: {
        status,
        response,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // If accepted, create player
    if (status === "ACCEPTED") {
      await prisma.player.create({
        data: {
          name: joinRequest.user.name || "",
          userId: joinRequest.user.id,
          leagueId: params.id,
        },
      })
    }

    return NextResponse.json(joinRequest)
  } catch (error) {
    console.error("[LEAGUE_JOIN_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Get specific join request details
export async function GET(
  request: Request,
  { params }: { params: { id: string; requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const joinRequest = await prisma.joinRequest.findUnique({
      where: {
        id: params.requestId,
        leagueId: params.id,
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

    if (!joinRequest) {
      return new NextResponse("Join request not found", { status: 404 })
    }

    // Only allow league owner or the requesting user to view
    const league = await prisma.league.findUnique({
      where: { id: params.id },
    })

    if (league?.ownerId !== session.user.id && joinRequest.userId !== session.user.id) {
      return new NextResponse("Not authorized", { status: 403 })
    }

    return NextResponse.json(joinRequest)
  } catch (error) {
    console.error("[LEAGUE_JOIN_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 