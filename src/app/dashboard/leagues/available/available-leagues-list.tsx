"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface League {
  id: string
  name: string
  description: string | null
  owner: {
    name: string | null
  }
  _count: {
    players: number
  }
}

async function getAvailableLeagues(): Promise<League[]> {
  const response = await fetch("/api/leagues/available")
  if (!response.ok) {
    throw new Error("Failed to fetch available leagues")
  }
  return response.json()
}

export function AvailableLeaguesList() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null)
  const [joinMessage, setJoinMessage] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    getAvailableLeagues()
      .then(setLeagues)
      .catch((error) => {
        console.error("Failed to fetch leagues:", error)
        alert("Failed to load available leagues")
      })
      .finally(() => setLoading(false))
  }, [])

  const handleJoinRequest = async (league: League) => {
    try {
      setIsJoining(true)
      const response = await fetch(`/api/leagues/${league.id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: joinMessage,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit join request")
      }

      alert("Join request submitted successfully")
      setSelectedLeague(null)
      setJoinMessage("")
      setShowJoinDialog(false)
      
      // Remove the league from the list
      setLeagues((current) => current.filter((l) => l.id !== league.id))
    } catch (error) {
      console.error("Failed to join league:", error)
      alert("Failed to submit join request")
    } finally {
      setIsJoining(false)
    }
  }

  if (loading) {
    return <div>Loading available leagues...</div>
  }

  if (leagues.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No available leagues found.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {leagues.map((league) => (
          <div key={league.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4">
              <h3 className="text-lg font-semibold">{league.name}</h3>
              <p className="text-sm text-gray-500">
                Managed by {league.owner.name || "Unknown"}
              </p>
            </div>
            <div className="px-4 pb-4">
              <p className="text-sm text-gray-600">
                {league.description || "No description available"}
              </p>
              <p className="text-sm mt-2 text-gray-500">
                {league._count.players} active player{league._count.players !== 1 && "s"}
              </p>
            </div>
            <div className="px-4 pb-4">
              <button
                onClick={() => {
                  setSelectedLeague(league)
                  setShowJoinDialog(true)
                }}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                Request to Join
              </button>
            </div>
          </div>
        ))}
      </div>

      {showJoinDialog && selectedLeague && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-2">Join {selectedLeague.name}</h2>
            <p className="text-gray-600 mb-4">
              Send a request to join this league. The league manager will review your request.
            </p>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Message (Optional)
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Introduce yourself to the league manager..."
                  value={joinMessage}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJoinMessage(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowJoinDialog(false)
                    setSelectedLeague(null)
                    setJoinMessage("")
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleJoinRequest(selectedLeague)}
                  disabled={isJoining}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isJoining ? "Sending Request..." : "Send Join Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 