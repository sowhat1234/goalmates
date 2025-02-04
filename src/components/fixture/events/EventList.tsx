'use client'

import { Event } from '@/types/fixture.types'
import { EVENT_EMOJIS } from '@/constants/game-rules'

interface EventListProps {
  events: Event[]
  className?: string
}

export function EventList({ events, className = '' }: EventListProps) {
  if (!events.length) {
    return (
      <div className="text-sm text-gray-500 italic py-2">
        No events recorded yet
      </div>
    )
  }

  // Sort events by timestamp and type (goals first)
  const sortedEvents = [...events].sort((a, b) => {
    if (a.type === 'GOAL' && b.type !== 'GOAL') return -1;
    if (a.type !== 'GOAL' && b.type === 'GOAL') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getPlayerName = (event: Event, isAssist: boolean = false) => {
    if (isAssist) {
      return event.assistPlayer?.name || 'Unknown Player';
    }
    return event.player?.name || 'Unknown Player';
  };

  return (
    <div className={`${className} relative z-0`}>
      <div className="space-y-2">
        {sortedEvents.map(event => (
          <div 
            key={event.id} 
            className="text-sm text-gray-600 bg-white p-2 rounded-md shadow-sm relative z-10"
          >
            <div className="flex items-start gap-2">
              <span className="text-lg flex-shrink-0">{EVENT_EMOJIS[event.type]}</span>
              <div className="min-w-0 flex-1">
                <span className="font-medium block truncate">{getPlayerName(event)}</span>
                {event.type === 'GOAL' && event.assistPlayerId && (
                  <div className="text-gray-500 text-xs mt-1">
                    Assist by {getPlayerName(event, true)} 👟
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 