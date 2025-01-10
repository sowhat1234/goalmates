import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createMockPlayers() {
  try {
    console.log('Creating mock players...')

    // Create 15 mock users (for 3 teams of 5 players)
    const mockUsers = []
    for (let i = 1; i <= 15; i++) {
      const user = await prisma.user.create({
        data: {
          email: `mockplayer${i}@test.com`,
          name: `Player ${i}`,
          role: 'USER',
        }
      })
      mockUsers.push(user)
      console.log(`Created mock user: ${user.name} (${user.email})`)
    }

    // Get the league you want to add players to
    const league = await prisma.league.findFirst({
      where: {
        name: 'Premier League'
      }
    })

    if (!league) {
      console.log('League not found. Please create a league first.')
      return
    }

    // Add players to the league (5 players per team)
    for (let i = 0; i < mockUsers.length; i++) {
      const player = await prisma.player.create({
        data: {
          name: mockUsers[i].name || `Player ${i + 1}`,
          userId: mockUsers[i].id,
          leagueId: league.id
        }
      })
      console.log(`Added ${player.name} to Team ${Math.floor(i / 5) + 1}`)
    }

    // Verify the results
    const verifyLeague = await prisma.league.findUnique({
      where: { id: league.id },
      include: {
        players: {
          include: {
            user: true
          }
        }
      }
    })

    if (!verifyLeague) {
      console.log('Failed to verify league')
      return
    }

    console.log('\n=== League Status ===')
    console.log(`League: ${verifyLeague.name}`)
    console.log(`Total players: ${verifyLeague.players.length}`)
    
    // Group players by team (5 players per team)
    const teams: { [key: number]: string[] } = {}
    verifyLeague.players.forEach((player, index) => {
      const teamNumber = Math.floor(index / 5) + 1
      if (!teams[teamNumber]) {
        teams[teamNumber] = []
      }
      teams[teamNumber].push(player.name)
    })

    // Display teams
    Object.entries(teams).forEach(([team, players]) => {
      console.log(`\nTeam ${team} (${players.length} players):`)
      players.forEach(name => console.log(`- ${name}`))
    })

  } catch (error) {
    console.error('Error creating mock players:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createMockPlayers() 