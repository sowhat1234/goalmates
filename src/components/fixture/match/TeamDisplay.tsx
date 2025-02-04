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
    <div className={`flex flex-col h-full ${className}`}>
      {/* Team Header */}
      <div className="flex flex-col items-center pb-3">
        <FaTshirt 
          className={`w-12 h-12 sm:w-16 sm:h-16 ${isWaiting ? 'opacity-70' : ''}`}
          style={{ 
            fill: getTeamColor(team).fill,
          }} 
        />
        <h3 className={`text-base sm:text-lg font-semibold mt-2 ${getTeamColor(team).text}`}>
          {team.name}
        </h3>
      </div>

      {/* Events Section */}
      {!isWaiting && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Current Play Events
          </h4>
          <div className="flex-1 overflow-y-auto mb-2 -mx-2 px-2">
            <EventList 
              events={currentEvents} 
              className="space-y-2" 
            />
          </div>
        </div>
      )}
    </div>
  )
} 