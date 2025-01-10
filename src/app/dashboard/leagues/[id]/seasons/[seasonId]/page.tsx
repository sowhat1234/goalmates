"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import useSWR from "swr"
import { useState } from "react"

type Season = {
  id: string
  name: string
  startDate: string
  endDate: string
  pointsSystem: {
    win: number
    draw: number
    loss: number
  }
  teamSize: number
  teamsPerMatch: number
  fixtures: Array<{
    id: string
    date: string
    status: string
  }>
  matches: Array<{
    id: string
    date: string
    status: string
  }>
}

const defaultPointsSystem = {
  win: 3,
  draw: 1,
  loss: 0
}

// Fetch function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch season')
  const data = await res.json()
  return {
    ...data,
    pointsSystem: data.pointsSystem || defaultPointsSystem
  }
}

export default function SeasonPage() {
  const params = useParams()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const isLeagueManager = session?.user?.role === 'LEAGUE_MANAGER'
  const canManageSeason = isAdmin || isLeagueManager

  const { data: season, error, isLoading } = useSWR<Season>(
    params.id && params.seasonId ? `/api/leagues/${params.id}/seasons/${params.seasonId}` : null,
    fetcher,
    {
      revalidateOnFocus: false, // Don't refetch when window regains focus
      revalidateOnReconnect: false, // Don't refetch when browser regains connection
      dedupingInterval: 60000, // Cache data for 1 minute
    }
  )

  const [activeTab, setActiveTab] = useState<"overview" | "fixtures" | "standings" | "stats">("overview")

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium text-red-600">Error</h3>
        <p className="mt-2 text-sm text-gray-500">Failed to load season data</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!season) {
    return <div>Season not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/dashboard/leagues/${params.id}`}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Back to League
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">{season.name}</h1>
          <p className="text-sm text-gray-500">
            {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
          </p>
        </div>
        {canManageSeason && (
          <Link
            href={`/dashboard/leagues/${params.id}/seasons/${season.id}/fixtures/new`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Fixture
          </Link>
        )}
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(["overview", "fixtures", "standings", "stats"] as const).map((tab) => (
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
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">Season Rules</h3>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Points System</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  Win: {season.pointsSystem.win} / Draw: {season.pointsSystem.draw} / Loss: {season.pointsSystem.loss}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Team Size</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {season.teamSize} players {season.teamsPerMatch > 2 && "(Asymmetric teams allowed)"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Teams per Match</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  Maximum {season.teamsPerMatch} teams
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">Quick Stats</h3>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Fixtures</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {season.fixtures?.length || 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Matches</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {season.matches?.length || 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">WOW Moments</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">0</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {canManageSeason && (
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Danger Zone</h3>
          <p className="text-sm text-red-600 mb-4">
            Once you delete a season, there is no going back. Please be certain.
          </p>
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this season? This action cannot be undone.")) {
                // Add delete functionality
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete Season
          </button>
        </div>
      )}
    </div>
  )
} 