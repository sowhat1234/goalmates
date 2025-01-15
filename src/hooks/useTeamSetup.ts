import { useState, useEffect, useMemo } from 'react'
import type { Team, Match } from '@/types/fixture.types'
import { saveTeamSetup } from '@/app/actions/team-setup'

interface UseTeamSetupProps {
  match: Match
  fixtureId: string
}

export function useTeamSetup({ match, fixtureId }: UseTeamSetupProps) {
  const teams = useMemo(() => [
    match.homeTeam,
    match.awayTeam,
    match.waitingTeam
  ], [match.homeTeam, match.awayTeam, match.waitingTeam])

  const [selectedTeams, setSelectedTeams] = useState<{
    teamA: string | null
    teamB: string | null
    waiting: string | null
  }>(() => {
    if (typeof window === 'undefined') return { teamA: null, teamB: null, waiting: null }
    
    try {
      const savedTeams = localStorage.getItem(`fixture_teams_${fixtureId}`)
      if (savedTeams) {
        const parsed = JSON.parse(savedTeams)
        const savedHomeTeam = teams.find(t => t.name === parsed.homeTeam.name)
        const savedAwayTeam = teams.find(t => t.name === parsed.awayTeam.name)
        const savedWaitingTeam = teams.find(t => t.name === parsed.waitingTeam.name)
        
        return {
          teamA: savedHomeTeam?.id || null,
          teamB: savedAwayTeam?.id || null,
          waiting: savedWaitingTeam?.id || null
        }
      }
    } catch (error) {
      console.error('Error loading team configurations:', error)
    }
    
    return { teamA: null, teamB: null, waiting: null }
  })

  const handleTeamSelect = (position: 'teamA' | 'teamB' | 'waiting', teamId: string) => {
    setSelectedTeams(prev => {
      const newPositions = { ...prev }
      Object.entries(newPositions).forEach(([key, value]) => {
        if (value === teamId) {
          newPositions[key as keyof typeof newPositions] = null
        }
      })
      newPositions[position] = teamId
      return newPositions
    })
  }

  const saveTeamConfigurations = (teamA: Team, teamB: Team, waitingTeam: Team) => {
    localStorage.setItem(`fixture_teams_${fixtureId}`, JSON.stringify({
      homeTeam: {
        name: teamA.name,
        color: teamA.color || 'red',
        players: teamA.players.map(p => p.player.id)
      },
      awayTeam: {
        name: teamB.name,
        color: teamB.color || 'blue',
        players: teamB.players.map(p => p.player.id)
      },
      waitingTeam: {
        name: waitingTeam.name,
        color: waitingTeam.color || 'green',
        players: waitingTeam.players.map(p => p.player.id)
      }
    }))
  }

  const handleSaveTeamSetup = async (data: {
    homeTeamId: string
    awayTeamId: string
    waitingTeamId: string
    fixtureId: string
  }) => {
    const result = await saveTeamSetup(data)

    if (!result.success) {
      throw new Error(result.error || 'Failed to save team setup')
    }

    return result
  }

  return {
    teams,
    selectedTeams,
    handleTeamSelect,
    saveTeamConfigurations,
    handleSaveTeamSetup
  }
} 