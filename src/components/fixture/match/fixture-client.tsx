"use client"

import { useState, useEffect } from 'react'
import { useFixtureState } from '@/hooks/useFixtureState'
import { useFixtureTimer } from '@/hooks/useFixtureTimer'
import { useFixtureEvents } from '@/hooks/useFixtureEvents'
import { MatchTimer } from '@/components/fixture/match/MatchTimer'
import { ScoreDisplay } from '@/components/fixture/match/ScoreDisplay'
import { TeamDisplay } from '@/components/fixture/match/TeamDisplay'
import { EventModal } from '@/components/fixture/modals/EventModal'
import { OvertimePrompt } from '@/components/fixture/modals/OvertimePrompt'
import { WinnerSelectionPrompt } from '@/components/fixture/modals/WinnerSelectionPrompt'
import { CompletedFixture } from '@/components/fixture/completed/CompletedFixture'
import { TeamStats } from '@/components/fixture/statistics/TeamStats'
import { PlayerStats } from '@/components/fixture/statistics/PlayerStats'
import { getCurrentScores, getTeamColor } from '@/lib/utils/team-utils'
import type { Fixture, Match, SelectedEvent, Team, Event } from '@/types/fixture.types'
import { FaTshirt } from 'react-icons/fa'
import { BsHourglassSplit } from 'react-icons/bs'
import { MatchActions } from '@/components/fixture/match/MatchActions'

interface FixtureClientProps {
  fixture: Fixture
  id: string
  seasonId: string
  fixtureId: string
  events?: Event[]
}

