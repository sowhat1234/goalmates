import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Check authentication
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check authorization (only ADMIN and LEAGUE_MANAGER can delete)
    if (session.user.role !== 'ADMIN' && session.user.role !== 'LEAGUE_MANAGER') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const { id } = params

    // Delete the player (stats will be automatically deleted due to cascade)
    await prisma.player.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting player:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 