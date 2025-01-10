"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import useSWR from "swr"
import { fetcher } from "@/lib/utils"

interface Season {
  id: string
  name: string
  startDate: string
  endDate: string
  rules: {
    pointsForWin: number
    pointsForDraw: number
    pointsForLoss: number
  }
  fixtures: Array<{
    id: string
    date: string
    status: 'WAITING_TO_START' | 'IN_PROGRESS' | 'COMPLETED'
    matches: Array<{
      homeTeam: { name: string }
      awayTeam: { name: string }
    }>
  }>
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
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
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
                  Win: {season.rules.pointsForWin} / Draw: {season.rules.pointsForDraw} / Loss: {season.rules.pointsForLoss}
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
            </dl>
          </div>
        </div>
      )}

      {activeTab === "fixtures" && (
        <div className="bg-white shadow rounded-lg">
          {season.fixtures?.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">No Fixtures</h3>
              <p className="mt-2 text-sm text-gray-500">Get started by creating your first fixture.</p>
              {canManageSeason && (
                <div className="mt-6">
                  <Link
                    href={`/dashboard/leagues/${params.id}/seasons/${season.id}/fixtures/new`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Create Fixture
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teams
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {season.fixtures.map((fixture) => (
                    <tr key={fixture.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(fixture.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {fixture.matches[0]?.homeTeam.name} vs {fixture.matches[0]?.awayTeam.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          fixture.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : fixture.status === 'IN_PROGRESS'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {fixture.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/dashboard/leagues/${params.id}/seasons/${season.id}/fixtures/${fixture.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "standings" && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Standings</h3>
          <p className="mt-2 text-sm text-gray-500">Coming soon...</p>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Statistics</h3>
          <p className="mt-2 text-sm text-gray-500">Coming soon...</p>
        </div>
      )}
    </div>
  )
} 