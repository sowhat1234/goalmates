import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type RouteParams = Promise<{ id: string }>

export async function GET(
  request: Request,
  props: { params: RouteParams }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const params = await props.params
    const { id } = params

    const seasons = await prisma.season.findMany({
      where: {
        leagueId: id,
        league: {
          ownerId: session.user.id,
        },
      },
      orderBy: {
        startDate: "desc",
      },
    })

    return NextResponse.json(seasons)
  } catch (error) {
    console.error("[SEASONS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(
  request: Request,
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

    const json = await request.json()

    const season = await prisma.season.create({
      data: {
        name: json.name,
        startDate: json.startDate ? new Date(json.startDate) : new Date(),
        endDate: json.endDate ? new Date(json.endDate) : new Date(),
        rules: json.rules,
        leagueId: id,
      },
    })

    return NextResponse.json(season)
  } catch (error) {
    console.error("[SEASONS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 