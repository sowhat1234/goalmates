import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixLeagues() {
  try {
    // 1. Get all leagues
    const allLeagues = await prisma.league.findMany({
      include: {
        owner: true,
        players: {
          include: {
            user: true
          }
        },
        joinRequests: {
          include: {
            user: true
          }
        }
      }
    })

    console.log('\n=== Current League Status ===')
    console.log(`Total leagues: ${allLeagues.length}`)
    
    for (const league of allLeagues) {
      console.log(`\nLeague: ${league.name}`)
      console.log(`- Owner: ${league.owner.email}`)
      console.log(`- Players: ${league.players.length}`)
      console.log(`- Join Requests: ${league.joinRequests.length}`)
      console.log('- Players:', league.players.map(p => p.user?.email).filter(Boolean))
      console.log('- Join Requests:', league.joinRequests.map(jr => ({
        user: jr.user?.email,
        status: jr.status
      })))

      // Fix players with missing user references
      const invalidPlayers = league.players.filter(p => !p.user)
      if (invalidPlayers.length > 0) {
        console.log(`Found ${invalidPlayers.length} invalid players in league ${league.name}`)
        await prisma.player.deleteMany({
          where: {
            id: {
              in: invalidPlayers.map(p => p.id)
            }
          }
        })
        console.log('Deleted invalid players')
      }
    }

    // 2. Create a test league if none exist
    if (allLeagues.length === 0) {
      console.log('\nCreating a test league...')
      const testLeague = await prisma.league.create({
        data: {
          name: 'Test League',
          description: 'A test league for development',
          owner: {
            connect: {
              email: 'emilio.gutsan@gmail.com'
            }
          }
        }
      })
      console.log('Created test league:', testLeague)
    }

    // 3. Clean up any orphaned data
    console.log('\nCleaning up orphaned data...')
    
    // Delete join requests without valid users or leagues
    const deletedJoinRequests = await prisma.joinRequest.deleteMany({
      where: {
        OR: [
          { userId: { not: { in: await prisma.user.findMany().then(users => users.map(u => u.id)) } } },
          { leagueId: { not: { in: await prisma.league.findMany().then(leagues => leagues.map(l => l.id)) } } }
        ]
      }
    })
    console.log(`Deleted ${deletedJoinRequests.count} orphaned join requests`)

    // Delete player records without valid users or leagues
    const deletedPlayers = await prisma.player.deleteMany({
      where: {
        OR: [
          { userId: { not: { in: await prisma.user.findMany().then(users => users.map(u => u.id)) } } },
          { leagueId: { not: { in: await prisma.league.findMany().then(leagues => leagues.map(l => l.id)) } } }
        ]
      }
    })
    console.log(`Deleted ${deletedPlayers.count} orphaned players`)

    // 4. Verify the fix
    const verifyLeagues = await prisma.league.findMany({
      include: {
        owner: true,
        players: {
          include: {
            user: true
          }
        }
      }
    })

    console.log('\n=== After Cleanup ===')
    for (const league of verifyLeagues) {
      console.log(`\nLeague: ${league.name}`)
      console.log(`- Owner: ${league.owner.email}`)
      console.log(`- Players: ${league.players.length}`)
      console.log('- Player emails:', league.players.map(p => p.user?.email).filter(Boolean))
    }

  } catch (error) {
    console.error('Error fixing leagues:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixLeagues() 