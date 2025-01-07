"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

interface NewPlayerForm {
  name: string
  email: string
}

export default function NewPlayerPage() {
  const params = useParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [players, setPlayers] = useState<NewPlayerForm[]>([
    { name: "", email: "" }
  ])

  const handleAddPlayer = () => {
    setPlayers([...players, { name: "", email: "" }])
  }

  const handleRemovePlayer = (index: number) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index))
    }
  }

  const handlePlayerChange = (index: number, field: keyof NewPlayerForm, value: string) => {
    const newPlayers = [...players]
    newPlayers[index][field] = value
    setPlayers(newPlayers)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Filter out empty entries
      const validPlayers = players.filter(p => p.name.trim() && p.email.trim())
      
      if (validPlayers.length === 0) {
        throw new Error("Please add at least one player")
      }

      const response = await fetch(`/api/leagues/${params.id}/players/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players: validPlayers })
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      router.push(`/dashboard/leagues/${params.id}`)
      router.refresh()
    } catch (error) {
      console.error("Failed to add players:", error)
      setError(error instanceof Error ? error.message : "Failed to add players")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add Players</h1>
          <Link
            href={`/dashboard/leagues/${params.id}`}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Back to League
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
              className={`bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? "Adding Players..." : "Add Players"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 