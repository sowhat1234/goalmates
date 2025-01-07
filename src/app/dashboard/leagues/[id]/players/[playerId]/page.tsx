"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"

type Player = {
  id: string
  name: string
  stats?: {
    goals: number
    assists: number
    saves: number
    yellowCards: number
    redCards: number
    wowMoments: number
  }
}

export default function PlayerDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const [player, setPlayer] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlayer = async () => {
      if (!params?.id || !params?.playerId) {
        setError("Invalid player ID")
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/leagues/${params.id}/players/${params.playerId}`)
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || "Failed to fetch player")
        }
        const data = await response.json()
        setPlayer(data)
      } catch (error) {
        console.error("Error fetching player:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch player")
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user?.id) {
      fetchPlayer()
    }
  }, [params?.id, params?.playerId, session?.user?.id])

  if (isLoading) {
    return <div className="text-center">Loading...</div>
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/leagues/${params?.id}`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Back to League
          </Link>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="text-center text-red-600">{error}</div>
        </div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/leagues/${params?.id}`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Back to League
          </Link>
        </div>
        <div className="text-center">Player not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/leagues/${params.id}`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Back to League
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-2xl font-semibold text-gray-900">{player.name}</h1>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Player Stats Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-medium text-gray-900">Statistics</h3>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-sm text-gray-500">Goals</dt>
              <dd className="text-2xl font-semibold text-gray-900">
                {player.stats?.goals || 0}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Assists</dt>
              <dd className="text-2xl font-semibold text-gray-900">
                {player.stats?.assists || 0}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Saves</dt>
              <dd className="text-2xl font-semibold text-gray-900">
                {player.stats?.saves || 0}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Yellow Cards</dt>
              <dd className="text-2xl font-semibold text-gray-900">
                {player.stats?.yellowCards || 0}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Red Cards</dt>
              <dd className="text-2xl font-semibold text-gray-900">
                {player.stats?.redCards || 0}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">WOW Moments</dt>
              <dd className="text-2xl font-semibold text-gray-900">
                {player.stats?.wowMoments || 0}
              </dd>
            </div>
          </dl>
        </div>

        {/* Recent Activity Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  )
} 