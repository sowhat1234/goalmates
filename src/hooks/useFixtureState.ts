import { useState, useCallback, useMemo } from 'react'
import { Fixture, Match } from '@/types/fixture.types'
import { GOALS_TO_WIN } from '@/constants/game-rules'
import { getCurrentScores } from '@/lib/utils/team-utils'

interface UseFixtureStateProps {
  initialFixture: Fixture
  id: string
  seasonId: string
  fixtureId: string
  onError?: (error: string) => void
}

export function useFixtureState({ 
  initialFixture, 
  id, 
  seasonId, 
  fixtureId,
  onError 
}: UseFixtureStateProps) {
  const [fixture, setFixture] = useState<Fixture>(initialFixture)
  const [error, setError] = useState<string | null>(null)
  const [showOvertimePrompt, setShowOvertimePrompt] = useState(false)
  const [showWinnerSelectionPrompt, setShowWinnerSelectionPrompt] = useState(false)

  // Get the current active match (the most recent IN_PROGRESS match)
  const currentMatch = useMemo(() => {
    if (!fixture?.matches?.length) {
      console.log('No matches found in fixture')
      return null
    }
    const inProgressMatch = fixture.matches.find(m => m.status === 'IN_PROGRESS')
    if (inProgressMatch) {
      console.log('Found in-progress match:', inProgressMatch.id)
      return inProgressMatch
    }
    console.log('No in-progress match, using first match:', fixture.matches[0].id)
    return fixture.matches[0]
  }, [fixture])

  // Log the state for debugging
  console.log('useFixtureState:', {
    fixtureId,
    hasMatches: !!fixture.matches?.length,
    matchesCount: fixture?.matches?.length || 0,
    firstMatch: fixture?.matches?.[0]?.id,
    currentMatchId: currentMatch?.id
  })

  const handleError = (message: string) => {
    setError(message)
    if (onError) {
      onError(message)
    }
  }

  const handleStartMatch = async (homeName: string, awayName: string, waitingName: string) => {
    try {
      // Get saved team configurations from localStorage
      const savedTeams = localStorage.getItem(`fixture_teams_${fixtureId}`)
      if (!savedTeams) {
        throw new Error("Team configurations not found")
      }

      const teamConfigs = JSON.parse(savedTeams)

      const response = await fetch(`/api/leagues/${id}/seasons/${seasonId}/fixtures/${fixtureId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeTeam: {
            name: homeName,
            color: teamConfigs.homeTeam.color || "red",
            players: teamConfigs.homeTeam.players || []
          },
          awayTeam: {
            name: awayName,
            color: teamConfigs.awayTeam.color || "blue",
            players: teamConfigs.awayTeam.players || []
          },
          waitingTeam: {
            name: waitingName,
            color: teamConfigs.waitingTeam.color || "green",
            players: teamConfigs.waitingTeam.players || []
          }
        })
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const updatedFixture = await response.json()
      setFixture(updatedFixture)
    } catch (error) {
      handleError(error instanceof Error ? error.message : "Failed to start match")
    }
  }

  const handleEndFixture = async () => {
    try {
      const response = await fetch(`/api/leagues/${id}/seasons/${seasonId}/fixtures/${fixtureId}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      // Clean up localStorage
      localStorage.removeItem(`fixture_teams_${fixtureId}`)
      localStorage.removeItem(`fixture_timer_${fixtureId}`)

      const updatedFixture = await response.json()
      
      // Ensure the fixture status is properly updated
      updatedFixture.status = 'COMPLETED'
      if (updatedFixture.matches && updatedFixture.matches.length > 0) {
        updatedFixture.matches[0].status = 'COMPLETED'
      }
      
      setFixture(updatedFixture)
      return updatedFixture
    } catch (error) {
      handleError(error instanceof Error ? error.message : "Failed to end fixture")
      throw error
    }
  }

  const handleWinningTeam = async (winningTeamId: string, losingTeamId: string) => {
    try {
      console.log('Handling winning team:', { winningTeamId, losingTeamId })

      const response = await fetch(`/api/leagues/${id}/seasons/${seasonId}/fixtures/${fixtureId}/rotate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          winningTeamId,
          losingTeamId,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Rotation failed:', errorText)
        throw new Error(errorText || 'Failed to rotate teams')
      }

      const data = await response.json()
      console.log('Rotation response:', data)
      
      if (!data.fixture) {
        console.error('No fixture data in response')
        throw new Error('Invalid rotation response')
      }

      // Update the fixture with the new data
      setFixture(data.fixture)
      
      // Close the winner selection prompt
      setShowWinnerSelectionPrompt(false)

      return data

    } catch (error) {
      console.error('Error rotating teams:', error)
      handleError(error instanceof Error ? error.message : 'Failed to rotate teams')
      throw error
    }
  }

  const checkWinConditions = useCallback((homeTeamId: string, awayTeamId: string) => {
    if (!currentMatch?.events) return
    
    const scores = getCurrentScores(currentMatch.events, currentMatch.id)
    
    // Check if either team has reached the win condition
    if (scores[homeTeamId] >= GOALS_TO_WIN || scores[awayTeamId] >= GOALS_TO_WIN) {
      const winningTeamId = scores[homeTeamId] > scores[awayTeamId] ? homeTeamId : awayTeamId
      const losingTeamId = winningTeamId === homeTeamId ? awayTeamId : homeTeamId
      handleWinningTeam(winningTeamId, losingTeamId)
    }
    // Overtime feature temporarily disabled
    // else if (!showOvertimePrompt && !showWinnerSelectionPrompt) {
    //   // If time is up and no winner, show overtime prompt
    //   setShowOvertimePrompt(true)
    // }
  }, [currentMatch, handleWinningTeam])

  return {
    fixture,
    currentMatch,
    error,
    showOvertimePrompt,
    showWinnerSelectionPrompt,
    setShowOvertimePrompt,
    setShowWinnerSelectionPrompt,
    handleStartMatch,
    handleEndFixture,
    handleWinningTeam,
    checkWinConditions
  }
} 