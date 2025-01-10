import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestLeague() {
  try {
    // Create a test league with a different owner
    const testLeague = await prisma.league.create({
      data: {
        name: 'Premier League',
        description: 'The most exciting football league',
        owner: {
          connect: {
            email: 'emiliu1234e@gmail.com' // Current owner's email
          }
        }
      }
    })
    console.log('Created test league:', testLeague)

    // Create another league with a different owner
    const anotherLeague = await prisma.league.create({
      data: {
        name: 'La Liga',
        description: 'Spanish football at its best',
        owner: {
          create: {
            email: 'test.manager@example.com',
            name: 'Test Manager',
            role: 'LEAGUE_MANAGER'
          }
        }
      }
    })
    console.log('Created another league:', anotherLeague)

  } catch (error) {
    console.error('Error creating test leagues:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestLeague() 