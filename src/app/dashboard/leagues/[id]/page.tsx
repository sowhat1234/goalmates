"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"

type JoinRequest = {
  id: string
  user: {
    name: string | null
    email: string | null
  }
  status: string
  createdAt: string
}

type LeagueStats = {
  totalPlayers: number
  totalSeasons: number
}

type League = {
  id: string
  name: string
  ownerId: string
}

export default function LeaguePage() {
  const { data: session } = useSession()
  const params = useParams()
  const [league, setLeague] = useState<League | null>(null)
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [stats, setStats] = useState<LeagueStats>({ totalPlayers: 0, totalSeasons: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [leagueResponse, requestsResponse, statsResponse] = await Promise.all([
          fetch(`/api/leagues/${params.id}`),
          fetch(`/api/leagues/${params.id}/join-requests`),
          fetch(`/api/leagues/${params.id}/stats`),
        ])

        if (!leagueResponse.ok) throw new Error('Failed to fetch league')
        if (!requestsResponse.ok) throw new Error('Failed to fetch join requests')
        if (!statsResponse.ok) throw new Error('Failed to fetch league statistics')

        const [leagueData, requestsData, statsData] = await Promise.all([
          leagueResponse.json(),
          requestsResponse.json(),
          statsResponse.json(),
        ])

        setLeague(leagueData)
        setJoinRequests(requestsData)
        setStats(statsData)
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

  const handleJoinRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch(`/api/leagues/${params.id}/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to update join request')
      }

      // Remove the request from the list
      setJoinRequests(joinRequests.filter(request => request.id !== requestId))

      // If accepted, increment the player count and trigger a leagues refetch
      if (action === 'accept') {
        setStats(prev => ({
          ...prev,
          totalPlayers: prev.totalPlayers + 1
        }))
        
        // Trigger a refetch of the user's leagues
        const leaguesResponse = await fetch('/api/leagues')
        if (leaguesResponse.ok) {
          // This will update the leagues cache in the background
          await leaguesResponse.json()
        }
      }
    } catch (error) {
      console.error('Error updating join request:', error)
      setError(error instanceof Error ? error.message : 'Failed to update join request')
    }
  }

  const isAdmin = session?.user?.role === 'ADMIN'
  const isOwner = league?.ownerId === session?.user?.id
  const canManageLeague = isAdmin || isOwner

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">{league?.name || 'Loading...'}</h1>
        {canManageLeague && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/dashboard/leagues/${params.id}/seasons/new`}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              New Season
            </Link>
            <Link
              href={`/dashboard/leagues/${params.id}/players/new`}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Player
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-nowrap overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-gray-200">
        <Link
          href={`/dashboard/leagues/${params.id}`}
          className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600 whitespace-nowrap mr-8"
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
          className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 whitespace-nowrap"
        >
          Players
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900">Statistics</h2>
            <dl className="mt-5 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 px-4 py-5 rounded-lg">
                <dt className="text-sm font-medium text-gray-500">Total Players</dt>
                <dd className="mt-1 text-2xl sm:text-3xl font-semibold text-gray-900">{stats.totalPlayers}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 rounded-lg">
                <dt className="text-sm font-medium text-gray-500">Total Seasons</dt>
                <dd className="mt-1 text-2xl sm:text-3xl font-semibold text-gray-900">{stats.totalSeasons}</dd>
              </div>
            </dl>
          </div>
        </div>

        {canManageLeague && (
          <div>
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Join Requests</h2>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : error ? (
                <div className="text-center py-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              ) : joinRequests.length === 0 ? (
                <p className="text-sm text-gray-500">No pending requests</p>
              ) : (
                <div className="space-y-4">
                  {joinRequests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {request.user.name || request.user.email}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Requested {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleJoinRequest(request.id, 'reject')}
                          className="flex-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleJoinRequest(request.id, 'accept')}
                          className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 