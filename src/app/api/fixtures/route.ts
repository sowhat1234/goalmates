import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const fixtures = await prisma.fixture.findMany({
      where: {
        season: {
          league: {
            ownerId: session.user.id,
          },
        },
      },
      include: {
        season: {
          include: {
            league: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        matches: {
          include: {
            homeTeam: true,
            awayTeam: true,
            events: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(fixtures)
  } catch (error) {
    console.error("[FIXTURES_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 