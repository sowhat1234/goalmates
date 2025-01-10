"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

type League = {
  id: string
  name: string
  description: string | null
  owner: {
    name: string | null
  }
  players: { id: string }[]
  hasPendingRequest: boolean
  _count: {
    players: number
  }
}

export default function AvailableLeaguesPage() {
  const { data: session } = useSession()
  const [leagues, setLeagues] = useState<League[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joiningLeagueId, setJoiningLeagueId] = useState<string | null>(null)

  useEffect(() => {
    const fetchAvailableLeagues = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/leagues/available')
        if (!response.ok) throw new Error('Failed to fetch available leagues')
        const data = await response.json()
        setLeagues(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error fetching available leagues:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch available leagues')
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user) {
      fetchAvailableLeagues()
    }
  }, [session])

  const handleJoinRequest = async (leagueId: string) => {
    try {
      setJoiningLeagueId(leagueId)
      setError(null)
      
      const response = await fetch('/api/leagues/join-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leagueId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send join request')
      }
      
      // Update the league's status in the list
      setLeagues(leagues.map(league => 
        league.id === leagueId 
          ? { ...league, hasPendingRequest: true }
          : league
      ))
    } catch (error) {
      console.error('Error sending join request:', error)
      setError(error instanceof Error ? error.message : 'Failed to send join request. Please try again.')
    } finally {
      setJoiningLeagueId(null)
    }
  }

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Available Leagues</h1>
      <p className="text-gray-600 mb-8">Browse and join available leagues in your area</p>

      {leagues.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">No Available Leagues</h3>
          <p className="mt-2 text-sm text-gray-500">There are currently no leagues available to join.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {leagues.map((league) => (
            <div key={league.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">{league.name}</h3>
              {league.description && (
                <p className="mt-2 text-sm text-gray-600">{league.description}</p>
              )}
              <div className="mt-4 text-sm text-gray-500">
                <p>Managed by {league.owner.name || "Unknown"}</p>
                <p className="mt-1">{league._count.players} active players</p>
              </div>
              {league.hasPendingRequest ? (
                <div className="mt-4 text-sm text-yellow-800 border border-yellow-300 bg-yellow-50 rounded-md p-2 text-center">
                  Request Pending
                </div>
              ) : (
                <button
                  onClick={() => handleJoinRequest(league.id)}
                  disabled={joiningLeagueId === league.id}
                  className={`mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white 
                    ${joiningLeagueId === league.id 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                >
                  {joiningLeagueId === league.id ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending Request...
                    </>
                  ) : (
                    'Request to Join'
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 