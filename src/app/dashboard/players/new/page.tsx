"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Player = {
  name: string
  email: string
}

type League = {
  id: string
  name: string
}

export default function NewPlayer() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([{ name: "", email: "" }])
  const [leagues, setLeagues] = useState<League[]>([])
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(true)

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const response = await fetch("/api/leagues")
        if (!response.ok) {
          throw new Error("Failed to fetch leagues")
        }
        const data = await response.json()
        setLeagues(data)
        if (data.length > 0) {
          setSelectedLeagueId(data[0].id)
        }
      } catch (error) {
        console.error("Error fetching leagues:", error)
        setError("Failed to fetch leagues")
      } finally {
        setIsLoadingLeagues(false)
      }
    }

    fetchLeagues()
  }, [])

  const handlePlayerChange = (index: number, field: keyof Player, value: string) => {
    const updatedPlayers = [...players]
    updatedPlayers[index] = { ...updatedPlayers[index], [field]: value }
    setPlayers(updatedPlayers)
  }

  const handleAddPlayer = () => {
    setPlayers([...players, { name: "", email: "" }])
  }

  const handleRemovePlayer = (index: number) => {
    if (players.length > 1) {
      const updatedPlayers = players.filter((_, i) => i !== index)
      setPlayers(updatedPlayers)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLeagueId) {
      setError("Please select a league")
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/leagues/${selectedLeagueId}/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ players }),
      })

      if (!response.ok) {
        throw new Error("Failed to add players")
      }

      router.push(`/dashboard/leagues/${selectedLeagueId}`)
    } catch (error) {
      console.error("Error adding players:", error)
      setError(error instanceof Error ? error.message : "Failed to add players")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingLeagues) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading leagues...</div>
      </div>
    )
  }

  if (leagues.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-4">No Leagues Found</h2>
          <p className="text-gray-600 mb-4">You need to create a league before adding players.</p>
          <Link
            href="/dashboard/leagues/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Create League
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add Players</h1>
          <Link
            href="/dashboard/leagues"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Back to Leagues
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="mb-4">
              <label htmlFor="league" className="block text-sm font-medium text-gray-700">
                Select League
              </label>
              <select
                id="league"
                value={selectedLeagueId}
                onChange={(e) => setSelectedLeagueId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                required
              >
                {leagues.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {players.map((player, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Player {index + 1}</h3>
                {players.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handlePlayerChange(index, "name", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                    placeholder="Enter player name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={player.email}
                    onChange={(e) => handlePlayerChange(index, "email", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                    placeholder="Enter player email"
                    required
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleAddPlayer}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              + Add Another Player
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? "Adding Players..." : "Add Players"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 