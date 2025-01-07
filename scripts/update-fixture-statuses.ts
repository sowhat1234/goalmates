import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateFixtureStatuses() {
  try {
    // Get all fixtures with their matches and events
    const fixtures = await prisma.fixture.findMany({
      include: {
        matches: {
          include: {
            events: true
          }
        }
      }
    })

    console.log(`Found ${fixtures.length} fixtures to process`)

    for (const fixture of fixtures) {
      let status = 'NOT_STARTED'

      // If there are no matches or no events, it hasn't started
      if (fixture.matches.length && fixture.matches.some(match => match.events.length > 0)) {
        // If any match has events but no WIN event, it's in progress
        const hasUnfinishedMatch = fixture.matches.some(match => 
          match.events.length > 0 && !match.events.some(event => event.type === 'WIN')
        )

        if (hasUnfinishedMatch) {
          status = 'IN_PROGRESS'
        } else {
          // If all matches have WIN events, it's finished
          status = 'FINISHED'
        }
      }

      // Update the fixture status
      await prisma.fixture.update({
        where: { id: fixture.id },
        data: { status }
      })

      console.log(`Updated fixture ${fixture.id} to status: ${status}`)
    }

    console.log('Successfully updated all fixture statuses')
  } catch (error) {
    console.error('Error updating fixture statuses:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateFixtureStatuses() 