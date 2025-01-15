'use client'

import { FaTshirt } from 'react-icons/fa'
import { Team } from '@/types/fixture.types'
import { getTeamColor } from '@/lib/utils/team-utils'

interface WinnerSelectionPromptProps {
  show: boolean
  homeTeam: Team
  awayTeam: Team
  onSelectWinner: (winningTeamId: string, losingTeamId: string) => void
}

export function WinnerSelectionPrompt({ 
  show, 
  homeTeam, 
  awayTeam, 
  onSelectWinner 
}: WinnerSelectionPromptProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Select Winner</h3>
        <p className="mb-4 text-gray-700">The match is tied after overtime. Please select the winning team:</p>
        <div className="space-y-3">
          <button
            onClick={() => onSelectWinner(homeTeam.id, awayTeam.id)}
            className={`w-full p-4 rounded-lg border-2 transition-colors ${getTeamColor(homeTeam).text} hover:bg-gray-50`}
          >
            <FaTshirt 
              style={{ fill: getTeamColor(homeTeam).fill }} 
              className="w-8 h-8 mx-auto mb-2" 
            />
            {homeTeam.name}
          </button>
          <button
            onClick={() => onSelectWinner(awayTeam.id, homeTeam.id)}
            className={`w-full p-4 rounded-lg border-2 transition-colors ${getTeamColor(awayTeam).text} hover:bg-gray-50`}
          >
            <FaTshirt 
              style={{ fill: getTeamColor(awayTeam).fill }} 
              className="w-8 h-8 mx-auto mb-2" 
            />
            {awayTeam.name}
          </button>
        </div>
      </div>
    </div>
  )
} 