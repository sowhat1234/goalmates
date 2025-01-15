'use client'

import { Team } from '@/types/fixture.types'
import { getTeamColor } from '@/lib/utils/team-utils'

interface ScoreDisplayProps {
  homeTeam: Team
  awayTeam: Team
  homeScore: number
  awayScore: number
}

export function ScoreDisplay({ homeTeam, awayTeam, homeScore, awayScore }: ScoreDisplayProps) {
  return (
    <div className="mb-6 text-center">
      <div className="text-3xl font-bold text-gray-900 flex items-center justify-center space-x-4">
        <span className={getTeamColor(homeTeam).text}>
          {homeScore || 0}
        </span>
        <span className="text-gray-400">-</span>
        <span className={getTeamColor(awayTeam).text}>
          {awayScore || 0}
        </span>
      </div>
    </div>
  )
} 