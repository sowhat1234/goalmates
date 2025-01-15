'use client'

import { format } from 'date-fns'
import { FaTshirt, FaFutbol, FaHandsHelping } from 'react-icons/fa'
import { Match, Fixture, Team } from '@/types/fixture.types'
import { getTeamColor } from '@/lib/utils/team-utils'
import { TeamStats } from '../statistics/TeamStats'
import { PlayerStats } from '../statistics/PlayerStats'

interface CompletedFixtureProps {
  fixture: Fixture
  match: Match
}

export function CompletedFixture({ fixture, match }: CompletedFixtureProps) {
  // Find the winning team
  const winningTeam = match.events.find(e => e.type === 'WIN')?.team
  const winner = [match.homeTeam, match.awayTeam, match.waitingTeam]
    .find(team => team.id === winningTeam)

  // Calculate total wins for each team across all matches
  const teamWins = new Map<string, number>()
  const teamGoals = new Map<string, number>()
  
  // Initialize maps for all teams
  ;[match.homeTeam, match.awayTeam, match.waitingTeam].forEach(team => {
    if (team) {
      teamWins.set(team.id, 0)
      teamGoals.set(team.id, 0)
    }
  })

  // Calculate wins and goals from all matches
  fixture.matches.forEach(match => {
    console.log('Processing match events:', match.events)
    match.events.forEach(event => {
      if (event.type === 'WIN') {
        const currentWins = teamWins.get(event.team) || 0
        teamWins.set(event.team, currentWins + 1)
        console.log('Found WIN event:', { teamId: event.team, currentWins: currentWins + 1 })
      }
      if (event.type === 'GOAL') {
        const currentGoals = teamGoals.get(event.team) || 0
        teamGoals.set(event.team, currentGoals + 1)
      }
    })
  })

  // Find team with most wins
  let mostWinsTeam: { team: Team; wins: number } | null = null
  teamWins.forEach((wins, teamId) => {
    const team = [match.homeTeam, match.awayTeam, match.waitingTeam].find(t => t?.id === teamId)
    if (team && (!mostWinsTeam || wins > mostWinsTeam.wins)) {
      mostWinsTeam = { team, wins }
    }
  })

  console.log('Final teamWins Map:', Object.fromEntries(teamWins))
  console.log('mostWinsTeam:', mostWinsTeam)

  // Find top scorer
  const playerGoals = new Map<string, { name: string, team: Team, count: number }>()
  const playerAssists = new Map<string, { name: string, team: Team, count: number }>()

  // Calculate goals for each player across all matches
  fixture.matches.forEach(match => {
    match.events.forEach(event => {
      if (event.type === 'GOAL') {
        const team = [match.homeTeam, match.awayTeam, match.waitingTeam].find(t => t?.id === event.team)
        const player = team?.players.find(p => p.player.id === event.playerId)
        if (team && player) {
          const current = playerGoals.get(player.player.id) || { name: player.player.name, team, count: 0 }
          playerGoals.set(player.player.id, { ...current, count: current.count + 1 })
        }
      }
      if (event.assistPlayerId) {
        const team = [match.homeTeam, match.awayTeam, match.waitingTeam].find(t => 
          t?.players.some(p => p.player.id === event.assistPlayerId)
        )
        const player = team?.players.find(p => p.player.id === event.assistPlayerId)
        if (team && player) {
          const current = playerAssists.get(player.player.id) || { name: player.player.name, team, count: 0 }
          playerAssists.set(player.player.id, { ...current, count: current.count + 1 })
        }
      }
    })
  })

  // Get top scorer and assister
  const topScorer = Array.from(playerGoals.values()).reduce((max, current) => 
    current.count > max.count ? current : max, 
    { name: '', team: match.homeTeam, count: -1 }
  )

  const topAssister = Array.from(playerAssists.values()).reduce((max, current) => 
    current.count > max.count ? current : max,
    { name: '', team: match.homeTeam, count: -1 }
  )

  return (
    <div className="container mx-auto p-4 sm:p-8 bg-white">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Fixture Complete - {format(new Date(fixture.date), "PPP")}
        </h1>
        
        {/* Awards Section */}
        <div className="space-y-3">
          {/* Most Wins */}
          {mostWinsTeam && mostWinsTeam.wins > 0 && (
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-2 rounded-full border border-yellow-200">
              <span className="text-xl">👑</span>
              <span className="text-base sm:text-lg font-bold text-gray-900">
                Most Wins: {mostWinsTeam.team.name} - {mostWinsTeam.wins} wins
              </span>
            </div>
          )}

          {/* Winner Display
          {winner && (
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-2 rounded-full border border-yellow-200">
              <span className="text-xl">🏆</span>
              <span className="text-base sm:text-lg font-bold text-gray-900">Last Match Winner: {winner.name}</span>
            </div>
          )} */}

          {/* Top Scorer */}
          {topScorer.count > 0 && (
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-full border border-blue-200">
                <FaFutbol className="text-blue-500 text-sm" />
                <span className="text-base sm:text-lg font-bold text-gray-900">
                  Top Scorer: {topScorer.name} - {topScorer.count} goals
                </span>
              </div>
            </div>
          )}

          {/* Top Assister */}
          {topAssister.count > 0 && (
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-full border border-green-200">
                <FaHandsHelping className="text-green-500 text-sm" />
                <span className="text-base sm:text-lg font-bold text-gray-900">
                  Most Assists: {topAssister.name} - {topAssister.count} assists
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Teams Display */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {[match.homeTeam, match.awayTeam, match.waitingTeam].map((team: Team) => {
            if (!team) return null;
            const goals = teamGoals.get(team.id) || 0
            const wins = teamWins.get(team.id) || 0
            
            return (
              <div 
                key={team.id} 
                className={`bg-white rounded-lg p-4 sm:p-6 shadow-sm border ${team.id === winningTeam ? 'border-yellow-300 ring-2 ring-yellow-200' : 'border-gray-100'}`}
              >
                <div className="mb-3">
                  <FaTshirt 
                    style={{ fill: getTeamColor(team).fill }} 
                    className="w-12 h-12 sm:w-16 sm:h-16 mx-auto"
                  />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{team.name}</h3>
                <div className="flex justify-center gap-4 text-sm text-gray-600">
                  <span>Goals: {goals}</span>
                  <span>Wins: {wins}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Statistics */}
      <div className="grid grid-cols-1 gap-6 sm:gap-8">
        <TeamStats 
          teams={[match.homeTeam, match.awayTeam, match.waitingTeam]} 
          events={fixture.matches.flatMap(m => m.events)} 
        />
        <PlayerStats 
          teams={[match.homeTeam, match.awayTeam, match.waitingTeam]} 
          events={fixture.matches.flatMap(m => m.events)} 
        />
      </div>
    </div>
  )
} 