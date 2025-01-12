import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type RouteParams = Promise<{ id: string }>

export async function GET(
  req: Request,
  props: { params: RouteParams }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const params = await props.params
    const { id } = params

    // Fetch all required data in a single query
    const league = await prisma.league.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
        players: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        seasons: {
          orderBy: {
            startDate: "desc"
          },
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true
          }
        },
        joinRequests: {
          where: {
            status: "PENDING"
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        _count: {
          select: {
            players: true,
            seasons: true
          }
        }
      }
    })

    if (!league) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const isOwner = league.ownerId === session.user.id
    const isPlayer = league.players.some(player => player.userId === session.user.id)
    const isAdmin = session.user.role === "ADMIN"

    if (!isOwner && !isPlayer && !isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Transform the data to match the expected format
    const response = {
      ...league,
      stats: {
        totalPlayers: league._count.players,
        totalSeasons: league._count.seasons
      },
      joinRequests: isOwner || isAdmin ? league.joinRequests : []
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[LEAGUE_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  props: { params: RouteParams }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const params = await props.params
    const { id } = params
    const json = await req.json()

    const league = await prisma.league.findFirst({
      where: {
        id: id,
        ownerId: session.user.id
      }
    })

    if (!league) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const updatedLeague = await prisma.league.update({
      where: {
        id: id
      },
      data: {
        name: json.name,
        description: json.description
      }
    })

    return NextResponse.json(updatedLeague)
  } catch (error) {
    console.error("[LEAGUE_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  props: { params: RouteParams }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const params = await props.params
    const { id } = params

    const league = await prisma.league.findFirst({
      where: {
        id: id,
        ownerId: session.user.id
      }
    })

    if (!league) {
      return new NextResponse("Not Found", { status: 404 })
    }

    await prisma.league.delete({
      where: {
        id: id
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[LEAGUE_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 