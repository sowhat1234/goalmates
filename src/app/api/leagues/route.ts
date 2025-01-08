import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const createLeagueSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = createLeagueSchema.parse(json)

    const league = await prisma.league.create({
      data: {
        name: body.name,
        description: body.description,
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
        ownerId: session.user.id,
      },
      include: {
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