"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from 'next/navigation'
import Link from "next/link"

type League = {
  id: string
  name: string
  description: string | null
  _count: {
    players: number
    seasons: number
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/api/auth/signin')
    },
  })
  const [isCreating, setIsCreating] = useState(false)
  const [leagueName, setLeagueName] = useState("")
  const [description, setDescription] = useState("")
  const [leagues, setLeagues] = useState<League[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchLeagues = async () => {
    try {
      const response = await fetch("/api/leagues")
      if (!response.ok) {
        throw new Error("Failed to fetch leagues")
      }
      const data = await response.json()
      setLeagues(data)
    } catch (error) {
      console.error("Error fetching leagues:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeagues()
  }, [])

  // Show loading state while session is loading
  if (status === "loading") {
    return <div className="text-center">Loading session...</div>
  }

  // Verify user is authenticated
  if (!session?.user?.id) {
    redirect('/api/auth/signin')
  }

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/leagues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: leagueName,
          description,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create league")
      }

      setIsCreating(false)
      setLeagueName("")
      setDescription("")
      fetchLeagues()
    } catch (error) {
      console.error("Error creating league:", error)
    }
  }

  const inputClassName = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">My Leagues</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
        >
          Create League
        </button>
      </div>

      {isCreating && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-700">
          <h2 className="mb-4 text-lg font-medium">Create New League</h2>
          <form onSubmit={handleCreateLeague} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                League Name
              </label>
              <input
                type="text"
                id="name"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                className={inputClassName}
                required
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={inputClassName}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {leagues.map((league) => (
            <Link
              key={league.id}
              href={`/dashboard/leagues/${league.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-6 transition hover:shadow-lg"
            >
              <h3 className="text-lg font-medium text-gray-900">{league.name}</h3>
              {league.description && (
                <p className="mt-2 text-sm text-gray-600">{league.description}</p>
              )}
              <div className="mt-4 flex gap-4 text-sm text-gray-500">
                <div>{league._count.players} players</div>
                <div>{league._count.seasons} seasons</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
} 