'use client'

import { Team, Event } from '@/types/fixture.types'
import { getTeamColor } from '@/lib/utils/team-utils'
import { FaFutbol, FaHandsHelping, FaHandPaper } from 'react-icons/fa'

interface PlayerStatsProps {
  teams: Team[]
  events: Event[]
  currentMatchId?: string  // Optional to maintain backward compatibility
}

export function PlayerStats({ teams, events, currentMatchId }: PlayerStatsProps) {
  const getPlayerStats = (playerId: string) => {
    const playerEvents = events.filter(event => 
      event.playerId === playerId && 
      (!currentMatchId || event.matchId === currentMatchId)
    )
    return {
      goals: playerEvents.filter(e => e.type === 'GOAL').length,
      assists: events.filter(e => 
        e.assistPlayerId === playerId && 
        (!currentMatchId || e.matchId === currentMatchId)
      ).length,
      saves: playerEvents.filter(e => e.type === 'SAVE').length
    }
  }

  // Get all players from all teams, filtering out any undefined players
  const allPlayers = teams
    .filter(team => team && team.players) // Filter out teams without players
    .flatMap(team => 
      team.players
        .filter(p => p && p.player) // Filter out undefined players
        .map(p => ({
          ...p.player,
          teamName: team.name,
          teamColor: getTeamColor(team).fill,
          teamTextColor: getTeamColor(team).text
        }))
    )

  if (allPlayers.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Player Statistics</h2>
        <p className="text-gray-500 text-center py-4">No players available</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Player Statistics</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-gray-700 font-semibold">Player</th>
              <th className="text-center py-3 px-4 text-gray-700 font-semibold">
                <div className="flex items-center justify-center gap-2">
                  <FaFutbol className="text-blue-500" />
                  <span>Goals</span>
                </div>
              </th>
              <th className="text-center py-3 px-4 text-gray-700 font-semibold">
                <div className="flex items-center justify-center gap-2">
                  <FaHandsHelping className="text-purple-500" />
                  <span>Assists</span>
                </div>
              </th>
              <th className="text-center py-3 px-4 text-gray-700 font-semibold">
                <div className="flex items-center justify-center gap-2">
                  <FaHandPaper className="text-green-500" />
                  <span>Saves</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {allPlayers.map(player => {
              const stats = getPlayerStats(player.id)
              return (
                <tr key={player.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0 border border-gray-200" 
                        style={{ backgroundColor: player.teamColor }} 
                      />
                      <span className="font-medium text-gray-900">{player.name}</span>
                      <span className={`text-sm ${player.teamTextColor}`}>({player.teamName})</span>
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
                      ${stats.assists > 0 ? 'text-purple-600 bg-purple-50' : 'text-gray-500 bg-gray-50'}`}>
                      {stats.assists}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`inline-flex items-center justify-center min-w-[2rem] font-semibold py-1 rounded-full
                      ${stats.saves > 0 ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-50'}`}>
                      {stats.saves}
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