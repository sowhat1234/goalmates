"use client"

import { FaTshirt } from "react-icons/fa"
import { BsHourglassSplit } from "react-icons/bs"
import { useTeamSetup } from "@/hooks/useTeamSetup"
import type { Match, Team, TeamPlayer, Player } from "@/types/fixture.types"
import { TEAM_COLORS } from "@/constants/game-rules"

interface TeamSelectionProps {
  match: Match
  onStart: (homeName: string, awayName: string, waitingName: string) => void
  fixtureId: string
}

export function TeamSelection({ match, onStart, fixtureId }: TeamSelectionProps) {
  const {
    teams,
    selectedTeams,
    handleTeamSelect,
    saveTeamConfigurations,
    handleSaveTeamSetup
  } = useTeamSetup({ match, fixtureId })

  const getTeamColor = (team: Team): { fill: string, text: string } => {
    return TEAM_COLORS[team.color || 'red'] || TEAM_COLORS.red
  }

  const handleStart = async () => {
    const teamA = teams.find(t => t.id === selectedTeams.teamA)
    const teamB = teams.find(t => t.id === selectedTeams.teamB)
    const waitingTeam = teams.find(t => t.id === selectedTeams.waiting)

    if (!teamA || !teamB || !waitingTeam) {
      alert('Please select all teams')
      return
    }

    try {
      console.log('Saving team setup with:', {
        homeTeamId: teamA.id,
        awayTeamId: teamB.id,
        waitingTeamId: waitingTeam.id,
        fixtureId
      })

      // Save configurations to localStorage
      saveTeamConfigurations(teamA, teamB, waitingTeam)
      
      // Save to database using server action
      const result = await handleSaveTeamSetup({
        homeTeamId: teamA.id,
        awayTeamId: teamB.id,
        waitingTeamId: waitingTeam.id,
        fixtureId
      })
      
      console.log('Team setup result:', result)

      if (!result.success) {
        throw new Error(result.error || 'Failed to save team setup')
      }

      // Call the onStart callback to trigger match start
      onStart(teamA.name, teamB.name, waitingTeam.name)
    } catch (error) {
      console.error('Error saving team setup:', error)
      alert('Failed to save team setup. Please try again.')
    }
  }

  const renderTeamSelector = (position: 'teamA' | 'teamB' | 'waiting') => {
    const selectedTeamId = selectedTeams[position]
    const selectedTeam = teams.find(t => t.id === selectedTeamId)
    const availableTeams = teams.filter(team => {
      return team.id === selectedTeamId || !Object.values(selectedTeams).includes(team.id)
    })

    return (
      <div className="mb-6">
        <select
          value={selectedTeamId || ''}
          onChange={(e) => handleTeamSelect(position, e.target.value)}
          className="w-full p-3 border rounded-md text-gray-900 bg-white text-lg mb-4"
        >
          <option value="">Select team</option>
          {availableTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>

        {selectedTeam && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <FaTshirt 
                style={{ fill: getTeamColor(selectedTeam).fill }}
                className={`w-16 h-16 ${position === 'waiting' ? 'opacity-70' : ''}`}
              />
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Players</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {selectedTeam.players.map(({ player }) => (
                  <div
                    key={player.id}
                    className="flex items-center p-2 rounded-md bg-gray-50"
                  >
                    <span className="text-sm text-gray-900">{player.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        {/* Active Teams */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-red-500 mb-4 text-center">Red Team</h3>
            {renderTeamSelector('teamA')}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-blue-500 mb-4 text-center">Blue Team</h3>
            {renderTeamSelector('teamB')}
          </div>
        </div>

        {/* Waiting Team */}
        <div className="relative border-t border-gray-200 pt-8 mt-8">
          <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-lg font-semibold text-green-500">Waiting:</h3>
              <span className="text-lg font-semibold text-green-500">Green Team</span>
              <div className="bg-yellow-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">
                3
              </div>
            </div>
          </div>
          {renderTeamSelector('waiting')}
        </div>

        {/* Start Match Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={handleStart}
            disabled={!selectedTeams.teamA || !selectedTeams.teamB || !selectedTeams.waiting}
            className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            Start Match
          </button>
        </div>
      </div>
    </div>
  )
} 