export function FixtureClient({ fixture, id, seasonId, fixtureId, events }: FixtureClientProps) {
  const { matches } = fixture
  console.log('Fixture data:', { 
    fixtureId, 
    status: fixture.status,
    matchesCount: matches?.length,
    firstMatch: matches?.[0] 
  })
  
  const [localError, setLocalError] = useState<string | null>(null)

  // Get the current active match (the most recent IN_PROGRESS match)
  const activeMatch = matches?.find(match => match.status === 'IN_PROGRESS') || matches?.[0]

  const {
    error: fixtureError,
    showWinnerSelectionPrompt,
    setShowWinnerSelectionPrompt,
    handleStartMatch,
    handleEndFixture,
    handleWinningTeam,
    checkWinConditions
  } = useFixtureState({ 
    initialFixture: fixture, 
    id, 
    seasonId, 
    fixtureId,
    onError: (error: string) => console.error(error)
  })

  console.log('Match states:', { 
    activeMatch,
    matchStatus: activeMatch?.status,
    totalMatches: matches?.length,
    fixtureError
  })

  const {
    timer,
    isOvertime,
    startTimer,
    pauseTimer,
    setOvertimeTimer,
    adjustTime
  } = useFixtureTimer({
    fixtureId,
    onTimeEnd: () => {
      // For now, just end the fixture when time is up
      handleEndFixture()
    }
  })

  // Initialize useFixtureEvents with activeMatch directly
  const fixtureEvents = useFixtureEvents({
    fixtureId,
    match: activeMatch || {
      id: '',
      homeTeam: matches[0].homeTeam,
      awayTeam: matches[0].awayTeam,
      waitingTeam: matches[0].waitingTeam || {
        id: '',
        name: '',
        color: '',
        players: []
      },
      homeTeamId: matches[0].homeTeam.id,
      awayTeamId: matches[0].awayTeam.id,
      waitingTeamId: matches[0].waitingTeam?.id || '',
      events: [],
      createdAt: '',
      updatedAt: ''
    },
    onEventRecorded: () => {
      if (activeMatch) {
        const scores = getCurrentScores(activeMatch.events, activeMatch.id)
        checkWinConditions(activeMatch.homeTeam.id, activeMatch.awayTeam.id)
      }
    }
  })

  useEffect(() => {
    if (fixtureEvents.showEventModal) {
      console.log('Current selected event in client:', fixtureEvents.selectedEvent)
    }
  }, [fixtureEvents.showEventModal, fixtureEvents.selectedEvent])

  const handleMatchStart = async () => {
    try {
      const response = await fetch(`/api/leagues/${id}/seasons/${seasonId}/fixtures/${fixtureId}/start`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to start match')
      }

      // Refresh the page to show match started state
      window.location.reload()
    } catch (error) {
      console.error('Error starting match:', error)
      setLocalError(error instanceof Error ? error.message : 'Failed to start match')
    }
  }

  // Handle error states after all hooks are initialized
  if (!fixture.matches || fixture.matches.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">No matches found for this fixture</p>
        </div>
      </div>
    )
  }

  if (!activeMatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">Current match not found</p>
        </div>
      </div>
    )
  }

  if (fixtureError || localError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{fixtureError || localError}</p>
        </div>
      </div>
    )
  }

  if (fixture.status === 'COMPLETED' || activeMatch.status === 'COMPLETED') {
    return <CompletedFixture fixture={fixture} match={activeMatch} />
  }

  const scores = getCurrentScores(activeMatch.events, activeMatch.id)
  const teams = [
    activeMatch.homeTeam,
    activeMatch.awayTeam,
    ...(activeMatch.waitingTeam ? [activeMatch.waitingTeam] : [])
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <div className="flex flex-col space-y-4 mb-6">
            {(fixture.status === 'IN_PROGRESS' || fixture.status === 'COMPLETED') && (
              <>
                <div className="flex flex-col items-center space-y-4">
                  <MatchTimer
                    timer={timer}
                    fixtureStatus={fixture.status}
                    isOvertime={isOvertime}
                    onStartTimer={startTimer}
                    onPauseTimer={pauseTimer}
                    onAdjustTime={adjustTime}
                  />
                  <ScoreDisplay
                    homeTeam={activeMatch.homeTeam}
                    awayTeam={activeMatch.awayTeam}
                    homeScore={scores[activeMatch.homeTeam.id] || 0}
                    awayScore={scores[activeMatch.awayTeam.id] || 0}
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <TeamDisplay
                  team={activeMatch.homeTeam}
                  events={activeMatch.events}
                  currentMatchId={activeMatch.id}
                  onRecordEvent={() => fixtureEvents.handleOpenEventModal(activeMatch.homeTeam.id)}
                  className="h-full"
                />
                {fixture.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => fixtureEvents.handleOpenEventModal(activeMatch.homeTeam.id)}
                    className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Record Event
                  </button>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <TeamDisplay
                  team={activeMatch.awayTeam}
                  events={activeMatch.events}
                  currentMatchId={activeMatch.id}
                  onRecordEvent={() => fixtureEvents.handleOpenEventModal(activeMatch.awayTeam.id)}
                  className="h-full"
                />
                {fixture.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => fixtureEvents.handleOpenEventModal(activeMatch.awayTeam.id)}
                    className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Record Event
                  </button>
                )}
              </div>
            </div>

            {activeMatch.waitingTeam && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-2 bg-white text-sm text-gray-500">Waiting Team</span>
                  </div>
                </div>

                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <TeamDisplay
                    team={activeMatch.waitingTeam}
                    events={[]}
                    currentMatchId={activeMatch.id}
                    onRecordEvent={() => {}}
                    isWaiting={true}
                    className="h-full"
                  />
                </div>
              </div>
            )}

            {activeMatch.status === 'IN_PROGRESS' && (
              <div className="grid grid-cols-1 gap-6 sm:gap-8">
                <TeamStats 
                  teams={[activeMatch.homeTeam, activeMatch.awayTeam, activeMatch.waitingTeam]} 
                  events={fixture.matches.flatMap(m => m.events)} 
                />
                <PlayerStats 
                  teams={[activeMatch.homeTeam, activeMatch.awayTeam, activeMatch.waitingTeam]} 
                  events={fixture.matches.flatMap(m => m.events)} 
                />
              </div>
            )}
          </div>
        </div>

        {fixture.status === 'NOT_STARTED' && (
          <button
            onClick={handleMatchStart}
            className="w-full mt-4 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
          >
            Start Match
          </button>
        )}

        {fixture.status === 'IN_PROGRESS' && (
          <MatchActions
            onEndMatch={() => setShowWinnerSelectionPrompt(true)}
            onEndFixture={async () => {
              await handleEndFixture();
              // Force a re-render by updating the fixture status locally
              fixture.status = 'COMPLETED';
              if (activeMatch) {
                activeMatch.status = 'COMPLETED';
              }
              // Force re-render
              setLocalError(null);
            }}
          />
        )}

        <EventModal
          show={fixtureEvents.showEventModal}
          match={activeMatch}
          selectedEvent={fixtureEvents.selectedEvent}
          onSubmit={async (event) => {
            try {
              console.log('Submitting event:', event)
              await fixtureEvents.handleRecordEvent(event)
              // Update state locally instead of reloading
              const now = new Date().toISOString()
              const newEvent: Event = {
                id: Date.now().toString(), // Temporary ID until server sync
                type: event.type,
                playerId: event.player?.id || '',
                matchId: activeMatch.id,
                team: event.team.id,
                createdAt: now,
                updatedAt: now,
                timestamp: now,
                player: event.player,
                ...(event.type === 'GOAL' && event.assistPlayer?.id && {
                  assistPlayerId: event.assistPlayer.id,
                  assistPlayer: event.assistPlayer
                })
              }
              activeMatch.events = [...activeMatch.events, newEvent]
            } catch (error) {
              console.error('Failed to record event:', error)
              setLocalError(error instanceof Error ? error.message : 'Failed to record event')
            }
          }}
          onClose={fixtureEvents.handleCloseEventModal}
          onEventChange={fixtureEvents.handleEventChange}
        />

        {showWinnerSelectionPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-4">Select Winner</h3>
              <div className="space-y-4">
                {[activeMatch.homeTeam, activeMatch.awayTeam, activeMatch.waitingTeam].filter(Boolean).map((team) => (
                  <button
                    key={team.id}
                    onClick={async () => {
                      // Determine the losing team based on which team won
                      let losingTeams;
                      if (team.id === activeMatch.homeTeam.id) {
                        losingTeams = [activeMatch.awayTeam, activeMatch.waitingTeam];
                      } else if (team.id === activeMatch.awayTeam.id) {
                        losingTeams = [activeMatch.homeTeam, activeMatch.waitingTeam];
                      } else {
                        losingTeams = [activeMatch.homeTeam, activeMatch.awayTeam];
                      }
                      
                      // The first losing team becomes the next away team
                      const losingTeam = losingTeams[0];
                      await handleWinningTeam(team.id, losingTeam.id);
                      // Refresh the page to show the new match state
                      window.location.reload();
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700"
                  >
                    <FaTshirt style={{ color: getTeamColor(team).fill }} />
                    <span>{team.name}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowWinnerSelectionPrompt(false)}
                className="w-full mt-4 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 