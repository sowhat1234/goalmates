"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { format } from "date-fns"
import useSWR from 'swr'
import { FaTshirt, FaClock, FaPlay, FaPause } from 'react-icons/fa'
import { TeamSelection } from './team-selection'

interface Player {
  id: string
  name: string
}

interface TeamPlayer {
  player: Player
}

interface Team {
  id: string
  name: string
  players: TeamPlayer[]
  color?: string
}

interface Event {
  id: string
  type: string
  playerId: string
  matchId: string
  createdAt: string
  player: Player
  team: string
}

interface Fixture {
  id: string
  date: string
  status: string
  matches: Array<{
    id: string
    homeTeam: Team
    awayTeam: Team
    waitingTeam: Team
    events: Event[]
  }>
}

interface MatchTimer {
  minutes: number
  seconds: number
  isRunning: boolean
}

// Add these constants at the top of the file
const GOALS_TO_WIN = 2;
const OVERTIME_MINUTES = 2;
const EVENT_EMOJIS: { [key: string]: string } = {
  'GOAL': '⚽',
  'SAVE': '🧤',
  'YELLOW_CARD': '🟨',
  'RED_CARD': '🟥',
  'WOW_MOMENT': '✨',
  'ASSIST': '👟',
  'WIN': '🏆'
};

// Add this type for score tracking
interface Score {
  [teamId: string]: number;
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch data')
  return res.json()
}

