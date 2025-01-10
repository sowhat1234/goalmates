import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const leagues = await prisma.league.findMany({
      where: {
        players: {
          none: {
            userId: session.user.id,
          },
        },
      },
      include: {
        owner: {
          select: {
            name: true,
          },
        },
        players: {
          select: {
            id: true,
          },
        },
        joinRequests: {
          where: {
            userId: session.user.id,
            status: "PENDING"
          },
          select: {
            status: true
          }
        },
        _count: {
          select: {
            players: true,
          },
        },
      },
    })

    // Transform the data to include a hasPendingRequest flag
    const transformedLeagues = leagues.map(league => ({
      ...league,
      hasPendingRequest: league.joinRequests.length > 0,
      joinRequests: undefined // Remove the joinRequests array from the response
    }))

    return NextResponse.json(transformedLeagues)
  } catch (error) {
    console.error("Error fetching available leagues:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 