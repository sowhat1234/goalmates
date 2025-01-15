"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import useSWR from "swr"
import { useState } from "react"

type Season = {
  id: string
  name: string
  startDate: string
  endDate: string
  pointsSystem: {
    win: number
    draw: number
    loss: number
  }
  teamSize: number
  teamsPerMatch: number
  fixtures: Array<{
    id: string
    date: string
    status: string
    matches: Array<{
      id: string
      homeTeam: {
        id: string
        name: string
        color: string
      }
      awayTeam: {
        id: string
        name: string
        color: string
      }
      waitingTeam?: {
        id: string
        name: string
        color: string
      }
      events: Array<{
        id: string
        type: string
        team: string
        player: {
          id: string
          name: string
        }
      }>
    }>
  }>
}

const defaultPointsSystem = {
  win: 3,
  draw: 1,
  loss: 0
}

// Fetch function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch season')
  const data = await res.json()
  return {
    ...data,
    pointsSystem: data.pointsSystem || defaultPointsSystem
  }
}

const getStatusBadgeClasses = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800'
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800'
    case 'WAITING_TO_START':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getWinningTeam = (match: { 
  id: string; 
  homeTeam: { id: string; name: string; color: string; }; 
  awayTeam: { id: string; name: string; color: string; }; 
  waitingTeam?: { id: string; name: string; color: string; } | undefined; 
  events: { type: string; team: string; }[];
  status?: string;
}) => {
  // First check for WIN event
  const winEvent = match.events.find(e => e.type === 'WIN')
  if (winEvent) {
    const team = [match.homeTeam, match.awayTeam, match.waitingTeam].find(t => t?.id === winEvent.team)
    if (team) {
      return { 
        team, 
        goals: match.events.filter(e => e.type === 'GOAL' && e.team === team.id).length 
      }
    }
  }
  
  // If no WIN event but match is completed, fall back to goals
  if (match.status === 'COMPLETED') {
    const homeTeamGoals = match.events.filter(e => e.type === 'GOAL' && e.team === match.homeTeam.id).length
    const awayTeamGoals = match.events.filter(e => e.type === 'GOAL' && e.team === match.awayTeam.id).length
    const waitingTeamGoals = match.waitingTeam ? 
      match.events.filter(e => e.type === 'GOAL' && e.team === match.waitingTeam?.id).length : 0

    const scores = [
      { team: match.homeTeam, goals: homeTeamGoals },
      { team: match.awayTeam, goals: awayTeamGoals }
    ]
    
    if (match.waitingTeam) {
      scores.push({ team: match.waitingTeam, goals: waitingTeamGoals })
    }

    scores.sort((a, b) => b.goals - a.goals)
    return scores[0].goals > scores[1].goals ? scores[0] : null
  }

  return null
}

const TeamDisplay = ({ team, isWinner }: { team: { name: string, color: string }, isWinner: boolean }) => (
  <span className={`inline-flex items-center text-gray-900 ${isWinner ? 'font-bold' : 'text-gray-600'}`}>
    {isWinner && (
      <svg className="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.3-4.9-2.6L5.1 17l.9-5.3-4-3.9 5.5-.8z" />
      </svg>
    )}
    {team.name}
  </span>
)

