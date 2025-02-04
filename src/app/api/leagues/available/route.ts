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

    // First get ALL leagues to see what exists
    const allLeagues = await prisma.league.findMany({
      include: {
        owner: true,
        players: true
      }
    })

    console.log('All leagues in database:', allLeagues)

    // Get leagues available to join
    const availableLeagues = await prisma.league.findMany({
      where: {
        AND: [
          {
            NOT: {
              players: {
                some: {
                  userId: session.user.id
                }
              }
            }
          },
          {
            NOT: {
              ownerId: session.user.id
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
        players: true,
        joinRequests: {
          where: {
            userId: session.user.id
          }
        },
        _count: {
          select: {
            players: true,
          },
        },
      },
    })

    console.log('Available leagues before transform:', availableLeagues)

    // Transform the response
    const transformedLeagues = availableLeagues.map(league => ({
      id: league.id,
      name: league.name,
      description: league.description,
      owner: {
        name: league.owner?.name
      },
      players: league.players,
      hasPendingRequest: league.joinRequests.some(jr => jr.status === 'PENDING'),
      _count: {
        players: league._count.players
      }
    }))

    return NextResponse.json(transformedLeagues)
  } catch (error) {
    console.error("Error fetching available leagues:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 