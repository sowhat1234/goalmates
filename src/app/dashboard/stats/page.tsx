"use client"

import { useSession } from "next-auth/react"
import useSWR from "swr"
import { useState } from "react"

type PersonalStats = {
  totalMatches: number
  totalGoals: number
  totalAssists: number
  winRate: number
  recentMatches: Array<{
    id: string
    date: string
    leagueName: string
    result: string
    goals: number
  }>
  achievements: Array<{
    id: string
    name: string
    description: string
    earnedDate: string
  }>
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export default function PersonalStatsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<"overview" | "matches" | "achievements">("overview")
  
  const { data: stats, error, isLoading } = useSWR<PersonalStats>(
    session?.user ? '/api/user/stats' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  )

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium text-red-600">Error</h3>
        <p className="mt-2 text-sm text-gray-500">Failed to load personal statistics</p>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Statistics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your performance and achievements across all leagues
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(["overview", "matches", "achievements"] as const).map((tab) => (
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
            <h3 className="text-lg font-medium text-gray-900">Performance Overview</h3>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Matches</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {stats?.totalMatches || 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Goals Scored</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {stats?.totalGoals || 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Assists</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {stats?.totalAssists || 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Win Rate</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {stats?.winRate ? `${Math.round(stats.winRate * 100)}%` : '0%'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            <div className="mt-4 space-y-4">
              {stats?.recentMatches?.map((match) => (
                <div key={match.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{match.leagueName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(match.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      match.result === 'WIN' 
                        ? 'bg-green-100 text-green-800'
                        : match.result === 'LOSS'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {match.result}
                    </span>
                  </div>
                  {match.goals > 0 && (
                    <p className="mt-1 text-xs text-gray-600">
                      Goals scored: {match.goals}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "matches" && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Match History</h3>
            <div className="space-y-4">
              {stats?.recentMatches?.map((match) => (
                <div key={match.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{match.leagueName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(match.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      match.result === 'WIN' 
                        ? 'bg-green-100 text-green-800'
                        : match.result === 'LOSS'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {match.result}
                    </span>
                    {match.goals > 0 && (
                      <p className="mt-1 text-sm text-gray-600">
                        {match.goals} goals
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Achievements</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {stats?.achievements?.map((achievement) => (
                <div key={achievement.id} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">{achievement.name}</h4>
                  <p className="mt-1 text-sm text-gray-500">{achievement.description}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    Earned on {new Date(achievement.earnedDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 