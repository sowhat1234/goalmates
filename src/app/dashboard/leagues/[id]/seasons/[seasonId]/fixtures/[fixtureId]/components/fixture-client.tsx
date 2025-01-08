"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { format } from "date-fns"
import useSWR from 'swr'
import { FaTshirt, FaClock, FaPlay, FaPause } from 'react-icons/fa'
import { TeamSelection } from './team-selection'
import type { Match, Event, Team, Player, TeamPlayer } from './team-selection'

interface MatchTimer {
  minutes: number
  seconds: number
  isRunning: boolean
}

interface Fixture {
  id: string
  date: string
  status: string
  matches: Match[]
  createdAt: string
  updatedAt: string
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

// Helper functions
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

// Function to get events since last rotation
function getCurrentPlayEvents(events: Event[], teamId: string): Event[] {
  if (!events.length) return [];

  // Get all events in chronological order
  const sortedEvents = [...events].sort((a: Event, b: Event) => 
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

// Add this function to calculate current scores
function getCurrentScores(events: Event[]): Score {
  const scores: Score = {};
  
  // Get events since last WIN event or team rotation
  const sortedEvents = [...events].sort((a: Event, b: Event) => 
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
  // All hooks must be at the top level
  const [error, setError] = useState<string | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [isOvertime, setIsOvertime] = useState(false)
  const [showOvertimePrompt, setShowOvertimePrompt] = useState(false)
  const [showWinnerSelectionPrompt, setShowWinnerSelectionPrompt] = useState(false)
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

  // Add players state
  const [players, setPlayers] = useState<Player[]>([])

  // Match timer state with initial values
  const [timer, setTimer] = useState<MatchTimer>(() => {
    return { minutes: 8, seconds: 0, isRunning: false };
  });

  // Effect to handle timer restoration from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedTimer = localStorage.getItem(`fixture_timer_${fixtureId}`);
    if (!savedTimer) return;

    try {
      const parsed = JSON.parse(savedTimer);
      const savedTime = new Date(parsed.lastUpdated);
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - savedTime.getTime()) / 1000);

      if (parsed.isRunning && elapsedSeconds > 0) {
        // Calculate remaining time
        const totalSeconds = (parsed.minutes * 60 + parsed.seconds) - elapsedSeconds;
        if (totalSeconds <= 0) {
          setTimer({ minutes: 0, seconds: 0, isRunning: false });
        } else {
          setTimer({
            minutes: Math.floor(totalSeconds / 60),
            seconds: totalSeconds % 60,
            isRunning: true
          });
        }
      } else {
        setTimer({
          minutes: parsed.minutes,
          seconds: parsed.seconds,
          isRunning: parsed.isRunning
        });
      }
    } catch (error) {
      console.error('Error parsing saved timer:', error);
    }
  }, [fixtureId]);

  // Create a stable URL using memoization
  const fixtureUrl = useMemo(() => 
    `/api/leagues/${id}/seasons/${seasonId}/fixtures/${fixtureId}`,
    [id, seasonId, fixtureId]
  );

  // Use SWR for data fetching with revalidation disabled
  const { data: fixture, mutate } = useSWR<Fixture>(fixtureUrl, fetcher, {
    fallbackData: initialFixture,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0
  });

  // Get current match
  const currentMatch = fixture?.matches?.[0]

