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

    const league = await prisma.league.findFirst({
      where: {
        id: id,
        ownerId: session.user.id,
      },
      include: {
        seasons: {
          orderBy: {
            startDate: "desc",
          },
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
        players: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!league) {
      return new NextResponse("Not Found", { status: 404 })
    }

    return NextResponse.json(league)
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
        ownerId: session.user.id,
      },
    })

    if (!league) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const updatedLeague = await prisma.league.update({
      where: {
        id: id,
      },
      data: {
        name: json.name,
        description: json.description,
      },
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
        ownerId: session.user.id,
      },
    })

    if (!league) {
      return new NextResponse("Not Found", { status: 404 })
    }

    await prisma.league.delete({
      where: {
        id: id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[LEAGUE_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 