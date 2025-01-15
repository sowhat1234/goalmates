export const GOALS_TO_WIN = 2
export const OVERTIME_MINUTES = 2
export const INITIAL_MATCH_MINUTES = 8

export const EVENT_EMOJIS: { [key: string]: string } = {
  'GOAL': '⚽',
  'SAVE': '🧤',
  'YELLOW_CARD': '🟨',
  'RED_CARD': '🟥',
  'WOW_MOMENT': '✨',
  'ASSIST': '👟',
  'WIN': '🏆'
}

export const DEFAULT_TEAM_COLORS = {
  home: 'red',
  away: 'blue',
  waiting: 'green'
}

export const TEAM_COLORS: { [key: string]: { fill: string, text: string } } = {
  red: { fill: '#ef4444', text: 'text-red-500' },
  blue: { fill: '#3b82f6', text: 'text-blue-500' },
  green: { fill: '#22c55e', text: 'text-green-500' },
  yellow: { fill: '#eab308', text: 'text-yellow-500' },
  purple: { fill: '#a855f7', text: 'text-purple-500' },
  pink: { fill: '#ec4899', text: 'text-pink-500' }
} 