import { Event as PrismaEvent } from "@prisma/client"

export type SelectedEvent = {
  type: 'GOAL' | 'SAVE' | 'YELLOW_CARD' | 'RED_CARD' | 'WOW_MOMENT' | 'ASSIST' | 'WIN'
  team: Team
  player: Player
  assistPlayer?: Player
}

export interface Player {
  id: string
  name: string
}

export interface TeamPlayer {
  player: Player
  playerId: string
  teamId: string
}

export interface Team {
  id: string
  name: string
  color?: string
  players: TeamPlayer[]
}

export interface Event {
  id: string
  type: string
  subType?: 'WIN' | 'LOSS' | null
  playerId: string
  assistPlayerId?: string | null
  matchId: string
  team: string
  createdAt: string
  updatedAt: string
  timestamp: string | null
  player: Player | null
  assistPlayer?: Player | null
  relatedPlayerId?: string | null
}

export interface Match {
  id: string
  homeTeamId: string
  awayTeamId: string
  waitingTeamId: string
  homeTeam: Team
  awayTeam: Team
  waitingTeam: Team
  events: Event[]
  createdAt: string
  updatedAt: string
  status: string
  winningTeamId?: string | null
}

export interface Fixture {
  id: string
  date: string
  createdAt: string
  updatedAt: string
  status: string
  matches: Match[]
}

export interface MatchTimer {
  minutes: number
  seconds: number
  isRunning: boolean
}

export interface Score {
  [teamId: string]: number
} 