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
    checkWinConditions,
    // we deleted the function - to hide setShowEventModal
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
    adjustTime,
    resetTimer
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
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
          <div className="flex flex-col space-y-4 mb-4 sm:mb-6">
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

          <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 flex flex-col">
                <div className="flex-1 overflow-hidden">
                  <TeamDisplay
                    team={activeMatch.homeTeam}
                    events={activeMatch.events}
                    currentMatchId={activeMatch.id}
                    onRecordEvent={() => fixtureEvents.handleOpenEventModal(activeMatch.homeTeam.id)}
                    className="h-full"
                  />
                </div>
                {fixture.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => fixtureEvents.handleOpenEventModal(activeMatch.homeTeam.id)}
                    className="w-full mt-3 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    Record Event
                  </button>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 flex flex-col">
                <div className="flex-1 overflow-hidden">
                  <TeamDisplay
                    team={activeMatch.awayTeam}
                    events={activeMatch.events}
                    currentMatchId={activeMatch.id}
                    onRecordEvent={() => fixtureEvents.handleOpenEventModal(activeMatch.awayTeam.id)}
                    className="h-full"
                  />
                </div>
                {fixture.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => fixtureEvents.handleOpenEventModal(activeMatch.awayTeam.id)}
                    className="w-full mt-3 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    Record Event
                  </button>
                )}
              </div>
            </div>

            {activeMatch.waitingTeam && (
              <div className="mt-6 relative">
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-2 bg-white text-sm text-gray-500">Waiting Team</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 flex flex-col">
                  <div className="flex-1 overflow-hidden">
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
              </div>
            )}

            {activeMatch.status === 'IN_PROGRESS' && (
              <div className="grid grid-cols-1 gap-4 sm:gap-8 mt-6">
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
            className="w-full mt-4 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors text-base sm:text-lg font-semibold"
          >
            Start Match
          </button>
        )}

        {fixture.status === 'IN_PROGRESS' && (
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 shadow-lg sm:relative sm:mt-4 sm:p-0 sm:bg-transparent sm:border-0 sm:shadow-none">
            <div>
              <MatchActions
                onEndMatch={() => setShowWinnerSelectionPrompt(true)}
                onEndFixture={handleEndFixture}
              />
            </div>
          </div>
        )}

        <EventModal
          show={fixtureEvents.showEventModal}
          match={activeMatch}
          selectedEvent={fixtureEvents.selectedEvent}
          onSubmit={async (event) => {
            try {
              console.log('Submitting event:', event)
              await fixtureEvents.handleRecordEvent(event)
              const now = new Date().toISOString()
              const newEvent: Event = {
                id: Date.now().toString(),
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
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Select Winner</h3>
              <div className="space-y-3">
                {[activeMatch.homeTeam, activeMatch.awayTeam, activeMatch.waitingTeam].filter(Boolean).map((team) => (
                  <button
                    key={team.id}
                    onClick={async () => {
                      let losingTeams;
                      if (team.id === activeMatch.homeTeam.id) {
                        losingTeams = [activeMatch.awayTeam, activeMatch.waitingTeam];
                      } else if (team.id === activeMatch.awayTeam.id) {
                        losingTeams = [activeMatch.homeTeam, activeMatch.waitingTeam];
                      } else {
                        losingTeams = [activeMatch.homeTeam, activeMatch.awayTeam];
                      }
                      
                      const losingTeam = losingTeams[0];
                      
                      try {
                        resetTimer();
                        await handleWinningTeam(team.id, losingTeam.id);
                        window.location.reload();
                      } catch (error) {
                        console.error('Error handling winner:', error);
                        setLocalError('Failed to process winner selection. Please try again.');
                      }
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 text-sm sm:text-base"
                  >
                    <FaTshirt style={{ color: getTeamColor(team).fill }} />
                    <span>{team.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 