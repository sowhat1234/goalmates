import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { id: string; seasonId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const season = await prisma.season.findFirst({
      where: {
        id: params.seasonId,
        leagueId: params.id,
        league: {
          ownerId: session.user.id,
        },
      },
      include: {
        fixtures: {
          orderBy: {
            date: "desc",
          },
          select: {
            id: true,
            date: true,
            status: true,
            matches: {
              include: {
                homeTeam: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                awayTeam: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                events: {
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
            },
          },
        },
      },
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
  { params }: { params: { id: string; seasonId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const season = await prisma.season.findFirst({
      where: {
        id: params.seasonId,
        leagueId: params.id,
        league: {
          ownerId: session.user.id,
        },
      },
    })

    if (!season) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const json = await req.json()

    const updatedSeason = await prisma.season.update({
      where: {
        id: params.seasonId,
      },
      data: {
        name: json.name,
        startDate: json.startDate ? new Date(json.startDate) : undefined,
        endDate: json.endDate ? new Date(json.endDate) : undefined,
        rules: json.rules,
      },
    })

    return NextResponse.json(updatedSeason)
  } catch (error) {
    console.error("[SEASON_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; seasonId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const season = await prisma.season.findFirst({
      where: {
        id: params.seasonId,
        leagueId: params.id,
        league: {
          ownerId: session.user.id,
        },
      },
    })

    if (!season) {
      return new NextResponse("Not Found", { status: 404 })
    }

    await prisma.season.delete({
      where: {
        id: params.seasonId,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[SEASON_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 