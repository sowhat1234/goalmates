import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const { email, role } = json

    if (!email || !role || !['ADMIN', 'LEAGUE_MANAGER'].includes(role)) {
      return new NextResponse("Invalid input", { status: 400 })
    }

    // Update or create user with specified role
    const user = await prisma.user.upsert({
      where: { email },
      update: { role },
      create: {
        email,
        role,
        name: email.split('@')[0],
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("[ADMIN_CREATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 