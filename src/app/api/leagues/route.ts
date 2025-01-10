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

    const json = await request.json()
    const { name, description } = json

    if (!name || typeof name !== "string" || name.length < 1) {
      return new NextResponse("Invalid name", { status: 400 })
    }

    if (description && typeof description !== "string") {
      return new NextResponse("Invalid description", { status: 400 })
    }

    const league = await prisma.league.create({
      data: {
        name,
        description,
        ownerId: session.user.id,
      },
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

    const leagues = await prisma.league.findMany({
      where: {
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

    return NextResponse.json(leagues)
  } catch (error) {
    console.error("[LEAGUES_GET] Error:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 