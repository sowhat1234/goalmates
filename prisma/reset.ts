import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetDatabase() {
  try {
    // Delete events first since they have a required relation with matches
    console.log('🗑️ Deleting events...')
    await prisma.event.deleteMany()

    // Then delete matches which have team relationships
    console.log('🗑️ Deleting matches...')
    await prisma.match.deleteMany()

    console.log('🗑️ Deleting player teams...')
    await prisma.playerTeam.deleteMany()

    console.log('🗑️ Deleting teams...')
    await prisma.team.deleteMany()
    
    console.log('🗑️ Deleting players...')
    await prisma.player.deleteMany()
    
    console.log('🗑️ Deleting fixtures...')
    await prisma.fixture.deleteMany()
    
    console.log('🗑️ Deleting seasons...')
    await prisma.season.deleteMany()

    console.log('🗑️ Deleting join requests...')
    await prisma.joinRequest.deleteMany()
    
    console.log('🗑️ Deleting leagues...')
    await prisma.league.deleteMany()
    
    console.log('🗑️ Deleting sessions...')
    await prisma.session.deleteMany()
    
    console.log('🗑️ Deleting accounts...')
    await prisma.account.deleteMany()
    
    console.log('🗑️ Deleting users...')
    await prisma.user.deleteMany()

    console.log('✅ Database reset successful')
  } catch (error) {
    console.error('Error resetting database:', error)
    if (error instanceof Error) {
      console.error('Full error:', JSON.stringify(error, null, 2))
    }
  } finally {
    await prisma.$disconnect()
  }
}

resetDatabase() 