  const handleStartMatch = async (homeName: string, awayName: string, waitingName: string) => {
    try {
      if (!fixture) {
        throw new Error("Fixture data not found");
      }

      // Get saved team configurations from localStorage
      const savedTeams = localStorage.getItem(`fixture_teams_${fixtureId}`);
      if (!savedTeams) {
        throw new Error("Team configurations not found");
      }

      const teamConfigs = JSON.parse(savedTeams);

      const response = await fetch(`${fixtureUrl}/start`, {
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
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const updatedFixture = await response.json();
      await mutate(updatedFixture, false);
    } catch (error) {
      console.error("Failed to start match:", error);
      setError(error instanceof Error ? error.message : "Failed to start match");
    }
  };

  const handleEndFixture = async () => {
    try {
      const response = await fetch(`${fixtureUrl}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Clean up localStorage
      localStorage.removeItem(`fixture_teams_${fixtureId}`);
      localStorage.removeItem(`fixture_timer_${fixtureId}`);

      const updatedFixture = await response.json();
      await mutate(updatedFixture, false);
    } catch (error) {
      console.error("Failed to end fixture:", error);
      setError(error instanceof Error ? error.message : "Failed to end fixture");
    }
  };

  const handleStartPauseTimer = () => {
    setTimer(prev => {
      const newTimer = { ...prev, isRunning: !prev.isRunning };
      // Save to localStorage with timestamp
      if (typeof window !== 'undefined') {
        localStorage.setItem(`fixture_timer_${fixtureId}`, JSON.stringify({
          ...newTimer,
          lastUpdated: new Date().toISOString(),
          fixtureStatus: fixture?.status
        }));
      }
      return newTimer;
    });
  };

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
      if (!currentMatch) throw new Error("No active match found");
      
      // First record the win event
      const matchId = currentMatch.id;
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
          winningTeamId: winningTeamId,         // Winner stays as home team
          losingTeamId: losingTeamId,           // Loser becomes waiting team
          newWaitingTeamId: currentMatch.waitingTeam.id  // Waiting team becomes away team
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

      // Refresh the fixture data
      await mutate();
      setIsOvertime(false);
    } catch (error) {
      console.error('Error handling winning team:', error);
      setError(error instanceof Error ? error.message : 'Failed to handle winning team');
    }
  }, [currentMatch, fixtureUrl, fixtureId, mutate]);

  const handleRecordEvent = async () => {
    try {
      if (!currentMatch) throw new Error("No active match found");
      if (!selectedEvent.type) throw new Error("No event type selected");
      if (!selectedEvent.playerId && selectedEvent.type !== "WIN") {
        throw new Error("Player must be selected for this event type");
      }
      
      const matchId = currentMatch.id;
      if (!matchId) throw new Error("Match ID not found");

      // Find the selected player's data
      const selectedPlayer = currentMatch.homeTeam.players
        .concat(currentMatch.awayTeam.players)
        .concat(currentMatch.waitingTeam.players)
        .find(p => p.player.id === selectedEvent.playerId);

      // Find the assist player's data if there is one
      const assistPlayer = selectedEvent.assistPlayerId ? 
        currentMatch.homeTeam.players
          .concat(currentMatch.awayTeam.players)
          .concat(currentMatch.waitingTeam.players)
          .find(p => p.player.id === selectedEvent.assistPlayerId) : null;

      // Create array to hold events
      interface EventWithPlayer {
        id: string;
        type: string;
        playerId: string;
        assistPlayerId?: string;
        matchId: string;
        team: string;
        createdAt: string;
        player: {
          id: string;
          name: string;
        } | null;
      }

      const events: EventWithPlayer[] = [];

      // Create the main event object
      const mainEvent = {
        id: `temp-${Date.now()}`, // Temporary ID for optimistic update
        type: selectedEvent.type,
        playerId: selectedEvent.playerId || "",
        assistPlayerId: selectedEvent.assistPlayerId || "",
        matchId: matchId,
        team: selectedEvent.team || "",
        createdAt: new Date().toISOString(),
        player: selectedPlayer ? {
          id: selectedPlayer.player.id,
          name: selectedPlayer.player.name
        } : null
      };
      events.push(mainEvent);

      // If this is a goal with an assist, create the assist event
      if (selectedEvent.type === "GOAL" && assistPlayer) {
        const assistEvent = {
          id: `temp-assist-${Date.now()}`,
          type: "ASSIST",
          playerId: assistPlayer.player.id,
          matchId: matchId,
          team: selectedEvent.team || "",
          createdAt: new Date().toISOString(),
          player: {
            id: assistPlayer.player.id,
            name: assistPlayer.player.name
          }
        };
        events.push(assistEvent);
      }

      // Update the local state first before making the API call
      setSelectedEvent({
        type: "",
        playerId: null,
        assistPlayerId: null,
        team: null
      });
      setShowEventModal(false);

      // Record the events
      const response = await fetch(`${fixtureUrl}/events/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Get the updated fixture data
      const updatedFixture = await response.json();
      
      // Update the SWR cache with optimistic data
      await mutate(
        (currentData) => {
          // If there's no current data, use the updated fixture
          if (!currentData) return updatedFixture;
          
          // Otherwise, merge the new events into the current data
          return {
            ...currentData,
            matches: currentData.matches.map((match: Match) => {
              if (match.id === matchId) {
                return {
                  ...match,
                  events: [...match.events, ...events]
                };
              }
              return match;
            })
          };
        },
        {
          revalidate: false,
          populateCache: true,
          rollbackOnError: true
        }
      );

      // Explicitly check win conditions after recording a goal
      if (selectedEvent.type === "GOAL" && currentMatch.homeTeam && currentMatch.awayTeam) {
        const currentScores = getCurrentScores(currentMatch.events);
        const homeScore = currentScores[currentMatch.homeTeam.id] || 0;
        const awayScore = currentScores[currentMatch.awayTeam.id] || 0;
        
        // Add the new goal to the score
        const finalHomeScore = selectedEvent.team === currentMatch.homeTeam.id ? homeScore + 1 : homeScore;
        const finalAwayScore = selectedEvent.team === currentMatch.awayTeam.id ? awayScore + 1 : awayScore;
        
        if (finalHomeScore >= GOALS_TO_WIN || finalAwayScore >= GOALS_TO_WIN) {
          const winningTeamId = finalHomeScore >= GOALS_TO_WIN 
            ? currentMatch.homeTeam.id 
            : currentMatch.awayTeam.id;
          const losingTeamId = winningTeamId === currentMatch.homeTeam.id 
            ? currentMatch.awayTeam.id 
            : currentMatch.homeTeam.id;
          await handleWinningTeam(winningTeamId, losingTeamId);
        }
      }
    } catch (error) {
      console.error("Failed to record event:", error);
      setError(error instanceof Error ? error.message : "Failed to record event");
    }
  };

  const checkWinConditions = useCallback((homeTeamId: string, awayTeamId: string) => {
    if (!currentMatch) return;
    
    const scores = getCurrentScores(currentMatch.events);
    
    // Check if either team has reached the win condition
    if (scores[homeTeamId] >= GOALS_TO_WIN || scores[awayTeamId] >= GOALS_TO_WIN) {
      const winningTeamId = scores[homeTeamId] > scores[awayTeamId] ? homeTeamId : awayTeamId;
      const losingTeamId = winningTeamId === homeTeamId ? awayTeamId : homeTeamId;
      handleWinningTeam(winningTeamId, losingTeamId);
    } else if (timer.minutes === 0 && timer.seconds === 0) {
      // If time is up and no winner, go to overtime
      handleOvertime();
    }
  }, [currentMatch, timer.minutes, timer.seconds, handleWinningTeam]);

  // Timer effect with persistence
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined;
    
    if (timer.isRunning && currentMatch && fixture?.status === 'IN_PROGRESS') {
      interval = setInterval(() => {
        setTimer(prev => {
          const newTimer = { ...prev };
          
          if (prev.minutes === 0 && prev.seconds === 0) {
            newTimer.isRunning = false;
            if (interval) clearInterval(interval);
            // Check win conditions when time runs out
            checkWinConditions(currentMatch.homeTeam.id, currentMatch.awayTeam.id);
          } else if (prev.seconds === 0) {
            newTimer.minutes = prev.minutes - 1;
            newTimer.seconds = 59;
          } else {
            newTimer.seconds = prev.seconds - 1;
          }
          
          // Save to localStorage with timestamp and fixture status
          if (typeof window !== 'undefined') {
            localStorage.setItem(`fixture_timer_${fixtureId}`, JSON.stringify({
              ...newTimer,
              lastUpdated: new Date().toISOString(),
              fixtureStatus: fixture?.status
            }));
          }
          
          return newTimer;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning, fixtureId, currentMatch, fixture?.status, checkWinConditions]);

  // Clean up timer when fixture status changes
  useEffect(() => {
    if (fixture?.status !== 'IN_PROGRESS') {
      localStorage.removeItem(`fixture_timer_${fixtureId}`);
      setTimer({ minutes: 8, seconds: 0, isRunning: false });
    }
  }, [fixture?.status, fixtureId]);

  // Handle beforeunload and visibilitychange events
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (timer.isRunning && fixture?.status === 'IN_PROGRESS') {
        localStorage.setItem(`fixture_timer_${fixtureId}`, JSON.stringify({
          ...timer,
          lastUpdated: new Date().toISOString(),
          fixtureStatus: fixture?.status
        }));
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && timer.isRunning && fixture?.status === 'IN_PROGRESS') {
        localStorage.setItem(`fixture_timer_${fixtureId}`, JSON.stringify({
          ...timer,
          lastUpdated: new Date().toISOString(),
          fixtureStatus: fixture?.status
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [timer, fixtureId, fixture?.status]);

  // Determine fixture state
  const isWaitingToStart = fixture?.status === "WAITING_TO_START"
  const isCompleted = fixture?.status === "COMPLETED"

  // Fetch players
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch(`/api/leagues/${id}/players`)
        if (!response.ok) {
          throw new Error('Failed to fetch players')
        }
        const data = await response.json()
        setPlayers(data)
      } catch (error) {
        console.error('Failed to fetch players:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch players')
      }
    }

    fetchPlayers()
  }, [id])

  // Return early if no match is found
  if (!currentMatch) {
    // Load team configurations from localStorage
    const savedTeams = typeof window !== 'undefined' ? localStorage.getItem(`fixture_teams_${fixtureId}`) : null;
    let initialTeams = {
      homeTeam: { name: 'Red Team', color: 'red', players: [] },
      awayTeam: { name: 'Blue Team', color: 'blue', players: [] },
      waitingTeam: { name: 'Green Team', color: 'green', players: [] }
    };

    if (savedTeams) {
      try {
        initialTeams = JSON.parse(savedTeams);
      } catch (error) {
        console.error('Error parsing saved teams:', error);
      }
    }

    const emptyMatch: Match = {
      id: '',
      homeTeam: {
        id: 'home',
        name: initialTeams.homeTeam.name,
        color: initialTeams.homeTeam.color,
        players: players.map((p: Player) => ({ player: p }))
      },
      awayTeam: {
        id: 'away',
        name: initialTeams.awayTeam.name,
        color: initialTeams.awayTeam.color,
        players: players.map((p: Player) => ({ player: p }))
      },
      waitingTeam: {
        id: 'waiting',
        name: initialTeams.waitingTeam.name,
        color: initialTeams.waitingTeam.color,
        players: players.map((p: Player) => ({ player: p }))
      },
      events: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return (
      <div className="p-4 text-center">
        <TeamSelection 
          match={emptyMatch}
          onStart={handleStartMatch}
          fixtureId={fixtureId}
        />
      </div>
    )
  }

  // Show team selection if match hasn't started
  if (isWaitingToStart) {
    return (
      <TeamSelection 
        match={currentMatch} 
        onStart={handleStartMatch}
        fixtureId={fixtureId}
      />
    )
  }

  // If the match is finished, show the final results
  if (isCompleted) {
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
                {[currentMatch.homeTeam, currentMatch.awayTeam, currentMatch.waitingTeam].map((team: Team) => {
                  const teamEvents = currentMatch.events.filter(
                    (event: Event) => event.team === team.id
                  )
                  const goals = teamEvents.filter(
                    (event: Event) => event.type === "GOAL"
                  ).length
                  const saves = teamEvents.filter(
                    (event: Event) => event.type === "SAVE"
                  ).length
                  const wins = currentMatch.events.filter(
                    (event: Event) => event.type === "WIN" && event.team === team.id
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
                {[...currentMatch.homeTeam.players, ...currentMatch.awayTeam.players, ...currentMatch.waitingTeam.players].map((teamPlayer: TeamPlayer) => {
                  const playerEvents = currentMatch.events.filter(
                    (event: Event) => event.playerId === teamPlayer.player.id
                  )
                  const goals = playerEvents.filter(
                    (event: Event) => event.type === "GOAL"
                  ).length
                  const assists = playerEvents.filter(
                    (event: Event) => event.type === "ASSIST"
                  ).length
                  const saves = playerEvents.filter(
                    (event: Event) => event.type === "SAVE"
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

  // If not waiting to start and not completed, show the in-progress match
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
          <span className={getTeamColor(currentMatch.homeTeam).text}>
            {getCurrentScores(currentMatch.events)[currentMatch.homeTeam.id] || 0}
          </span>
          <span className="text-gray-400">-</span>
          <span className={getTeamColor(currentMatch.awayTeam).text}>
            {getCurrentScores(currentMatch.events)[currentMatch.awayTeam.id] || 0}
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
                style={{ fill: getTeamColor(currentMatch.homeTeam).fill }} 
                className={`w-16 h-16 mx-auto transition-colors duration-200`} 
              />
            </div>
            <h3 className={`text-xl font-bold truncate ${getTeamColor(currentMatch.homeTeam).text}`}>
              {currentMatch.homeTeam.name}
            </h3>
            <button
              onClick={() => {
                setSelectedEvent({
                  type: "",
                  playerId: null,
                  assistPlayerId: null,
                  team: currentMatch.homeTeam.id
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
              {getCurrentPlayEvents(currentMatch.events, currentMatch.homeTeam.id)
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
                style={{ fill: getTeamColor(currentMatch.awayTeam).fill }} 
                className={`w-16 h-16 mx-auto transition-colors duration-200`} 
              />
            </div>
            <h3 className={`text-xl font-bold truncate ${getTeamColor(currentMatch.awayTeam).text}`}>
              {currentMatch.awayTeam.name}
            </h3>
            <button
              onClick={() => {
                setSelectedEvent({
                  type: "",
                  playerId: null,
                  assistPlayerId: null,
                  team: currentMatch.awayTeam.id
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
              {getCurrentPlayEvents(currentMatch.events, currentMatch.awayTeam.id)
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
                style={{ fill: getTeamColor(currentMatch.waitingTeam).fill }}
                className="w-12 h-12 mx-auto opacity-70 transform transition-all duration-300 hover:opacity-100"
              />
              <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full w-5 h-5 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-900">⏳</span>
              </div>
            </div>
            <h3 className={`text-lg font-bold max-w-[200px] truncate mx-auto flex items-center justify-center gap-2 ${getTeamColor(currentMatch.waitingTeam).text}`}>
              <span className="text-gray-900">Waiting:</span>
              <span>{currentMatch.waitingTeam.name}</span>
            </h3>
            {/* Waiting Team Current Play Events */}
            <div className="mt-2 bg-white/50 p-2 rounded-lg max-h-32 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Play Events</h4>
              {getCurrentPlayEvents(currentMatch.events, currentMatch.waitingTeam.id)
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
                  handleWinningTeam(currentMatch.homeTeam.id, currentMatch.awayTeam.id);
                  setShowWinnerSelectionPrompt(false);
                }}
                className={`w-full p-4 rounded-lg border-2 transition-colors ${getTeamColor(currentMatch.homeTeam).text} hover:bg-gray-50`}
              >
                <FaTshirt 
                  style={{ fill: getTeamColor(currentMatch.homeTeam).fill }} 
                  className="w-8 h-8 mx-auto mb-2" 
                />
                {currentMatch.homeTeam.name}
              </button>
              <button
                onClick={() => {
                  handleWinningTeam(currentMatch.awayTeam.id, currentMatch.homeTeam.id);
                  setShowWinnerSelectionPrompt(false);
                }}
                className={`w-full p-4 rounded-lg border-2 transition-colors ${getTeamColor(currentMatch.awayTeam).text} hover:bg-gray-50`}
              >
                <FaTshirt 
                  style={{ fill: getTeamColor(currentMatch.awayTeam).fill }} 
                  className="w-8 h-8 mx-auto mb-2" 
                />
                {currentMatch.awayTeam.name}
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
                  {[currentMatch.homeTeam, currentMatch.awayTeam]
                    .find(team => team.id === selectedEvent.team)
                    ?.players.map((teamPlayer) => (
                      <option key={`${teamPlayer.player.id}-${selectedEvent.team}`} value={teamPlayer.player.id} className="text-gray-900">
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
                    {[currentMatch.homeTeam, currentMatch.awayTeam]
                      .find(team => team.id === selectedEvent.team)
                      ?.players.map((teamPlayer) => (
                        <option key={`assist-${teamPlayer.player.id}-${selectedEvent.team}`} value={teamPlayer.player.id} className="text-gray-900">
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
              {[currentMatch.homeTeam, currentMatch.awayTeam, currentMatch.waitingTeam].map((team: Team) => {
                const teamEvents = currentMatch.events.filter(
                  (event) => event.team === team.id
                )
                const goals = teamEvents.filter(
                  (event) => event.type === "GOAL"
                ).length
                const saves = teamEvents.filter(
                  (event) => event.type === "SAVE"
                ).length
                // Calculate wins based on WIN events
                const wins = currentMatch.events.filter(
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
              {[...currentMatch.homeTeam.players, ...currentMatch.awayTeam.players, ...currentMatch.waitingTeam.players].map((teamPlayer: TeamPlayer) => {
                const playerEvents = currentMatch.events.filter(
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