export default function SeasonPage() {
  const params = useParams()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const isLeagueManager = session?.user?.role === 'LEAGUE_MANAGER'
  const canManageSeason = isAdmin || isLeagueManager

  const { data: season, error, isLoading } = useSWR<Season>(
    params.id && params.seasonId ? `/api/leagues/${params.id}/seasons/${params.seasonId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  )

  const [activeTab, setActiveTab] = useState<"overview" | "fixtures" | "standings" | "stats">("fixtures")

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium text-red-600">Error</h3>
        <p className="mt-2 text-sm text-gray-500">Failed to load season data</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!season) {
    return <div>Season not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/dashboard/leagues/${params.id}`}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Back to League
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">{season.name}</h1>
          <p className="text-sm text-gray-500">
            {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
          </p>
        </div>
        {canManageSeason && (
          <Link
            href={`/dashboard/leagues/${params.id}/seasons/${season.id}/fixtures/new`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Fixture
          </Link>
        )}
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(["overview", "fixtures", "standings", "stats"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-1 pb-4 text-sm font-medium ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">Season Rules</h3>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Points System</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  Win: {season.pointsSystem.win} / Draw: {season.pointsSystem.draw} / Loss: {season.pointsSystem.loss}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Team Size</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {season.teamSize} players {season.teamsPerMatch > 2 && "(Asymmetric teams allowed)"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Teams per Match</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  Maximum {season.teamsPerMatch} teams
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">Quick Stats</h3>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Fixtures</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {season.fixtures?.length || 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Matches</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {season.fixtures?.reduce((total, fixture) => total + (fixture.matches?.length || 0), 0) || 0}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {activeTab === "fixtures" && (
        <div className="space-y-6">
          {season.fixtures?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">No Fixtures</h3>
              <p className="mt-2 text-sm text-gray-500">Get started by adding your first fixture.</p>
              {canManageSeason && (
                <div className="mt-6">
                  <Link
                    href={`/dashboard/leagues/${params.id}/seasons/${season.id}/fixtures/new`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add Fixture
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {season.fixtures.map((fixture) => (
                <div key={fixture.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {new Date(fixture.date).toLocaleDateString()}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(fixture.status)}`}>
                        {fixture.status.replace('_', ' ')}
                      </span>
                    </div>
                    <Link
                      href={`/dashboard/leagues/${params.id}/seasons/${season.id}/fixtures/${fixture.id}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      View Details
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {fixture.matches?.slice(0, 3).map((match) => {
                      const winningTeam = fixture.status === 'COMPLETED' ? getWinningTeam(match) : null
                      return (
                        <div key={match.id} className="border-t border-gray-200 pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex flex-col items-center">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: match.homeTeam.color }}
                                />
                                <TeamDisplay team={match.homeTeam} isWinner={winningTeam?.team.id === match.homeTeam.id} />
                              </div>
                              <span className="text-sm text-gray-500">vs</span>
                              <div className="flex flex-col items-center">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: match.awayTeam.color }}
                                />
                                <TeamDisplay team={match.awayTeam} isWinner={winningTeam?.team.id === match.awayTeam.id} />
                              </div>
                              {match.waitingTeam && (
                                <>
                                  <span className="text-sm text-gray-500">vs</span>
                                  <div className="flex flex-col items-center">
                                    <div
                                      className="w-4 h-4 rounded-full"
                                      style={{ backgroundColor: match.waitingTeam.color }}
                                    />
                                    <TeamDisplay team={match.waitingTeam} isWinner={winningTeam?.team.id === match.waitingTeam.id} />
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="flex items-center space-x-4">
                              {fixture.status === 'COMPLETED' && winningTeam && (
                                <span className="text-sm font-medium text-green-600">
                                  Winner • {winningTeam.goals} goals
                                </span>
                              )}
                              <div className="text-sm text-gray-500">
                                {match.events.length} events
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {fixture.matches && fixture.matches.length > 3 && (
                      <div className="mt-4 text-center">
                        <Link
                          href={`/dashboard/leagues/${params.id}/seasons/${season.id}/fixtures/${fixture.id}`}
                          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Show {fixture.matches.length - 3} More Matches
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "standings" && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Standings</h3>
          <p className="mt-2 text-sm text-gray-500">Coming soon...</p>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Statistics</h3>
          <p className="mt-2 text-sm text-gray-500">Coming soon...</p>
        </div>
      )}

      {canManageSeason && (
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Danger Zone</h3>
          <p className="text-sm text-red-600 mb-4">
            Once you delete a season, there is no going back. Please be certain.
          </p>
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this season? This action cannot be undone.")) {
                // Add delete functionality
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete Season
          </button>
        </div>
      )}
    </div>
  )
} 