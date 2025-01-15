import { Team, Event } from '@/types/fixture.types'
import { TEAM_COLORS } from '@/constants/game-rules'

export function getTeamColor(team: Team): { fill: string, text: string } {
  return TEAM_COLORS[team.color || 'red'] || TEAM_COLORS.red
}

export function getCurrentPlayEvents(events: Event[], teamId: string, currentMatchId: string): Event[] {
  if (!events.length) return []

  // Filter events by current match and team, excluding WIN events
  return events
    .filter(event => 
      event.matchId === currentMatchId && 
      event.team === teamId && 
      event.type !== "WIN"
    )
    .sort((a: Event, b: Event) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
}

export function getCurrentScores(events: Event[], currentMatchId: string): { [teamId: string]: number } {
  const scores: { [teamId: string]: number } = {}
  
  // Only count goals from the current match
  events
    .filter(event => 
      event.matchId === currentMatchId && 
      event.type === "GOAL"
    )
    .forEach(event => {
      scores[event.team] = (scores[event.team] || 0) + 1
    })
  
  return scores
}

export function getMatchHistory(matches: any[]): { 
  completedMatches: any[],
  currentMatch: any,
  upcomingMatches: any[]
} {
  const completedMatches = matches.filter(m => m.status === 'COMPLETED')
  const currentMatch = matches.find(m => m.status === 'IN_PROGRESS')
  const upcomingMatches = matches.filter(m => !m.status || m.status === 'NOT_STARTED')

  return {
    completedMatches,
    currentMatch,
    upcomingMatches
  }
} 