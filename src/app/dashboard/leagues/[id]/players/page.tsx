"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"

type Player = {
  id: string
  name: string
  user: {
    name: string | null
    email: string | null
  }
  matches: number
  goals: number
  assists: number
}

type League = {
  id: string
  name: string
  ownerId: string
}

export default function PlayersPage() {
  const params = useParams()
  const { data: session } = useSession()
  const [players, setPlayers] = useState<Player[]>([])
  const [league, setLeague] = useState<League | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [playersResponse, leagueResponse] = await Promise.all([
          fetch(`/api/leagues/${params.id}/players`),
          fetch(`/api/leagues/${params.id}`)
        ])
        
        if (!playersResponse.ok) throw new Error('Failed to fetch players')
        if (!leagueResponse.ok) throw new Error('Failed to fetch league')
        
        const [playersData, leagueData] = await Promise.all([
          playersResponse.json(),
          leagueResponse.json()
        ])
        
        setPlayers(playersData)
        setLeague(leagueData)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch data')
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user) {
      fetchData()
    }
  }, [params.id, session])

  const isAdmin = session?.user?.role === 'ADMIN'
  const isOwner = league?.ownerId === session?.user?.id
  const canManageLeague = isAdmin || isOwner

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Players</h1>
        {canManageLeague && (
          <Link
            href={`/dashboard/leagues/${params.id}/players/new`}
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Player
          </Link>
        )}
      </div>

      <div className="flex flex-nowrap overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-gray-200">
        <Link
          href={`/dashboard/leagues/${params.id}`}
          className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 whitespace-nowrap mr-8"
        >
          Overview
        </Link>
        <Link
          href={`/dashboard/leagues/${params.id}/seasons`}
          className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 whitespace-nowrap mr-8"
        >
          Seasons
        </Link>
        <Link
          href={`/dashboard/leagues/${params.id}/players`}
          className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600 whitespace-nowrap"
        >
          Players
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-red-600">Error</h3>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">No Players</h3>
          <p className="mt-2 text-sm text-gray-500">Get started by adding your first player.</p>
          {canManageLeague && (
            <div className="mt-6">
              <Link
                href={`/dashboard/leagues/${params.id}/players/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Player
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matches
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Goals
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assists
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {players.map((player) => (
                  <tr key={player.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {player.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {player.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {player.matches}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {player.goals}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {player.assists}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/leagues/${params.id}/players/${player.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Stats
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
} 