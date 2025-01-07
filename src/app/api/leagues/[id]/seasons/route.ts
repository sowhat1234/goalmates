import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const createSeasonSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  rules: z.object({
    pointsForWin: z.number().int().min(0),
    pointsForDraw: z.number().int().min(0),
    pointsForLoss: z.number().int().min(0),
    teamSize: z.number().int().min(1),
    allowAsymmetricTeams: z.boolean(),
    maxTeamsPerMatch: z.number().int().min(2),
  }),
})

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Verify league ownership
    const league = await prisma.league.findFirst({
      where: {
        id: params.id,
        ownerId: session.user.id,
      },
    })

    if (!league) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const json = await req.json()
    const body = createSeasonSchema.parse(json)

    const season = await prisma.season.create({
      data: {
        name: body.name,
        startDate: body.startDate,
        endDate: body.endDate,
        rules: body.rules,
        leagueId: params.id,
      },
    })

    return NextResponse.json(season)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }

    console.error("[SEASONS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const seasons = await prisma.season.findMany({
      where: {
        leagueId: params.id,
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