export function FixtureClient({ 
  fixture: initialFixture,
  id,
  seasonId,
  fixtureId
}: { 
  fixture: Fixture
  id: string
  seasonId: string
  fixtureId: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [isOvertime, setIsOvertime] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<{
    type: string
    playerId: string | null
    assistPlayerId: string | null
    team: string | null
  }>({
    type: "",
    playerId: null,
    assistPlayerId: null,
    team: null
  })

  // Match timer state with localStorage persistence
  const [timer, setTimer] = useState<MatchTimer>(() => {
    if (typeof window === 'undefined') return { minutes: 8, seconds: 0, isRunning: false };
    
    const savedTimer = localStorage.getItem(`fixture_timer_${fixtureId}`);
    if (!savedTimer) return { minutes: 8, seconds: 0, isRunning: false };
    
    try {
      const parsed = JSON.parse(savedTimer);
      const savedTime = new Date(parsed.lastUpdated);
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - savedTime.getTime()) / 1000);
      
      if (parsed.isRunning && elapsedSeconds > 0) {
        // Calculate remaining time
        const totalSeconds = (parsed.minutes * 60 + parsed.seconds) - elapsedSeconds;
        if (totalSeconds <= 0) {
          return { minutes: 0, seconds: 0, isRunning: false };
        }
        return {
          minutes: Math.floor(totalSeconds / 60),
          seconds: totalSeconds % 60,
          isRunning: true
        };
      }
      
      return {
        minutes: parsed.minutes,
        seconds: parsed.seconds,
        isRunning: parsed.isRunning
      };
    } catch {
      return { minutes: 8, seconds: 0, isRunning: false };
    }
  });

  // Create a stable URL using memoization
  const fixtureUrl = useMemo(() => 
    `/api/leagues/${id}/seasons/${seasonId}/fixtures/${fixtureId}`,
    [id, seasonId, fixtureId]
  )

  // Use SWR for data fetching
  const { data: fixture, mutate } = useSWR<Fixture>(fixtureUrl, fetcher, {
    fallbackData: initialFixture,
    revalidateOnFocus: false
  })

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`fixture_timer_${fixtureId}`, JSON.stringify({
        ...timer,
        lastUpdated: new Date().toISOString()
      }));
    }
  }, [timer, fixtureId]);

  // Clear timer when fixture is finished
  useEffect(() => {
    if (fixture?.status === 'FINISHED' && typeof window !== 'undefined') {
      localStorage.removeItem(`fixture_timer_${fixtureId}`);
    }
  }, [fixture?.status, fixtureId]);

  // Handle beforeunload event to save state
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (timer.isRunning) {
        localStorage.setItem(`fixture_timer_${fixtureId}`, JSON.stringify({
          ...timer,
          lastUpdated: new Date().toISOString()
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [timer, fixtureId]);

  const handleOvertime = () => {
    setTimer(prev => ({
      ...prev,
      minutes: OVERTIME_MINUTES,
      seconds: 0,
      isRunning: true
    }));
    setIsOvertime(true);
  };

  const handleWinningTeam = useCallback(async (winningTeamId: string, losingTeamId: string) => {
    try {
      if (!fixture?.matches?.[0]) throw new Error("Match not found");
      const match = fixture.matches[0];
      
      // First record the win event
      const matchId = match.id;
      if (!matchId) throw new Error("Match ID not found");

      const winEvent = {
        type: "WIN",
        playerId: "", // Win events don't need a player
        matchId: matchId,
        team: winningTeamId
      }

      // Record the win event
      const eventResponse = await fetch(`${fixtureUrl}/events/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: [winEvent] })
      });

      if (!eventResponse.ok) {
        throw new Error(await eventResponse.text());
      }

      // Then rotate the teams
      const response = await fetch(`${fixtureUrl}/rotate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winningTeamId,
          losingTeamId,
          newWaitingTeamId: match.waitingTeam.id
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Reset timer to initial state
      const newTimer = {
        minutes: 8,
        seconds: 0,
        isRunning: false
      };
      setTimer(newTimer);
      
      // Save new timer state to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`fixture_timer_${fixtureId}`, JSON.stringify({
          ...newTimer,
          lastUpdated: new Date().toISOString()
        }));
      }

      // Reset overtime state
      setIsOvertime(false);

      const updatedFixture = await response.json();
      await mutate(updatedFixture, false);
    } catch (error) {
      console.error("Failed to rotate teams:", error);
      setError(error instanceof Error ? error.message : "Failed to rotate teams");
    }
  }, [fixture, fixtureUrl, fixtureId, mutate]);

  const checkWinConditions = useCallback((homeTeamId: string, awayTeamId: string) => {
    if (!fixture?.matches?.[0]) return;
    
    const match = fixture.matches[0];
    const scores = getCurrentScores(match.events);
    
    // Check if either team has reached the win condition
    if (scores[homeTeamId] >= GOALS_TO_WIN || scores[awayTeamId] >= GOALS_TO_WIN) {
      const winningTeamId = scores[homeTeamId] > scores[awayTeamId] ? homeTeamId : awayTeamId;
      const losingTeamId = winningTeamId === homeTeamId ? awayTeamId : homeTeamId;
      handleWinningTeam(winningTeamId, losingTeamId);
    } else if (timer.minutes === 0 && timer.seconds === 0) {
      // If time is up and no winner, go to overtime
      handleOvertime();
    }
  }, [fixture, timer.minutes, timer.seconds, handleWinningTeam]);

  // Timer effect with persistence
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined;
    
    if (timer.isRunning && fixture?.matches?.[0]) {
      const match = fixture.matches[0];
      interval = setInterval(() => {
        setTimer(prev => {
          const newTimer = { ...prev };
          
          if (prev.minutes === 0 && prev.seconds === 0) {
            newTimer.isRunning = false;
            if (interval) clearInterval(interval);
            // Check win conditions when time runs out
            checkWinConditions(match.homeTeam.id, match.awayTeam.id);
          } else if (prev.seconds === 0) {
            newTimer.minutes = prev.minutes - 1;
            newTimer.seconds = 59;
          } else {
            newTimer.seconds = prev.seconds - 1;
          }
          
          // Save to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem(`fixture_timer_${fixtureId}`, JSON.stringify({
              ...newTimer,
              lastUpdated: new Date().toISOString()
            }));
          }
          
          return newTimer;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning, fixtureId, fixture, checkWinConditions]);

  // Debug logging effect
  useEffect(() => {
    if (fixture?.matches?.[0]) {
      const match = fixture.matches[0];
      console.log('All events:', match.events)
      console.log('Current play events (home):', getCurrentPlayEvents(match.events, match.homeTeam.id))
      console.log('Current play events (away):', getCurrentPlayEvents(match.events, match.awayTeam.id))
      console.log('Current play events (waiting):', getCurrentPlayEvents(match.events, match.waitingTeam.id))
    }
  }, [fixture?.matches]);

  const handleStartMatch = async (homeTeamId: string, awayTeamId: string, waitingTeamId: string) => {
    try {
      const response = await fetch(`${fixtureUrl}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeTeamId,
          awayTeamId,
          waitingTeamId
        })
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const updatedFixture = await response.json()
      await mutate(updatedFixture, false)
    } catch (error) {
      console.error("Failed to start match:", error)
      setError(error instanceof Error ? error.message : "Failed to start match")
    }
  }

  const handleRecordEvent = async () => {
    if (!selectedEvent.type || !selectedEvent.playerId || !selectedEvent.team) {
      setError("Please select an event type and player")
      return
    }

    try {
      setShowEventModal(false)

      const matchId = fixture?.matches[0].id
      if (!matchId) throw new Error("Match ID not found")

      const events = []

      // Prepare events
      const newEvent = {
        type: selectedEvent.type,
        playerId: selectedEvent.playerId,
        matchId: matchId,
        team: selectedEvent.team
      }
      events.push(newEvent)

      if (selectedEvent.type === "GOAL" && selectedEvent.assistPlayerId) {
        events.push({
          type: "ASSIST",
          playerId: selectedEvent.assistPlayerId,
          matchId: matchId,
          team: selectedEvent.team
        })
      }

      // API call first
      const response = await fetch(`${fixtureUrl}/events/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events })
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      // Update with server response
      const updatedFixture = await response.json()
      await mutate(updatedFixture, false)

      // Reset selection and error
      setSelectedEvent({ type: "", playerId: null, assistPlayerId: null, team: null })
      setError(null)
    } catch (error) {
      console.error("Failed to record events:", error)
      setError(error instanceof Error ? error.message : "Failed to record events")
      // Revalidate to get the correct state
      mutate()
    }
  }

  const handleStartPauseTimer = () => {
    setTimer(prev => {
      const newTimer = { ...prev, isRunning: !prev.isRunning };
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`fixture_timer_${fixtureId}`, JSON.stringify({
          ...newTimer,
          lastUpdated: new Date().toISOString()
        }));
      }
      return newTimer;
    });
  };

  // Function to get events since last rotation
  const getCurrentPlayEvents = (events: Event[], teamId: string) => {
    if (!events.length) return [];

    // Get all events in chronological order
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Find the last WIN event
    const lastWinEvent = [...sortedEvents].reverse().find(event => event.type === "WIN");
    
    if (!lastWinEvent) {
      // If no WIN event, we're in the first match - return all events for this team
      return sortedEvents.filter(event => event.team === teamId && event.type !== "WIN");
    }

    // Get the index of the last WIN event
    const lastWinIndex = sortedEvents.findIndex(event => event.id === lastWinEvent.id);
    
    // Get all events after the last WIN event (not including the WIN event)
    const eventsAfterLastWin = sortedEvents.slice(lastWinIndex + 1);

    // Return only events for this team
    return eventsAfterLastWin.filter(event => event.team === teamId && event.type !== "WIN");
  }

  function getTeamColor(team: Team): { fill: string, text: string } {
    // Define color mappings
    const colorMap: { [key: string]: { fill: string, text: string } } = {
      red: { fill: '#ef4444', text: 'text-red-500' },
      blue: { fill: '#3b82f6', text: 'text-blue-500' },
      green: { fill: '#22c55e', text: 'text-green-500' },
      yellow: { fill: '#eab308', text: 'text-yellow-500' },
      purple: { fill: '#a855f7', text: 'text-purple-500' },
      pink: { fill: '#ec4899', text: 'text-pink-500' }
    }

    // Use the team's stored color or default to red
    return colorMap[team.color || 'red'] || colorMap.red
  }

  const handleEndFixture = async () => {
    try {
      const response = await fetch(`${fixtureUrl}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const updatedFixture = await response.json();
      await mutate(updatedFixture, false);
    } catch (error) {
      console.error("Failed to end fixture:", error);
      setError(error instanceof Error ? error.message : "Failed to end fixture");
    }
  };

  // Add these states after other states
  const [showOvertimePrompt, setShowOvertimePrompt] = useState(false);
  const [showWinnerSelectionPrompt, setShowWinnerSelectionPrompt] = useState(false);

  // Add this function to calculate current scores
  const getCurrentScores = (events: Event[]): Score => {
    const scores: Score = {};
    
    // Get events since last WIN event or team rotation
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    // Find the last event that indicates a new game (WIN or team rotation)
    const lastGameStartIndex = [...sortedEvents].reverse().findIndex(event => 
      event.type === "WIN"
    );
    
    // If found, get events since that point, otherwise use all events
    const relevantEvents = lastGameStartIndex === -1 
      ? sortedEvents 
      : sortedEvents.slice(sortedEvents.length - lastGameStartIndex);
    
    // Count goals for the current game
    relevantEvents.forEach(event => {
      if (event.type === "GOAL") {
        scores[event.team] = (scores[event.team] || 0) + 1;
      }
    });
    
    return scores;
  };

  if (!fixture) {
    return <div className="text-center p-6">Loading...</div>
  }

  const match = fixture.matches[0]
  
  // Determine if match has started based on events or status
  const hasStarted = fixture.status === "IN_PROGRESS" || match.events.length > 0;
  const isFinished = fixture.status === "FINISHED";

  // Show team selection if match hasn't started
  if (!hasStarted) {
    return (
      <TeamSelection 
        match={match} 
        onStart={handleStartMatch}
      />
    )
  }

  // If the match is finished, show a message
  if (isFinished) {
    return (
      <div className="container mx-auto p-6 bg-white">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Fixture Complete - {format(new Date(fixture.date), "PPP")}
          </h1>
          <p className="mt-2 text-gray-600">This fixture has ended.</p>
        </div>
        
        {/* Show final statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team Statistics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Final Statistics</h3>
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left text-gray-900">Team</th>
                  <th className="text-center text-gray-900">Goals</th>
                  <th className="text-center text-gray-900">Saves</th>
                  <th className="text-center text-gray-900">Wins</th>
                </tr>
              </thead>
              <tbody>
                {[match.homeTeam, match.awayTeam, match.waitingTeam].map((team) => {
                  const teamEvents = match.events.filter(
                    (event) => event.team === team.id
                  )
                  const goals = teamEvents.filter(
                    (event) => event.type === "GOAL"
                  ).length
                  const saves = teamEvents.filter(
                    (event) => event.type === "SAVE"
                  ).length
                  const wins = match.events.filter(
                    (event) => event.type === "WIN" && event.team === team.id
                  ).length

                  return (
                    <tr key={team.id}>
                      <td className="text-gray-900">{team.name}</td>
                      <td className="text-center text-gray-900">{goals}</td>
                      <td className="text-center text-gray-900">{saves}</td>
                      <td className="text-center text-gray-900">{wins}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Player Statistics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Player Statistics</h3>
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left text-gray-900">Player</th>
                  <th className="text-center text-gray-900">Goals</th>
                  <th className="text-center text-gray-900">Assists</th>
                  <th className="text-center text-gray-900">Saves</th>
                </tr>
              </thead>
              <tbody>
                {[...match.homeTeam.players, ...match.awayTeam.players, ...match.waitingTeam.players].map((teamPlayer) => {
                  const playerEvents = match.events.filter(
                    (event) => event.playerId === teamPlayer.player.id
                  )
                  const goals = playerEvents.filter(
                    (event) => event.type === "GOAL"
                  ).length
                  const assists = playerEvents.filter(
                    (event) => event.type === "ASSIST"
                  ).length
                  const saves = playerEvents.filter(
                    (event) => event.type === "SAVE"
                  ).length

                  return (
                    <tr key={teamPlayer.player.id}>
                      <td className="text-gray-900">{teamPlayer.player.name}</td>
                      <td className="text-center text-gray-900">{goals}</td>
                      <td className="text-center text-gray-900">{assists}</td>
                      <td className="text-center text-gray-900">{saves}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
        Fixture - {format(new Date(fixture.date), "PPP")}
      </h1>
        <button
          onClick={handleEndFixture}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          End Fixture
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}

      {/* Match Timer */}
      <div className="mb-6 flex items-center justify-center space-x-4">
        <div className="text-4xl font-bold text-gray-900 flex items-center">
          <FaClock className="mr-2" />
          {String(timer.minutes).padStart(2, '0')}:{String(timer.seconds).padStart(2, '0')}
          {isOvertime && <span className="ml-2 text-sm text-red-500">OT</span>}
        </div>
        <button
          onClick={handleStartPauseTimer}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {timer.isRunning ? <FaPause /> : <FaPlay />}
        </button>
      </div>

      {/* Score Display */}
      <div className="mb-6 text-center">
        <div className="text-3xl font-bold text-gray-900 flex items-center justify-center space-x-4">
          <span className={getTeamColor(match.homeTeam).text}>
            {getCurrentScores(match.events)[match.homeTeam.id] || 0}
          </span>
          <span className="text-gray-400">-</span>
          <span className={getTeamColor(match.awayTeam).text}>
            {getCurrentScores(match.events)[match.awayTeam.id] || 0}
          </span>
        </div>
      </div>

      {/* Teams Display */}
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-8">
          {/* Home Team */}
          <div className="text-center w-64">
            <div className="mb-2">
              <FaTshirt 
                style={{ fill: getTeamColor(match.homeTeam).fill }} 
                className={`w-16 h-16 mx-auto transition-colors duration-200`} 
              />
            </div>
            <h3 className={`text-xl font-bold truncate ${getTeamColor(match.homeTeam).text}`}>
              {match.homeTeam.name}
            </h3>
            <button
              onClick={() => {
                setSelectedEvent({
                  type: "",
                  playerId: null,
                  assistPlayerId: null,
                  team: match.homeTeam.id
                })
                setShowEventModal(true)
              }}
              className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Record Event
            </button>
            {/* Home Team Current Play Events */}
            <div className="mt-4 bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Play Events</h4>
              {getCurrentPlayEvents(match.events, match.homeTeam.id)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(event => (
                  <div key={event.id} className="text-sm text-gray-600 mb-1">
                    <span className="mr-1">{EVENT_EMOJIS[event.type]}</span>
                    <span className="font-medium">{event.player.name}</span>
                    {' - '}
                    {event.type.replace('_', ' ')}
                  </div>
                ))
              }
            </div>
          </div>

          {/* VS */}
          <div className="text-2xl font-bold text-gray-600">VS</div>

          {/* Away Team */}
          <div className="text-center w-64">
            <div className="mb-2">
              <FaTshirt 
                style={{ fill: getTeamColor(match.awayTeam).fill }} 
                className={`w-16 h-16 mx-auto transition-colors duration-200`} 
              />
            </div>
            <h3 className={`text-xl font-bold truncate ${getTeamColor(match.awayTeam).text}`}>
              {match.awayTeam.name}
            </h3>
            <button
              onClick={() => {
                setSelectedEvent({
                  type: "",
                  playerId: null,
                  assistPlayerId: null,
                  team: match.awayTeam.id
                })
                setShowEventModal(true)
              }}
              className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Record Event
            </button>
            {/* Away Team Current Play Events */}
            <div className="mt-4 bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Play Events</h4>
              {getCurrentPlayEvents(match.events, match.awayTeam.id)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(event => (
                  <div key={event.id} className="text-sm text-gray-600 mb-1">
                    <span className="mr-1">{EVENT_EMOJIS[event.type]}</span>
                    <span className="font-medium">{event.player.name}</span>
                    {' - '}
                    {event.type.replace('_', ' ')}
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* Waiting Team */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-gray-100 rounded-lg p-4">
            <div className="mb-2 relative">
              <FaTshirt 
                style={{ fill: getTeamColor(match.waitingTeam).fill }}
                className="w-12 h-12 mx-auto opacity-70 transform transition-all duration-300 hover:opacity-100"
              />
              <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full w-5 h-5 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-900">⏳</span>
              </div>
            </div>
            <h3 className={`text-lg font-bold max-w-[200px] truncate mx-auto flex items-center justify-center gap-2 ${getTeamColor(match.waitingTeam).text}`}>
              <span className="text-gray-900">Waiting:</span>
              <span>{match.waitingTeam.name}</span>
            </h3>
            {/* Waiting Team Current Play Events */}
            <div className="mt-2 bg-white/50 p-2 rounded-lg max-h-32 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Play Events</h4>
              {getCurrentPlayEvents(match.events, match.waitingTeam.id)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(event => (
                  <div key={event.id} className="text-sm text-gray-600 mb-1">
                    <span className="mr-1">{EVENT_EMOJIS[event.type]}</span>
                    <span className="font-medium">{event.player.name}</span>
                    {' - '}
                    {event.type.replace('_', ' ')}
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>

      {/* Overtime Prompt */}
      {showOvertimePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Match Tied!</h3>
            <p className="mb-4 text-gray-700">Would you like to go into overtime?</p>
            <div className="flex justify-end space-x-2">
        <button
                onClick={() => setShowOvertimePrompt(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
        >
                Cancel
        </button>
        <button
                onClick={handleOvertime}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
                Start Overtime
        </button>
      </div>
          </div>
        </div>
      )}

      {/* Winner Selection Prompt */}
      {showWinnerSelectionPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Select Winner</h3>
            <p className="mb-4 text-gray-700">The match is tied after overtime. Please select the winning team:</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  handleWinningTeam(match.homeTeam.id, match.awayTeam.id);
                  setShowWinnerSelectionPrompt(false);
                }}
                className={`w-full p-4 rounded-lg border-2 transition-colors ${getTeamColor(match.homeTeam).text} hover:bg-gray-50`}
              >
                <FaTshirt 
                  style={{ fill: getTeamColor(match.homeTeam).fill }} 
                  className="w-8 h-8 mx-auto mb-2" 
                />
                {match.homeTeam.name}
              </button>
              <button
                onClick={() => {
                  handleWinningTeam(match.awayTeam.id, match.homeTeam.id);
                  setShowWinnerSelectionPrompt(false);
                }}
                className={`w-full p-4 rounded-lg border-2 transition-colors ${getTeamColor(match.awayTeam).text} hover:bg-gray-50`}
              >
                <FaTshirt 
                  style={{ fill: getTeamColor(match.awayTeam).fill }} 
                  className="w-8 h-8 mx-auto mb-2" 
                />
                {match.awayTeam.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Recording Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Record Event</h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              handleRecordEvent()
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Event Type
                </label>
                <select
                  value={selectedEvent.type}
                  onChange={(e) => setSelectedEvent(prev => ({ ...prev, type: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-gray-900"
                >
                  <option value="" className="text-gray-900">Select event type</option>
                  <option value="GOAL" className="text-gray-900">Goal</option>
                  <option value="SAVE" className="text-gray-900">Save</option>
                  <option value="YELLOW_CARD" className="text-gray-900">Yellow Card</option>
                  <option value="RED_CARD" className="text-gray-900">Red Card</option>
                  <option value="WOW_MOMENT" className="text-gray-900">WOW Moment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Player
                </label>
                <select
                  value={selectedEvent.playerId || ""}
                  onChange={(e) => setSelectedEvent(prev => ({ ...prev, playerId: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-gray-900"
                >
                  <option value="" className="text-gray-900">Select player</option>
                  {[match.homeTeam, match.awayTeam]
                    .find(team => team.id === selectedEvent.team)
                    ?.players.map((teamPlayer) => (
                      <option key={teamPlayer.player.id} value={teamPlayer.player.id} className="text-gray-900">
                        {teamPlayer.player.name}
                      </option>
                    ))}
                </select>
              </div>
              {selectedEvent.type === "GOAL" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Assist By
                  </label>
                  <select
                    value={selectedEvent.assistPlayerId || ""}
                    onChange={(e) => setSelectedEvent(prev => ({ ...prev, assistPlayerId: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-gray-900"
                  >
                    <option value="" className="text-gray-900">Select player</option>
                    {[match.homeTeam, match.awayTeam]
                      .find(team => team.id === selectedEvent.team)
                      ?.players.map((teamPlayer) => (
                        <option key={teamPlayer.player.id} value={teamPlayer.player.id} className="text-gray-900">
                          {teamPlayer.player.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statistics Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Team Statistics</h3>
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left text-gray-900">Team</th>
                <th className="text-center text-gray-900">Goals</th>
                <th className="text-center text-gray-900">Saves</th>
                <th className="text-center text-gray-900">Wins</th>
              </tr>
            </thead>
            <tbody>
              {[match.homeTeam, match.awayTeam, match.waitingTeam].map((team) => {
                const teamEvents = match.events.filter(
                  (event) => event.team === team.id
                )
                const goals = teamEvents.filter(
                  (event) => event.type === "GOAL"
                ).length
                const saves = teamEvents.filter(
                  (event) => event.type === "SAVE"
                ).length
                // Calculate wins based on WIN events
                const wins = match.events.filter(
                  (event) => event.type === "WIN" && event.team === team.id
                ).length

                return (
                  <tr key={team.id}>
                    <td className="text-gray-900">{team.name}</td>
                    <td className="text-center text-gray-900">{goals}</td>
                    <td className="text-center text-gray-900">{saves}</td>
                    <td className="text-center text-gray-900">{wins}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Player Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Player Statistics</h3>
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left text-gray-900">Player</th>
                <th className="text-center text-gray-900">Goals</th>
                <th className="text-center text-gray-900">Assists</th>
                <th className="text-center text-gray-900">Saves</th>
              </tr>
            </thead>
            <tbody>
              {[...match.homeTeam.players, ...match.awayTeam.players, ...match.waitingTeam.players].map((teamPlayer) => {
                const playerEvents = match.events.filter(
                  (event) => event.playerId === teamPlayer.player.id
                )
                const goals = playerEvents.filter(
                  (event) => event.type === "GOAL"
                ).length
                const assists = playerEvents.filter(
                  (event) => event.type === "ASSIST"
                ).length
                const saves = playerEvents.filter(
                  (event) => event.type === "SAVE"
                ).length

                return (
                  <tr key={teamPlayer.player.id}>
                    <td className="text-gray-900">{teamPlayer.player.name}</td>
                    <td className="text-center text-gray-900">{goals}</td>
                    <td className="text-center text-gray-900">{assists}</td>
                    <td className="text-center text-gray-900">{saves}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 