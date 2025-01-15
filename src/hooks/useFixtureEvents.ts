'use client'

import { useState, useCallback } from 'react'
import { Match, SelectedEvent, Team, Player } from '@/types/fixture.types'

interface UseFixtureEventsProps {
  fixtureId: string
  match: Match
  onEventRecorded?: () => void
}

export function useFixtureEvents({ 
  fixtureId, 
  match, 
  onEventRecorded 
}: UseFixtureEventsProps) {
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent>(() => {
    // Create a deep copy of the team data for initial state
    const teamCopy = match?.homeTeam ? {
      id: match.homeTeam.id,
      name: match.homeTeam.name,
      color: match.homeTeam.color,
      players: match.homeTeam.players.map(p => ({
        ...p,
        player: { ...p.player }
      }))
    } : {
      id: '',
      name: '',
      players: []
    }

    return {
      type: 'GOAL',
      team: teamCopy,
      player: match?.homeTeam?.players?.[0] ? {
        id: match.homeTeam.players[0].playerId,
        name: match.homeTeam.players[0].player.name
      } : {
        id: '',
        name: ''
      }
    }
  })
  const [showEventModal, setShowEventModal] = useState(false)

  const handleRecordEvent = useCallback(async (event: SelectedEvent) => {
    try {
      if (!match?.id) {
        throw new Error('Match ID not found')
      }

      if (!event.team?.id) {
        throw new Error('Team ID not found')
      }

      if (!event.player?.id && event.type !== 'WIN') {
        throw new Error('Player ID not found')
      }

      console.log('Recording event:', {
        type: event.type,
        playerId: event.player?.id,
        matchId: match.id,
        team: event.team.id,
        assistPlayerId: event.assistPlayer?.id
      })

      // Get the current URL path segments
      const pathSegments = window.location.pathname.split('/')
      const leagueId = pathSegments[pathSegments.indexOf('leagues') + 1]
      const seasonId = pathSegments[pathSegments.indexOf('seasons') + 1]

      console.log('Sending event to:', { leagueId, seasonId, fixtureId })

      const response = await fetch(`/api/leagues/${leagueId}/seasons/${seasonId}/fixtures/${fixtureId}/events/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [{
            type: event.type,
            playerId: event.player?.id || '',
            matchId: match.id,
            team: event.team.id,
            ...(event.type === 'GOAL' && event.assistPlayer?.id && {
              assistPlayerId: event.assistPlayer.id
            })
          }]
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server error:', errorText)
        throw new Error(errorText)
      }

      console.log('Server response:', await response.json())

      setShowEventModal(false)
      onEventRecorded?.()
    } catch (error) {
      console.error('Failed to record event:', error)
      throw error
    }
  }, [fixtureId, match, onEventRecorded])

  const handleOpenEventModal = useCallback((teamId: string) => {
    console.log('Opening modal for team:', teamId)
    
    if (!match) {
      console.error('No match data available')
      return
    }

    const team = [match.homeTeam, match.awayTeam, match.waitingTeam].filter(Boolean).find(t => t?.id === teamId)
    console.log('Selected team full data:', JSON.stringify(team, null, 2))
    
    if (team && team.players && team.players.length > 0) {
      console.log('Team players full data:', JSON.stringify(team.players, null, 2))
      
      // Create a deep copy of the team data
      const teamCopy = {
        id: team.id,
        name: team.name,
        color: team.color,
        players: team.players.map(p => ({
          ...p,
          player: { ...p.player }
        }))
      }
      
      const newEvent: SelectedEvent = {
        type: 'GOAL',
        team: teamCopy,
        player: team.players[0] ? {
          id: team.players[0].playerId,
          name: team.players[0].player.name
        } : {
          id: '',
          name: ''
        }
      }
      
      console.log('Setting new event:', JSON.stringify(newEvent, null, 2))
      setSelectedEvent(newEvent)
      setShowEventModal(true)
    } else {
      console.error('Team or players not found:', { team, teamId })
    }
  }, [match])

  const handleCloseEventModal = useCallback(() => {
    setShowEventModal(false)
  }, [])

  const handleEventChange = useCallback((event: SelectedEvent) => {
    console.log('Handling event change:', JSON.stringify(event, null, 2))
    setSelectedEvent(event)
  }, [])

  return {
    showEventModal,
    selectedEvent,
    handleRecordEvent,
    handleOpenEventModal,
    handleCloseEventModal,
    handleEventChange
  }
} 