"use client"

import { useEffect, useState } from "react"

type JoinRequest = {
  id: string
  user: {
    name: string | null
    email: string | null
  }
  status: string
  createdAt: string
}

export function JoinRequests({ leagueId }: { leagueId: string }) {
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchJoinRequests = async () => {
      try {
        const response = await fetch(`/api/leagues/${leagueId}/join-requests`)
        if (!response.ok) throw new Error('Failed to fetch join requests')
        const data = await response.json()
        setJoinRequests(data)
      } catch (error) {
        console.error('Error fetching join requests:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchJoinRequests()
  }, [leagueId])

  const handleJoinRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch(`/api/leagues/${leagueId}/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) throw new Error('Failed to update join request')

      // Remove the request from the list
      setJoinRequests(joinRequests.filter(request => request.id !== requestId))
    } catch (error) {
      console.error('Error updating join request:', error)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Join Requests</h2>
      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
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
              <div className="mt-3 flex space-x-3">
                <button
                  onClick={() => handleJoinRequest(request.id, 'reject')}
                  className="flex-1 px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleJoinRequest(request.id, 'accept')}
                  className="flex-1 px-3 py-1 text-sm text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 