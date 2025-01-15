import { Suspense } from 'react'
import { FixtureClient } from '@/components/fixture/match/fixture-client'
import { FixtureLoading } from '@/components/fixture/FixtureLoading'
import { FixtureErrorBoundary } from '@/components/fixture/FixtureErrorBoundary'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Fixture } from '@/types/fixture.types'

interface PageProps {
  params: Promise<{
    id: string
    seasonId: string
    fixtureId: string
  }>
}

async function getFixture(id: string, seasonId: string, fixtureId: string): Promise<Fixture> {
  try {
    console.log('Fetching fixture:', { id, seasonId, fixtureId })
    
    // Get the session directly in the server component
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new Error('Unauthorized: No session or user')
    }

    // First check if user has access to the league
    const league = await prisma.league.findUnique({
      where: { id },
      include: {
        players: {
          where: {
            userId: session.user.id
          }
        }
      }
    })

    if (!league) {
      throw new Error('League not found')
    }

    const isOwner = league.ownerId === session.user.id
    const isPlayer = league.players.length > 0
    const isAdmin = session.user.role === "ADMIN"

    if (!isOwner && !isPlayer && !isAdmin) {
      throw new Error('Unauthorized: No access to league')
    }

    // Then fetch the fixture
    const fixture = await prisma.fixture.findFirst({
      where: {
        id: fixtureId,
        seasonId: seasonId,
        season: {
          league: {
            id,
          },
        },
      },
      include: {
        matches: {
          include: {
            homeTeam: {
              include: {
                players: {
                  include: {
                    player: true
                  }
                }
              }
            },
            awayTeam: {
              include: {
                players: {
                  include: {
                    player: true
                  }
                }
              }
            },
            waitingTeam: {
              include: {
                players: {
                  include: {
                    player: true
                  }
                }
              }
            },
            events: {
              include: {
                player: true,
                assistPlayer: true
              },
              orderBy: {
                createdAt: "desc"
              }
            }
          }
        }
      }
    })

    if (!fixture) {
      throw new Error('Fixture not found')
    }

    // Convert Date objects to ISO strings
    const serializedFixture: Fixture = {
      ...fixture,
      date: fixture.date.toISOString(),
      createdAt: fixture.createdAt.toISOString(),
      updatedAt: fixture.updatedAt.toISOString(),
      matches: fixture.matches.map(match => ({
        ...match,
        createdAt: match.createdAt.toISOString(),
        updatedAt: match.updatedAt.toISOString(),
        events: match.events
          .filter(event => event.playerId !== null)
          .map(event => ({
            ...event,
            playerId: event.playerId!,
            createdAt: event.createdAt.toISOString(),
            updatedAt: event.updatedAt.toISOString(),
            timestamp: event.timestamp?.toISOString() || null
          }))
      }))
    }

    console.log('Fixture data received:', serializedFixture.id)
    return serializedFixture
  } catch (error) {
    console.error('Error in getFixture:', error)
    throw error
  }
}

export default async function Page({ params }: PageProps) {
  try {
    // We need to await the params in Next.js 15
    const resolvedParams = await params
    console.log('Resolved params in page:', resolvedParams)

    const fixture = await getFixture(
      resolvedParams.id,
      resolvedParams.seasonId,
      resolvedParams.fixtureId
    )

    return (
      <FixtureErrorBoundary>
        <Suspense fallback={<FixtureLoading />}>
          <FixtureClient 
            fixture={fixture}
            id={resolvedParams.id}
            seasonId={resolvedParams.seasonId}
            fixtureId={resolvedParams.fixtureId}
          />
        </Suspense>
      </FixtureErrorBoundary>
    )
  } catch (error) {
    console.error('Error in page component:', error)
    throw error
  }
} 