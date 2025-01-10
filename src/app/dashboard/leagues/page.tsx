"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"

type League = {
  id: string
  name: string
  description: string | null
  owner: {
    name: string | null
  }
  players: { id: string }[]
  seasons: { id: string }[]
  _count: {
    players: number
    seasons: number
  }
}

export default function LeaguesPage() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [leagues, setLeagues] = useState<League[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/leagues')
        if (!response.ok) throw new Error('Failed to fetch leagues')
        const data = await response.json()
        setLeagues(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error fetching leagues:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch leagues')
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user) {
      fetchLeagues()
    }
  }, [session, refreshKey, pathname])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium text-red-600">Error</h3>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
      </div>
    )
  }

  const canCreateLeague = session?.user?.role === 'LEAGUE_MANAGER' || session?.user?.role === 'ADMIN'

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {canCreateLeague ? 'League Management' : 'My Leagues'}
        </h1>
        {canCreateLeague && (
          <Link
            href="/dashboard/leagues/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create League
          </Link>
        )}
      </div>

      {!leagues || leagues.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {canCreateLeague ? 'No leagues created yet' : 'No leagues joined yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {canCreateLeague 
              ? "Get started by creating a new league"
              : "Browse available leagues to join one"}
          </p>
          <div className="mt-6">
            {canCreateLeague ? (
              <Link
                href="/dashboard/leagues/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Create New League
              </Link>
            ) : (
              <Link
                href="/dashboard/leagues/available"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Browse Available Leagues
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {leagues.map((league) => (
            <Link
              key={league.id}
              href={`/dashboard/leagues/${league.id}`}
              className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-medium text-gray-900">{league.name}</h3>
              {league.description && (
                <p className="mt-2 text-sm text-gray-500">{league.description}</p>
              )}
              <div className="mt-4 flex flex-col space-y-2 text-sm text-gray-500">
                <p>Managed by {league.owner.name || "Unknown"}</p>
                <div className="flex space-x-4">
                  <span>{league._count.players} players</span>
                  <span>{league._count.seasons} seasons</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
} 