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

    const teams = await prisma.team.findMany({
      where: {
        OR: [
          {
            homeMatches: {
              some: {
                fixture: {
                  season: {
                    leagueId: id,
                    league: {
                      ownerId: session.user.id,
                    },
                  },
                },
              },
            },
          },
          {
            awayMatches: {
              some: {
                fixture: {
                  season: {
                    leagueId: id,
                    league: {
                      ownerId: session.user.id,
                    },
                  },
                },
              },
            },
          },
        ],
      },
      include: {
        players: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error("[TEAMS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(
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
        ownerId: session.user.id,
      },
    })

    if (!league) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const json = await req.json()

    const team = await prisma.team.create({
      data: {
        name: json.name,
        players: {
          create: json.playerIds.map((playerId: string) => ({
            playerId,
          })),
        },
      },
      include: {
        players: {
          include: {
            player: true,
          },
        },
      },
    })

    return NextResponse.json(team)
  } catch (error) {
    console.error("[TEAMS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 