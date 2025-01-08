"use client"

import { useState, useEffect } from "react"
import { FaFutbol, FaHandsHelping, FaShieldAlt } from "react-icons/fa"
import { IconType } from "react-icons"

interface PlayerStats {
  id: string
  name: string
  league: {
    id: string
    name: string
  }
  stats: {
    goals: number
    assists: number
    saves: number
    yellowCards: number
    redCards: number
    wowMoments: number
  }
}

interface LeagueStats {
  id: string
  name: string
  totalMatches: number
  totalGoals: number
  totalAssists: number
  totalSaves: number
}

export default function StatisticsDashboard() {
  const [topScorers, setTopScorers] = useState<PlayerStats[]>([])
  const [topAssists, setTopAssists] = useState<PlayerStats[]>([])
  const [topSaves, setTopSaves] = useState<PlayerStats[]>([])
  const [leagueStats, setLeagueStats] = useState<LeagueStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch('/api/statistics')
        if (!response.ok) throw new Error('Failed to fetch statistics')
        const data = await response.json()
        setTopScorers(data.topScorers)
        setTopAssists(data.topAssists)
        setTopSaves(data.topSaves)
        setLeagueStats(data.leagueStats)
      } catch (error) {
        console.error('Error fetching statistics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatistics()
  }, [])

  const StatCard = ({ title, icon: Icon, stats }: { title: string; icon: IconType; stats: PlayerStats[] }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center mb-4">
          <Icon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex space-x-4">
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {stats.slice(0, 5).map((player, index) => (
              <div key={player.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                  <span className="text-sm font-medium text-gray-900">{player.name}</span>
                  <span className="text-xs text-gray-500 ml-2">({player.league.name})</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {title === 'Top Scorers' ? player.stats.goals :
                   title === 'Top Assists' ? player.stats.assists :
                   player.stats.saves}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Statistics</h1>
          <p className="mt-2 text-sm text-gray-700">
            Overall statistics and leaderboards across all your leagues.
          </p>
        </div>
      </div>

      {/* Leaderboards Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Top Scorers" icon={FaFutbol} stats={topScorers} />
        <StatCard title="Top Assists" icon={FaHandsHelping} stats={topAssists} />
        <StatCard title="Top Saves" icon={FaShieldAlt} stats={topSaves} />
      </div>

      {/* League Statistics */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">League Statistics</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white shadow rounded-lg p-5">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : (
            leagueStats.map((league) => (
              <div key={league.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <h3 className="text-sm font-medium text-gray-500">{league.name}</h3>
                  <dl className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Matches</dt>
                      <dd className="mt-1 text-lg font-medium text-gray-900">{league.totalMatches}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Goals</dt>
                      <dd className="mt-1 text-lg font-medium text-gray-900">{league.totalGoals}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Assists</dt>
                      <dd className="mt-1 text-lg font-medium text-gray-900">{league.totalAssists}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Saves</dt>
                      <dd className="mt-1 text-lg font-medium text-gray-900">{league.totalSaves}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 