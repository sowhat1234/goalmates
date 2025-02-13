'use client'

import { Match, SelectedEvent, Team, Player } from '@/types/fixture.types'

interface EventModalProps {
  show: boolean
  match: Match
  selectedEvent: SelectedEvent
  onSubmit: (event: SelectedEvent) => void
  onClose: () => void
  onEventChange: (event: SelectedEvent) => void
}

export function EventModal({
  show,
  match,
  selectedEvent,
  onSubmit,
  onClose,
  onEventChange
}: EventModalProps) {
  if (!show) return null

  // Get all players from all teams
  const allPlayers = [
    ...(match.homeTeam?.players || []),
    ...(match.awayTeam?.players || []),
    ...(match.waitingTeam?.players || [])
  ];

  // Determine if this is a global event
  const isGlobalEvent = selectedEvent.team?.id === 'global';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {isGlobalEvent ? 'Record Event (All Players)' : 'Record Event'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select
              value={selectedEvent.type}
              onChange={(e) => onEventChange({ 
                ...selectedEvent, 
                type: e.target.value as SelectedEvent['type']
              })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="GOAL">Goal ⚽</option>
              <option value="SAVE">Save 🧤</option>
              <option value="YELLOW_CARD">Yellow Card 🟨</option>
              <option value="RED_CARD">Red Card 🟥</option>
              <option value="WOW_MOMENT">Wow Moment ✨</option>
              <option value="ASSIST">Assist 👟</option>
            </select>
          </div>

          {/* Player Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Player</label>
            <select
              value={selectedEvent.player?.id || ''}
              onChange={(e) => {
                const player = isGlobalEvent
                  ? allPlayers.find(p => p.playerId === e.target.value)
                  : selectedEvent.team?.players?.find(p => p.playerId === e.target.value);

                if (player) {
                  // Find the player's team
                  const playerTeam = player.teamId === match.homeTeam.id 
                    ? match.homeTeam 
                    : player.teamId === match.awayTeam.id
                    ? match.awayTeam
                    : match.waitingTeam;

                  onEventChange({ 
                    ...selectedEvent, 
                    player: { 
                      id: player.playerId, 
                      name: player.player.name 
                    },
                    // Always set the actual team of the player
                    team: playerTeam
                  });
                }
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Player</option>
              {(isGlobalEvent ? allPlayers : selectedEvent.team?.players)?.map((p) => {
                const teamName = p.teamId === match.homeTeam.id 
                  ? match.homeTeam.name
                  : p.teamId === match.awayTeam.id
                  ? match.awayTeam.name
                  : match.waitingTeam.name;

                return (
                  <option key={p.playerId} value={p.playerId}>
                    {p.player.name} ({teamName})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Assist Player Selection for Goals */}
          {selectedEvent.type === 'GOAL' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assist By</label>
              <select
                value={selectedEvent.assistPlayer?.id || ''}
                onChange={(e) => {
                  const player = isGlobalEvent
                    ? allPlayers.find(p => p.playerId === e.target.value)
                    : selectedEvent.team?.players?.find(p => p.playerId === e.target.value);

                  onEventChange({ 
                    ...selectedEvent, 
                    assistPlayer: player ? { 
                      id: player.playerId, 
                      name: player.player.name 
                    } : undefined 
                  });
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Assist</option>
                {(isGlobalEvent ? allPlayers : selectedEvent.team?.players)
                  ?.filter(p => p.playerId !== selectedEvent.player?.id)
                  .map((p) => {
                    const teamName = p.teamId === match.homeTeam.id 
                      ? match.homeTeam.name
                      : p.teamId === match.awayTeam.id
                      ? match.awayTeam.name
                      : match.waitingTeam.name;

                    return (
                      <option key={p.playerId} value={p.playerId}>
                        {p.player.name} ({teamName})
                      </option>
                    );
                  })}
              </select>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(selectedEvent)}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Record
          </button>
        </div>
      </div>
    </div>
  )
} 