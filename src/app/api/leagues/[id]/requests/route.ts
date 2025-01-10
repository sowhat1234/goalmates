import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Verify league ownership
    const league = await prisma.league.findUnique({
      where: {
        id: params.id,
        ownerId: session.user.id,
      },
    })

    if (!league) {
      return new NextResponse("League not found or not authorized", { status: 404 })
    }

    // Get all join requests for the league
    const requests = await prisma.joinRequest.findMany({
      where: {
        leagueId: params.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error("[LEAGUE_REQUESTS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 