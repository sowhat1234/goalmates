"use client"

import { useState } from "react"
import { FaTshirt } from "react-icons/fa"

interface Player {
  id: string
  name: string
}

interface TeamPlayer {
  player: Player
}

interface Team {
  id: string
  name: string
  players: TeamPlayer[]
  color?: string
}

interface Match {
  id: string
  homeTeam: Team
  awayTeam: Team
  waitingTeam: Team
}

interface TeamSelectionProps {
  match: Match
  onStart: (homeTeamId: string, awayTeamId: string, waitingTeamId: string) => void
}

export function TeamSelection({ match, onStart }: TeamSelectionProps) {
  const [selectedTeams, setSelectedTeams] = useState<{
    home: string | null
    away: string | null
  }>({
    home: null,
    away: null
  })

  const allTeams = [match.homeTeam, match.awayTeam, match.waitingTeam]

  function getTeamColor(team: Team): { fill: string, text: string } {
    const colorMap: { [key: string]: { fill: string, text: string } } = {
      red: { fill: '#ef4444', text: 'text-red-500' },
      blue: { fill: '#3b82f6', text: 'text-blue-500' },
      green: { fill: '#22c55e', text: 'text-green-500' },
      yellow: { fill: '#eab308', text: 'text-yellow-500' },
      purple: { fill: '#a855f7', text: 'text-purple-500' },
      pink: { fill: '#ec4899', text: 'text-pink-500' }
    }
    return colorMap[team.color || 'red'] || colorMap.red
  }

  const handleTeamSelect = (teamId: string, position: 'home' | 'away') => {
    setSelectedTeams(prev => {
      // If this team is already selected somewhere else, remove it
      if (prev.home === teamId) {
        return { ...prev, home: null }
      }
      if (prev.away === teamId) {
        return { ...prev, away: null }
      }

      // If this position already has a team, swap them
      return { ...prev, [position]: teamId }
    })
  }

  const getWaitingTeamId = (): string | null => {
    return allTeams.find(team => 
      team.id !== selectedTeams.home && 
      team.id !== selectedTeams.away
    )?.id || null
  }

  const handleStart = () => {
    const waitingTeamId = getWaitingTeamId()
    if (selectedTeams.home && selectedTeams.away && waitingTeamId) {
      onStart(selectedTeams.home, selectedTeams.away, waitingTeamId)
    }
  }

  return (
    <div className="container mx-auto p-6 bg-white">
      <h2 className="text-xl font-bold mb-6 text-gray-900">Select Starting Teams</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Home Team Selection */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Home Team</h3>
          <div className="space-y-4">
            {allTeams.map(team => (
              <button
                key={team.id}
                onClick={() => handleTeamSelect(team.id, 'home')}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  selectedTeams.home === team.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <FaTshirt 
                    style={{ fill: getTeamColor(team).fill }}
                    className="w-8 h-8"
                  />
                  <span className={`font-medium ${getTeamColor(team).text}`}>
                    {team.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Away Team Selection */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Away Team</h3>
          <div className="space-y-4">
            {allTeams.map(team => (
              <button
                key={team.id}
                onClick={() => handleTeamSelect(team.id, 'away')}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  selectedTeams.away === team.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <FaTshirt 
                    style={{ fill: getTeamColor(team).fill }}
                    className="w-8 h-8"
                  />
                  <span className={`font-medium ${getTeamColor(team).text}`}>
                    {team.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Waiting Team Preview */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Waiting Team</h3>
          {getWaitingTeamId() ? (
            <div className="p-4 rounded-lg bg-gray-50">
              {allTeams.map(team => team.id === getWaitingTeamId() && (
                <div key={team.id} className="flex items-center gap-4">
                  <FaTshirt 
                    style={{ fill: getTeamColor(team).fill }}
                    className="w-8 h-8 opacity-70"
                  />
                  <span className={`font-medium ${getTeamColor(team).text}`}>
                    {team.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-gray-50 text-gray-500">
              Select home and away teams first
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleStart}
          disabled={!selectedTeams.home || !selectedTeams.away}
          className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Match
        </button>
      </div>
    </div>
  )
} 