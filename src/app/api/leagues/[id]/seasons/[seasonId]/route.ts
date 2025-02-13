import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type RouteParams = Promise<{ 
  id: string
  seasonId: string 
}>

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
    const { id, seasonId } = params

    // Check if the user is a player in the league, owner, or an admin
    const league = await prisma.league.findUnique({
      where: { id },
      include: {
        players: {
          where: {
            userId: session.user.id
          }
        }
      }
    })

    if (!league) {
      return new NextResponse("League not found", { status: 404 })
    }

    const isOwner = league.ownerId === session.user.id
    const isPlayer = league.players.length > 0
    const isAdmin = session.user.role === "ADMIN"

    if (!isOwner && !isPlayer && !isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const season = await prisma.season.findFirst({
      where: {
        id: seasonId,
        leagueId: id
      },
      include: {
        fixtures: {
          orderBy: {
            date: "desc"
          },
          include: {
            matches: {
              include: {
                homeTeam: {
                  select: {
                    id: true,
                    name: true,
                    color: true
                  }
                },
                awayTeam: {
                  select: {
                    id: true,
                    name: true,
                    color: true
                  }
                },
                waitingTeam: {
                  select: {
                    id: true,
                    name: true,
                    color: true
                  }
                },
                events: {
                  include: {
                    player: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!season) {
      return new NextResponse("Not Found", { status: 404 })
    }

    return NextResponse.json(season)
  } catch (error) {
    console.error("[SEASON_GET]", error)
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
    const { id, seasonId } = params

    const season = await prisma.season.findFirst({
      where: {
        id: seasonId,
        leagueId: id,
        league: {
          ownerId: session.user.id
        }
      }
    })

    if (!season) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const json = await req.json()

    const updatedSeason = await prisma.season.update({
      where: {
        id: seasonId
      },
      data: {
        name: json.name,
        startDate: json.startDate ? new Date(json.startDate) : undefined,
        endDate: json.endDate ? new Date(json.endDate) : undefined,
        rules: json.rules
      }
    })

    return NextResponse.json(updatedSeason)
  } catch (error) {
    console.error("[SEASON_PATCH]", error)
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
    const { id, seasonId } = params

    const season = await prisma.season.findFirst({
      where: {
        id: seasonId,
        leagueId: id,
        league: {
          ownerId: session.user.id
        }
      }
    })

    if (!season) {
      return new NextResponse("Not Found", { status: 404 })
    }

    await prisma.season.delete({
      where: {
        id: seasonId
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[SEASON_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 