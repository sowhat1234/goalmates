"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface Player {
  id: string
  name: string
}

interface Team {
  id: 'home' | 'away' | 'waiting'
  name: string
  players: string[]
  maxPlayers: number
  color: string
}

type PageParams = Promise<{
  id: string
  seasonId: string
}>

export default function NewFixturePage({
  params,
}: {
  params: PageParams
}) {
  const router = useRouter()
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/api/auth/signin')
    },
  })
  const [date, setDate] = useState("")
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([
    { id: 'home', name: "Red Team", players: [], maxPlayers: 5, color: 'red' },
    { id: 'away', name: "Blue Team", players: [], maxPlayers: 5, color: 'blue' },
    { id: 'waiting', name: "Green Team", players: [], maxPlayers: 5, color: 'green' },
  ])
  const [loading, setLoading] = useState(false)
  const [playersLoading, setPlayersLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [resolvedParams, setResolvedParams] = useState<{ id: string; seasonId: string } | null>(null)

  useEffect(() => {
    // Resolve params when component mounts
    params.then(resolved => {
      setResolvedParams(resolved)
    })
  }, [params])

  const fetchPlayers = useCallback(async () => {
    if (!resolvedParams) return
    
    setPlayersLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/leagues/${resolvedParams.id}/players`)
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || "Failed to fetch players")
      }
      const data = await response.json()
      setPlayers(data)
    } catch (error) {
      console.error("Failed to fetch players:", error)
      setError(error instanceof Error ? error.message : "Failed to load players. Please try again.")
    } finally {
      setPlayersLoading(false)
    }
  }, [resolvedParams])

  useEffect(() => {
    if (session?.user?.id && resolvedParams) {
      fetchPlayers()
    }
  }, [session?.user?.id, resolvedParams, fetchPlayers])

  // Show loading state while session is loading
  if (status === "loading" || !resolvedParams) {
    return <div className="text-center">Loading...</div>
  }

  // Verify user is authenticated
  if (!session?.user?.id) {
    router.push('/api/auth/signin')
    return null
  }

  const handleSeedPlayers = async () => {
    setSeeding(true)
    try {
      const response = await fetch(`/api/leagues/${resolvedParams.id}/players/seed`, {
        method: "POST",
      })
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || "Failed to seed players")
      }
      await fetchPlayers()
    } catch (error) {
      console.error("Failed to seed players:", error)
      setError(error instanceof Error ? error.message : "Failed to seed players. Please try again.")
    } finally {
      setSeeding(false)
    }
  }

  const handleTeamNameChange = (teamId: Team['id'], newName: string) => {
    setTeams(prevTeams => 
      prevTeams.map(team => 
        team.id === teamId ? { ...team, name: newName } : team
      )
    )
  }

  const handleTeamColorChange = (teamId: Team['id'], newColor: string) => {
    setTeams(prevTeams => 
      prevTeams.map(team => 
        team.id === teamId ? { ...team, color: newColor } : team
      )
    )
  }

  const handlePlayerSelect = (teamId: Team['id'], playerId: string) => {
    setTeams(prevTeams => {
      const selectedTeam = prevTeams.find(t => t.id === teamId)
      
      // If player is already in this team, remove them
      if (selectedTeam?.players.includes(playerId)) {
        return prevTeams.map(team => 
          team.id === teamId 
            ? { ...team, players: team.players.filter(id => id !== playerId) }
            : team
        )
      }
      
      // Check if team is full
      if (selectedTeam && selectedTeam.players.length >= selectedTeam.maxPlayers) {
        alert(`${selectedTeam.name} is already full (max ${selectedTeam.maxPlayers} players)`)
        return prevTeams
      }

      // Remove player from any other team first
      const teamsWithoutPlayer = prevTeams.map(team => ({
        ...team,
        players: team.players.filter(id => id !== playerId)
      }))

      // Add player to selected team
      return teamsWithoutPlayer.map(team =>
        team.id === teamId
          ? { ...team, players: [...team.players, playerId] }
          : team
      )
    })
  }

  const getPlayerTeam = (playerId: string): Team['id'] | null => {
    for (const team of teams) {
      if (team.players.includes(playerId)) {
        return team.id
      }
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate teams have correct number of players
    const invalidTeam = teams.find(team => team.players.length !== team.maxPlayers)
    if (invalidTeam) {
      setError(`${invalidTeam.name} must have exactly ${invalidTeam.maxPlayers} players`)
      return
    }

    setLoading(true)
    try {
      // Clean up any existing localStorage data for old fixtures
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('fixture_teams_') || key?.startsWith('fixture_timer_')) {
          localStorage.removeItem(key);
        }
      }

      const response = await fetch(`/api/leagues/${resolvedParams.id}/seasons/${resolvedParams.seasonId}/fixtures`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          homeTeam: {
            name: teams.find(t => t.id === "home")?.name || "Home Team",
            color: teams.find(t => t.id === "home")?.color || "red",
            players: teams.find(t => t.id === "home")?.players || []
          },
          awayTeam: {
            name: teams.find(t => t.id === "away")?.name || "Away Team",
            color: teams.find(t => t.id === "away")?.color || "blue",
            players: teams.find(t => t.id === "away")?.players || []
          },
          waitingTeam: {
            name: teams.find(t => t.id === "waiting")?.name || "Waiting Team",
            color: teams.find(t => t.id === "waiting")?.color || "green",
            players: teams.find(t => t.id === "waiting")?.players || []
          }
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || "Failed to create fixture")
      }

      const newFixture = await response.json()
      
      // Store team configurations in localStorage
      localStorage.setItem(`fixture_teams_${newFixture.id}`, JSON.stringify({
        homeTeam: {
          name: teams.find(t => t.id === "home")?.name,
          color: teams.find(t => t.id === "home")?.color,
          players: teams.find(t => t.id === "home")?.players
        },
        awayTeam: {
          name: teams.find(t => t.id === "away")?.name,
          color: teams.find(t => t.id === "away")?.color,
          players: teams.find(t => t.id === "away")?.players
        },
        waitingTeam: {
          name: teams.find(t => t.id === "waiting")?.name,
          color: teams.find(t => t.id === "waiting")?.color,
          players: teams.find(t => t.id === "waiting")?.players
        }
      }))

      router.push(`/dashboard/leagues/${resolvedParams.id}/seasons/${resolvedParams.seasonId}/fixtures/${newFixture.id}`)
    } catch (error) {
      console.error("Failed to create fixture:", error)
      setError(error instanceof Error ? error.message : "Failed to create fixture. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 bg-white">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Create New Fixture</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="datetime-local"
            id="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              e.target.blur(); // This will close the picker after selection
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
            required
          />
        </div>

        {playersLoading ? (
          <div className="text-center py-4 text-gray-600">Loading players...</div>
        ) : players.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">No players found in this league.</p>
            <button
              type="button"
              onClick={handleSeedPlayers}
              disabled={seeding}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {seeding ? "Adding Mock Players..." : "Add 15 Mock Players"}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Teams */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {teams.map((team) => (
                <div key={team.id} className="border rounded-lg p-4 bg-white">
                  <div className="mb-4 space-y-4">
                    <input
                      type="text"
                      value={team.name}
                      onChange={(e) => handleTeamNameChange(team.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                      placeholder="Team Name"
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Team Color
                      </label>
                      <select
                        value={team.color}
                        onChange={(e) => handleTeamColorChange(team.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                      >
                        <option value="red">Red</option>
                        <option value="blue">Blue</option>
                        <option value="green">Green</option>
                        <option value="yellow">Yellow</option>
                        <option value="purple">Purple</option>
                        <option value="pink">Pink</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-500">
                      {team.players.length}/{team.maxPlayers} players
                    </span>
                  </div>
                  <div className="space-y-2">
                    {players.map((player) => {
                      const isSelected = team.players.includes(player.id)
                      const isInOtherTeam = getPlayerTeam(player.id) !== null && !isSelected
                      return (
                        <button
                          key={player.id}
                          type="button"
                          onClick={() => handlePlayerSelect(team.id, player.id)}
                          disabled={isInOtherTeam}
                          className={`w-full px-3 py-2 rounded-md text-left flex items-center space-x-2 ${
                            isSelected
                              ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                              : isInOtherTeam
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          } border`}
                        >
                          <span className="flex-grow">{player.name}</span>
                          {isSelected && (
                            <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || playersLoading || players.length === 0}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Fixture"}
          </button>
        </div>
      </form>
    </div>
  )
} 