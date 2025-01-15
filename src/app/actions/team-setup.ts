'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

interface TeamSetupData {
  homeTeamId: string
  awayTeamId: string
  waitingTeamId: string
  fixtureId: string
}

export async function saveTeamSetup(data: TeamSetupData) {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Invalid data provided' }
  }

  try {
    const { homeTeamId, awayTeamId, waitingTeamId, fixtureId } = data

    if (!homeTeamId || !awayTeamId || !waitingTeamId || !fixtureId) {
      return { success: false, error: 'Missing required fields' }
    }

    // First find the match by fixtureId
    const match = await prisma.match.findFirst({
      where: { fixtureId }
    })

    if (!match) {
      return { success: false, error: 'Match not found' }
    }

    // Then update it
    const updatedMatch = await prisma.match.update({
      where: { id: match.id },
      data: {
        homeTeamId,
        awayTeamId,
        waitingTeamId,
      }
    })

    revalidatePath(`/fixtures/${fixtureId}`)
    return { success: true, match: updatedMatch }
  } catch (error) {
    console.error('Error saving team setup:', error)
    return { success: false, error: 'Failed to save team setup' }
  }
} 