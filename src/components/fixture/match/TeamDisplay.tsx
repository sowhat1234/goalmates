'use client'

import { FaTshirt } from 'react-icons/fa'
import { Team, Event } from '@/types/fixture.types'
import { getTeamColor } from '@/lib/utils/team-utils'
import { EventList } from '../events/EventList'
import { getCurrentPlayEvents } from '@/lib/utils/team-utils'

interface TeamDisplayProps {
  team: Team
  events: Event[]
  currentMatchId: string
  onRecordEvent: () => void
  isWaiting?: boolean
  className?: string
}

export function TeamDisplay({ team, events, currentMatchId, isWaiting, className }: TeamDisplayProps) {
  const currentEvents = getCurrentPlayEvents(events, team.id, currentMatchId)

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-col items-center">
        <FaTshirt 
          className={`w-16 h-16 ${isWaiting ? 'opacity-70' : ''}`}
          style={{ 
            fill: getTeamColor(team).fill,
          }} 
        />
        <h3 className={`text-lg font-semibold mt-2 ${getTeamColor(team).text}`}>{team.name}</h3>
      </div>

      {!isWaiting && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Play Events</h4>
          <EventList events={currentEvents} className="max-h-[150px] overflow-y-auto" />
        </div>
      )}
    </div>
  )
} 