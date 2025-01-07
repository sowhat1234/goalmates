"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

type League = {
  id: string
  name: string
  description: string | null
  seasons: Array<{
    id: string
    name: string
    startDate: string
    endDate: string
  }>
  players: Array<{
    id: string
    name: string
  }>
}

export default function LeagueDetail() {
  const params = useParams()
  const [league, setLeague] = useState<League | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "seasons" | "players">("overview")

  const fetchLeague = async () => {
    try {
      const response = await fetch(`/api/leagues/${params.id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch league")
      }
      const data = await response.json()
      setLeague(data)
    } catch (error) {
      console.error("Error fetching league:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch league")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeague()
  }, [fetchLeague])

  if (isLoading) {
    return <div className="text-center">Loading...</div>
  }

  if (!league) {
    return <div className="text-center">League not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{league.name}</h1>
          {league.description && (
            <p className="mt-1 text-sm text-gray-600">{league.description}</p>
          )}
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/leagues/${league.id}/seasons/new`}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
          >
            New Season
          </Link>
          <Link
            href={`/dashboard/leagues/${league.id}/players/new`}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Add Player
          </Link>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(["overview", "seasons", "players"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-1 pb-4 text-sm font-medium ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-medium text-gray-900">Statistics</h3>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-sm text-gray-500">Total Players</dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {league.players.length}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Total Seasons</dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {league.seasons.length}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {activeTab === "seasons" && (
        <div className="space-y-4">
          {league.seasons.map((season) => (
            <Link
              key={season.id}
              href={`/dashboard/leagues/${league.id}/seasons/${season.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-6 transition hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {season.name}
                </h3>
                <span className="text-sm text-gray-500">
                  {new Date(season.startDate).toLocaleDateString()} -{" "}
                  {new Date(season.endDate).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {activeTab === "players" && (
        <div className="space-y-4">
          {league.players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-6"
            >
              <h3 className="text-lg font-medium text-gray-900">
                {player.name}
              </h3>
              <Link
                href={`/dashboard/leagues/${league.id}/players/${player.id}`}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View Stats
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 