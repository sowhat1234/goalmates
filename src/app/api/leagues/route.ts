import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    const json = await request.json()
    const { name, description } = json

    if (!name || typeof name !== "string" || name.length < 1) {
      return new NextResponse("Invalid name", { status: 400 })
    }

    if (description && typeof description !== "string") {
      return new NextResponse("Invalid description", { status: 400 })
    }

    // Create league and add owner as a player in a transaction
    const league = await prisma.$transaction(async (tx) => {
      console.log("[LEAGUES_POST] Creating league with:", {
        name,
        description,
        ownerId: session.user.id,
        ownerName: user.name
      })

      // Create the league
      const newLeague = await tx.league.create({
        data: {
          name,
          description,
          ownerId: session.user.id,
        }
      })

      console.log("[LEAGUES_POST] Created league:", newLeague)

      // Create a player record for the owner
      const player = await tx.player.create({
        data: {
          name: user.name || 'League Owner',
          userId: session.user.id,
          leagueId: newLeague.id
        }
      })

      console.log("[LEAGUES_POST] Created player for owner:", player)

      // Return the league with owner info and player count
      return await tx.league.findUnique({
        where: { id: newLeague.id },
        include: {
          owner: {
            select: {
              id: true,
              name: true
            }
          },
          players: {
            include: {
              user: true
            }
          },
          _count: {
            select: {
              players: true
            }
          }
        }
      })
    })

    console.log("[LEAGUES_POST] Final league data:", {
      id: league.id,
      name: league.name,
      ownerId: league.owner.id,
      ownerName: league.owner.name,
      playerCount: league._count.players,
      players: league.players.map(p => ({
        id: p.id,
        name: p.name,
        userId: p.userId,
        userName: p.user.name
      }))
    })

    return NextResponse.json(league)
  } catch (error) {
    console.error("[LEAGUES_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    console.log("[LEAGUES_GET] Session:", session)

    if (!session?.user?.id) {
      console.log("[LEAGUES_GET] No user ID in session")
      return new NextResponse("Unauthorized", { status: 401 })
    }

    console.log("[LEAGUES_GET] Fetching leagues for user:", session.user.id)

    // First verify if user exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    // If user is admin, show all leagues
    const isAdmin = session.user.role === 'ADMIN'
    const leagues = await prisma.league.findMany({
      where: isAdmin ? undefined : {
        OR: [
          { ownerId: session.user.id },
          {
            players: {
              some: {
                userId: session.user.id
              }
            }
          }
        ]
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            players: true,
            seasons: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    console.log("[LEAGUES_GET] Found leagues:", leagues)

    // Filter out leagues where owner is null
    const validLeagues = leagues.filter(league => league.owner !== null)

    return NextResponse.json(validLeagues)
  } catch (error) {
    console.error("[LEAGUES_GET] Error:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 