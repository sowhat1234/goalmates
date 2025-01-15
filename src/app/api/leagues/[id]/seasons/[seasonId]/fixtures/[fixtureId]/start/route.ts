import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: { id: string; seasonId: string; fixtureId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id, seasonId, fixtureId } = params

    // Verify league access
    const league = await prisma.league.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { players: { some: { userId: session.user.id } } }
        ]
      }
    })

    if (!league) {
      return new NextResponse("League not found", { status: 404 })
    }

    // Get the fixture
    const fixture = await prisma.fixture.findFirst({
      where: {
        id: fixtureId,
        seasonId,
        status: "NOT_STARTED"
      },
      include: {
        matches: true
      }
    })

    if (!fixture) {
      return new NextResponse("Fixture not found or already started", { status: 404 })
    }

    // Update fixture status to IN_PROGRESS
    const updatedFixture = await prisma.fixture.update({
      where: { id: fixtureId },
      data: {
        status: "IN_PROGRESS"
      },
      include: {
        matches: {
          include: {
            homeTeam: true,
            awayTeam: true,
            waitingTeam: true
          }
        }
      }
    })

    return NextResponse.json(updatedFixture)
  } catch (error) {
    console.error("[START_MATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 