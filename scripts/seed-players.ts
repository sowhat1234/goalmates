import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPlayers() {
  try {
    console.log('Starting to seed players...')

    // Get the league - replace this ID with your actual league ID
    const leagueId = 'cm6qm47re0036uf2c3z2uzfg1' // Your league ID here
    
    const league = await prisma.league.findUnique({
      where: { id: leagueId }
    })

    if (!league) {
      console.error('League not found!')
      return
    }

    const mockPlayers = [
        { name: "Asaf", email: "asaf@example.com" },
        { name: "Nissim", email: "nissim@example.com" },
        { name: "Oren Abudi", email: "oren@example.com" },
        { name: "Yuval", email: "yuval@example.com" },
        { name: "Avi", email: "avi@example.com" },
        { name: "Golan", email: "golan@example.com" },
        { name: "Tal Ben Ari", email: "tal@example.com" },
        { name: "Nir", email: "nir@example.com" },
        { name: "Ofer", email: "ofer@example.com" },
        { name: "Ran", email: "ran@example.com" },
        { name: "Matan", email: "matan@example.com" },
        { name: "Hari", email: "hari@example.com" },
        { name: "Iezra", email: "iezra@example.com" },
        { name: "Eyal", email: "eyal@example.com" },
        { name: "Dan Shemesh", email: "dan@example.com" },
        { name: "Amit Shamiss", email: "amit@example.com" },
        { name: "Avi Shem-tov", email: "avist@example.com" },
        { name: "Doron", email: "doron@example.com" },
        { name: "Eliav", email: "eliav@example.com" },
        { name: "Mazorya", email: "mazorya@example.com" },
        { name: "Omer", email: "omer@example.com" },
        { name: "Alon Shalil", email: "alon@example.com" },
        { name: "Itzik", email: "itzik@example.com" },
        { name: "Hagi", email: "hagi@example.com" },
        { name: "Asaf Karavany", email: "asafk@example.com" }
      ]
    // Create users and players
    for (const playerData of mockPlayers) {
      const user = await prisma.user.create({
        data: {
          name: playerData.name,
          email: playerData.email,
          role: 'USER',
        }
      })

      const player = await prisma.player.create({
        data: {
          name: playerData.name,
          userId: user.id,
          leagueId: leagueId,
        }
      })

      console.log(`Created player: ${player.name}`)
    }

    console.log('Seeding completed successfully!')
  } catch (error) {
    console.error('Error seeding players:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedPlayers()