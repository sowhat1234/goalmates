"use client"

import { useState, useEffect } from "react"
import { FaTshirt } from "react-icons/fa"
import { BsHourglassSplit } from "react-icons/bs"
import { Event as PrismaEvent } from "@prisma/client"

export interface Player {
  id: string
  name: string
}

export interface TeamPlayer {
  player: Player
}

export interface Team {
  id: string
  name: string
  players: TeamPlayer[]
  color?: string
}

export interface Event extends Omit<PrismaEvent, 'createdAt' | 'updatedAt' | 'timestamp'> {
  createdAt: string
  updatedAt: string
  timestamp: string | null
  player: Player
}

export interface Match {
  id: string
  homeTeam: Team & { players: { player: Player }[] }
  awayTeam: Team & { players: { player: Player }[] }
  waitingTeam: Team & { players: { player: Player }[] }
  events: Event[]
  createdAt: string
  updatedAt: string
}

interface TeamSelectionProps {
  match: Match
  onStart: (homeName: string, awayName: string, waitingName: string) => void
  fixtureId: string
}

export function TeamSelection({ match, onStart, fixtureId }: TeamSelectionProps) {
  const teams = [match.homeTeam, match.awayTeam, match.waitingTeam]
  
  // Load initial team configurations from localStorage
  const [selectedTeams, setSelectedTeams] = useState<{
    teamA: string | null
    teamB: string | null
    waiting: string | null
  }>(() => {
    if (typeof window === 'undefined') return { teamA: null, teamB: null, waiting: null };
    
    try {
      const savedTeams = localStorage.getItem(`fixture_teams_${fixtureId}`);
      if (savedTeams) {
        const parsed = JSON.parse(savedTeams);
        const savedHomeTeam = teams.find(t => t.name === parsed.homeTeam.name);
        const savedAwayTeam = teams.find(t => t.name === parsed.awayTeam.name);
        const savedWaitingTeam = teams.find(t => t.name === parsed.waitingTeam.name);
        
        return {
          teamA: savedHomeTeam?.id || null,
          teamB: savedAwayTeam?.id || null,
          waiting: savedWaitingTeam?.id || null
        };
      }
    } catch (error) {
      console.error('Error loading team configurations:', error);
    }
    
    return { teamA: null, teamB: null, waiting: null };
  });

  // Update localStorage when teams change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const teamA = teams.find(t => t.id === selectedTeams.teamA);
    const teamB = teams.find(t => t.id === selectedTeams.teamB);
    const waitingTeam = teams.find(t => t.id === selectedTeams.waiting);
    
    if (teamA && teamB && waitingTeam) {
      localStorage.setItem(`fixture_teams_${fixtureId}`, JSON.stringify({
        homeTeam: { name: teamA.name, players: teamA.players.map(p => p.player.id), color: teamA.color },
        awayTeam: { name: teamB.name, players: teamB.players.map(p => p.player.id), color: teamB.color },
        waitingTeam: { name: waitingTeam.name, players: waitingTeam.players.map(p => p.player.id), color: waitingTeam.color }
      }));
    }
  }, [selectedTeams, teams, fixtureId]);

  const getTeamColor = (team: Team): { fill: string, text: string } => {
    const colorMap: { [key: string]: { fill: string, text: string } } = {
      red: { fill: '#ef4444', text: 'text-red-500' },
      blue: { fill: '#3b82f6', text: 'text-blue-500' },
      green: { fill: '#22c55e', text: 'text-green-500' },
      yellow: { fill: '#eab308', text: 'text-yellow-500' },
      purple: { fill: '#a855f7', text: 'text-purple-500' },
      pink: { fill: '#ec4899', text: 'text-pink-500' }
    }
    return colorMap[team.color || 'red'] || colorMap.red
  }

  const handleTeamSelect = (position: 'teamA' | 'teamB' | 'waiting', teamId: string) => {
    setSelectedTeams(prev => {
      // Remove the team from its current position if it exists
      const newPositions = { ...prev }
      Object.entries(newPositions).forEach(([key, value]) => {
        if (value === teamId) {
          newPositions[key as keyof typeof newPositions] = null
        }
      })
      // Assign to new position
      newPositions[position] = teamId
      return newPositions
    })
  }

  const handleStart = () => {
    const teamA = teams.find(t => t.id === selectedTeams.teamA)
    const teamB = teams.find(t => t.id === selectedTeams.teamB)
    const waitingTeam = teams.find(t => t.id === selectedTeams.waiting)

    if (!teamA || !teamB || !waitingTeam) {
      alert('Please select all teams')
      return
    }

    // Save team configurations to localStorage with selected players
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

    onStart(teamA.name, teamB.name, waitingTeam.name)
  }

  const renderTeamSelector = (position: 'teamA' | 'teamB' | 'waiting') => {
    const selectedTeamId = selectedTeams[position]
    const selectedTeam = teams.find(t => t.id === selectedTeamId)

    return (
      <div className={`p-6 rounded-lg border-2 ${position === 'waiting' ? 'max-w-sm mx-auto mt-8' : ''}`}>
        <div className="space-y-4">
          <select
            value={selectedTeamId || ''}
            onChange={(e) => handleTeamSelect(position, e.target.value)}
            className="w-full p-3 border rounded-md text-gray-900 bg-white text-lg"
          >
            <option value="">Select team</option>
            {teams.map((team) => (
              <option
                key={team.id}
                value={team.id}
              >
                {team.name}
              </option>
            ))}
          </select>

          {selectedTeam && (
            <>
              <div className="flex justify-center">
                <FaTshirt 
                  style={{ fill: getTeamColor(selectedTeam).fill }}
                  className={`w-20 h-20 ${position === 'waiting' ? 'opacity-70' : ''}`}
                />
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Players</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedTeam.players.map(({ player }) => (
                    <div
                      key={player.id}
                      className="flex items-center p-2 rounded-md bg-gray-50"
                    >
                      <span className="text-sm text-gray-900">{player.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 bg-white">
      <h2 className="text-2xl font-bold mb-8 text-center text-gray-900">Select Teams</h2>
      
      <div className="mb-8">
        {/* Active Teams */}
        <div className="flex items-center justify-center gap-8">
          <div className="w-1/3">
            {renderTeamSelector('teamA')}
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-gray-900 mb-4">VS</div>
          </div>
          
          <div className="w-1/3">
            {renderTeamSelector('teamB')}
          </div>
        </div>

        {/* Waiting Team */}
        <div className="relative">
          <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-4">
            <BsHourglassSplit className="text-yellow-500 text-4xl animate-pulse" />
          </div>
          {renderTeamSelector('waiting')}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleStart}
          disabled={!selectedTeams.teamA || !selectedTeams.teamB || !selectedTeams.waiting}
          className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Match
        </button>
      </div>
    </div>
  )
} 