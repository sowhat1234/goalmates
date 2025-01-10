"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

type DashboardStats = {
  totalLeagues: number
  totalPlayers: number
  totalMatches: number
  recentMatches: Array<{
    id: string
    date: string
    leagueName: string
    seasonName: string
    result: string
  }>
  upcomingFixtures: Array<{
    id: string
    date: string
    leagueName: string
    seasonName: string
  }>
}

const defaultStats: DashboardStats = {
  totalLeagues: 0,
  totalPlayers: 0,
  totalMatches: 0,
  recentMatches: [],
  upcomingFixtures: []
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>(defaultStats)
  const [isLoading, setIsLoading] = useState(true)

  const isAdmin = session?.user?.role === 'ADMIN'
  const isLeagueManager = session?.user?.role === 'LEAGUE_MANAGER'

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/dashboard/stats')
        if (!response.ok) throw new Error('Failed to fetch dashboard stats')
        const data = await response.json()
        setStats({
          ...defaultStats,
          ...data
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        setStats(defaultStats)
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user) {
      fetchDashboardStats()
    }
  }, [session])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {isAdmin ? 'Admin Dashboard' : isLeagueManager ? 'League Manager Dashboard' : 'My Dashboard'}
        </h1>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{isAdmin ? 'Leagues' : 'My Leagues'}</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.totalLeagues}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/dashboard/leagues" className="font-medium text-blue-700 hover:text-blue-900">
                {isAdmin ? 'View leagues' : 'View my leagues'}
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">My Matches</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.totalMatches}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/dashboard/stats" className="font-medium text-blue-700 hover:text-blue-900">
                View my stats
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Teammates</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.totalPlayers}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/dashboard/leagues/available" className="font-medium text-blue-700 hover:text-blue-900">
                Find more leagues
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Recent Matches</h3>
            <div className="mt-6 flow-root">
              {stats.recentMatches.length === 0 ? (
                <p className="text-sm text-gray-500">No recent matches</p>
              ) : (
                <ul className="-my-5 divide-y divide-gray-200">
                  {stats.recentMatches.map((match) => (
                    <li key={match.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {match.leagueName} - {match.seasonName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(match.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {match.result}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Upcoming Fixtures</h3>
            <div className="mt-6 flow-root">
              {stats.upcomingFixtures.length === 0 ? (
                <p className="text-sm text-gray-500">No upcoming fixtures</p>
              ) : (
                <ul className="-my-5 divide-y divide-gray-200">
                  {stats.upcomingFixtures.map((fixture) => (
                    <li key={fixture.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {fixture.leagueName} - {fixture.seasonName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(fixture.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 