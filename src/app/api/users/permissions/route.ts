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
    const { userId, canManageLeagues } = json

    // Only users who can manage leagues can update permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { canManageLeagues: true },
    })

    if (!currentUser?.canManageLeagues) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { canManageLeagues },
      select: {
        id: true,
        name: true,
        email: true,
        canManageLeagues: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("[USER_PERMISSIONS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        canManageLeagues: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("[USER_PERMISSIONS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 