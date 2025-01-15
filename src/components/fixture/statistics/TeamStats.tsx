'use client'

import { Team, Event } from '@/types/fixture.types'
import { getTeamColor } from '@/lib/utils/team-utils'
import { FaFutbol, FaHandPaper, FaTrophy } from 'react-icons/fa'

interface TeamStatsProps {
  teams: Team[]
  events: Event[]
  currentMatchId?: string  // Optional to maintain backward compatibility
}

export function TeamStats({ teams, events, currentMatchId }: TeamStatsProps) {
  const getTeamStats = (teamId: string) => {
    const teamEvents = events?.filter(event => {
      const isTeamEvent = event?.team === teamId
      const isCurrentMatch = !currentMatchId || event?.matchId === currentMatchId
      return isTeamEvent && isCurrentMatch
    }) || []

    return {
      goals: teamEvents.filter(e => e?.type === 'GOAL').length,
      saves: teamEvents.filter(e => e?.type === 'SAVE').length,
      wins: teamEvents.filter(e => e?.type === 'WIN').length
    }
  }

  // Filter out any undefined teams
  const validTeams = teams?.filter(team => team && team.id) || []

  if (validTeams.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Team Statistics</h2>
        <p className="text-gray-500 text-center py-4">No teams available</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Team Statistics</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Team</th>
              <th className="text-center py-3 px-4 text-gray-700 font-semibold">
                <div className="flex items-center justify-center gap-2">
                  <FaFutbol className="text-blue-500" />
                  <span>Goals</span>
                </div>
              </th>
              <th className="text-center py-3 px-4 text-gray-700 font-semibold">
                <div className="flex items-center justify-center gap-2">
                  <FaHandPaper className="text-green-500" />
                  <span>Saves</span>
                </div>
              </th>
              <th className="text-center py-3 px-4 text-gray-700 font-semibold">
                <div className="flex items-center justify-center gap-2">
                  <FaTrophy className="text-yellow-500" />
                  <span>Wins</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {validTeams.map(team => {
              const stats = getTeamStats(team.id)
              const teamColor = getTeamColor(team)
              return (
                <tr key={team.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0 border border-gray-200" 
                        style={{ backgroundColor: teamColor.fill }} 
                      />
                      <span className={`font-medium ${teamColor.text}`}>{team.name}</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`inline-flex items-center justify-center min-w-[2rem] font-semibold py-1 rounded-full
                      ${stats.goals > 0 ? 'text-blue-600 bg-blue-50' : 'text-gray-500 bg-gray-50'}`}>
                      {stats.goals}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`inline-flex items-center justify-center min-w-[2rem] font-semibold py-1 rounded-full
                      ${stats.saves > 0 ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-50'}`}>
                      {stats.saves}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`inline-flex items-center justify-center min-w-[2rem] font-semibold py-1 rounded-full
                      ${stats.wins > 0 ? 'text-yellow-600 bg-yellow-50' : 'text-gray-500 bg-gray-50'}`}>
                      {stats.wins}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
} 