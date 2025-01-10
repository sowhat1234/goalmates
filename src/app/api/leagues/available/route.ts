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

    // Debug session
    console.log('Debug - Session:', {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role
    })

    // First get user from database to verify role
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        role: true
      }
    })

    console.log('Debug - DB User:', dbUser)

    // First get all leagues for debugging
    const allLeagues = await prisma.league.findMany({
      include: {
        owner: {
          select: {
            name: true,
          },
        },
        players: {
          where: {
            userId: session.user.id
          }
        },
        joinRequests: {
          where: {
            userId: session.user.id
          }
        }
      }
    })

    console.log('Debug - All Leagues:', allLeagues.map(l => ({
      id: l.id,
      name: l.name,
      isOwner: l.ownerId === session.user.id,
      isPlayer: l.players.length > 0,
      joinRequests: l.joinRequests.map(jr => jr.status)
    })))

    // Simplified query to show available leagues
    const leagues = await prisma.league.findMany({
      where: {
        AND: [
          // Not owned by current user
          { ownerId: { not: session.user.id } },
          // User is not a player
          { players: { none: { userId: session.user.id } } },
          // No accepted or pending requests
          {
            joinRequests: {
              none: {
                userId: session.user.id,
                status: { in: ['ACCEPTED', 'PENDING'] }
              }
            }
          }
        ]
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
        _count: {
          select: {
            players: true,
          },
        },
      },
    })

    console.log('Debug - Available Leagues:', leagues.map(l => ({
      id: l.id,
      name: l.name
    })))

    return NextResponse.json(leagues)
  } catch (error) {
    console.error("Error fetching available leagues:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 