import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Create join request
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await request.json()
    const { message } = json

    // Check if league exists
    const league = await prisma.league.findUnique({
      where: { id: params.id },
      include: {
        players: {
          where: {
            userId: session.user.id,
          },
        },
        joinRequests: {
          where: {
            userId: session.user.id,
            status: "PENDING",
          },
        },
      },
    })

    if (!league) {
      return new NextResponse("League not found", { status: 404 })
    }

    // Check if user is already a player in this league
    if (league.players.length > 0) {
      return new NextResponse("Already a member of this league", { status: 400 })
    }

    // Check if user already has a pending request
    if (league.joinRequests.length > 0) {
      return new NextResponse("Already have a pending request", { status: 400 })
    }

    // Create join request
    const joinRequest = await prisma.joinRequest.create({
      data: {
        userId: session.user.id,
        leagueId: params.id,
        message,
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

    return NextResponse.json(joinRequest)
  } catch (error) {
    console.error("[LEAGUE_JOIN_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Get join request status
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const joinRequest = await prisma.joinRequest.findFirst({
      where: {
        leagueId: params.id,
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(joinRequest)
  } catch (error) {
    console.error("[LEAGUE_JOIN_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 