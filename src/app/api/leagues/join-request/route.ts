import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "You must be logged in to request joining a league" },
        { status: 401 }
      )
    }

    const json = await request.json()
    const { leagueId } = json

    if (!leagueId) {
      return NextResponse.json(
        { message: "League ID is required" },
        { status: 400 }
      )
    }

    // Check if the league exists
    const league = await prisma.league.findUnique({
      where: { id: leagueId }
    })

    if (!league) {
      return NextResponse.json(
        { message: "League not found" },
        { status: 404 }
      )
    }

    // Check if user already has a pending request for this league
    const existingRequest = await prisma.joinRequest.findFirst({
      where: {
        userId: session.user.id,
        leagueId,
        status: "PENDING"
      }
    })

    if (existingRequest) {
      return NextResponse.json(
        { message: "You already have a pending request to join this league" },
        { status: 400 }
      )
    }

    // Check if user is already a player in this league
    const existingPlayer = await prisma.player.findFirst({
      where: {
        userId: session.user.id,
        leagueId
      }
    })

    if (existingPlayer) {
      return NextResponse.json(
        { message: "You are already a member of this league" },
        { status: 400 }
      )
    }

    // Create join request
    const joinRequest = await prisma.joinRequest.create({
      data: {
        userId: session.user.id,
        leagueId,
        status: "PENDING"
      }
    })

    return NextResponse.json({
      message: "Join request sent successfully",
      data: joinRequest
    })
  } catch (error) {
    console.error("[JOIN_REQUEST_POST]", error)
    return NextResponse.json(
      { message: "Failed to send join request. Please try again later." },
      { status: 500 }
    )
  }
} 