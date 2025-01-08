import { Suspense } from "react"
import { FixtureClient } from "./components/fixture-client"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Fixture as PrismaFixture, Team, Event } from "@prisma/client"

type SerializedFixture = Omit<PrismaFixture, 'date' | 'createdAt' | 'updatedAt'> & {
  date: string;
  createdAt: string;
  updatedAt: string;
  matches: {
    id: string;
    createdAt: string;
    updatedAt: string;
    homeTeam: Team & { players: any[] };
    awayTeam: Team & { players: any[] };
    waitingTeam: Team & { players: any[] };
    events: Array<Omit<Event, 'createdAt' | 'updatedAt' | 'timestamp'> & {
      createdAt: string;
      updatedAt: string;
      timestamp: string | null;
      playerId: string;
    }>;
  }[];
}

async function getFixtureData(id: string, seasonId: string, fixtureId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const fixture = await prisma.fixture.findFirst({
    where: {
      id: fixtureId,
      seasonId: seasonId,
      season: {
        league: {
          id: id,
          ownerId: session.user.id,
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
              player: true
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
    notFound()
  }

  // Convert dates to ISO strings to match the expected type
  return {
    ...fixture,
    date: fixture.date.toISOString(),
    createdAt: fixture.createdAt.toISOString(),
    updatedAt: fixture.updatedAt.toISOString(),
    matches: fixture.matches.map(match => ({
      ...match,
      createdAt: match.createdAt.toISOString(),
      updatedAt: match.updatedAt.toISOString(),
      events: match.events.map(event => ({
        ...event,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        timestamp: event.timestamp?.toISOString() || null
      }))
    }))
  } as SerializedFixture
}

type PageParams = Promise<{
  id: string
  seasonId: string
  fixtureId: string
}>

export default async function FixtureDetailPage({
  params
}: {
  params: PageParams
}) {
  try {
    const resolvedParams = await params
    const fixture = await getFixtureData(
      resolvedParams.id,
      resolvedParams.seasonId,
      resolvedParams.fixtureId
    )

    return (
      <div className="min-h-screen bg-gray-100">
        <Suspense fallback={<div className="text-center p-6">Loading...</div>}>
          <FixtureClient 
            fixture={fixture}
            id={resolvedParams.id}
            seasonId={resolvedParams.seasonId}
            fixtureId={resolvedParams.fixtureId}
          />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error('Error loading fixture:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Unauthorized</h2>
            <p className="text-gray-600">You do not have permission to view this fixture.</p>
          </div>
        </div>
      )
    }
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Fixture</h2>
          <p className="text-gray-600">There was a problem loading the fixture details. Please try again later.</p>
        </div>
      </div>
    )
  }
} 