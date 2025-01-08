"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

type Season = {
  id: string
  name: string
  startDate: string
  endDate: string
  rules: {
    pointsForWin: number
    pointsForDraw: number
    pointsForLoss: number
    teamSize: number
    allowAsymmetricTeams: boolean
    maxTeamsPerMatch: number
  }
  fixtures: Array<{
    id: string
    date: string
    status?: string
    matches: Array<{
      id: string
      homeTeam: {
        id: string
        name: string
      }
      awayTeam: {
        id: string
        name: string
      }
      events: Array<{
        id: string
        type: string
        subType: string | null
        isWowMoment: boolean
        team?: string
        player: {
          id: string
          name: string
        }
      }>
    }>
  }>
}

type FixtureState = 'NOT_STARTED' | 'IN_PROGRESS' | 'FINISHED';

function getFixtureState(fixture: Season['fixtures'][0]): FixtureState {
  // First check if the fixture has the new status field
  if (fixture.status) {
    return fixture.status as FixtureState;
  }

  // Fallback to determining status from events
  // If there are no matches or no events, it hasn't started
  if (!fixture.matches.length || !fixture.matches.some(match => match.events.length > 0)) {
    return 'NOT_STARTED';
  }

  // If any match has events but no WIN event, it's in progress
  const hasUnfinishedMatch = fixture.matches.some(match => 
    match.events.length > 0 && !match.events.some(event => event.type === 'WIN')
  );

  if (hasUnfinishedMatch) {
    return 'IN_PROGRESS';
  }

  // If all matches have WIN events, it's finished
  return 'FINISHED';
}

function getWinningTeam(fixture: Season['fixtures'][0]): { name: string, wins: number } | null {
  if (getFixtureState(fixture) !== 'FINISHED') return null;

  const teamWins = new Map<string, { name: string, wins: number }>();

  fixture.matches.forEach(match => {
    const winEvent = match.events.find(event => event.type === 'WIN' && event.team);
    if (winEvent?.team) {
      const winningTeam = match.homeTeam.id === winEvent.team ? match.homeTeam : match.awayTeam;
      const existing = teamWins.get(winningTeam.id) || { name: winningTeam.name, wins: 0 };
      teamWins.set(winningTeam.id, { ...existing, wins: existing.wins + 1 });
    }
  });

  let maxWins: { name: string, wins: number } | null = null;
  for (const team of teamWins.values()) {
    if (!maxWins || team.wins > maxWins.wins) {
      maxWins = team;
    }
  }
  return maxWins;
}

export default function SeasonDetail() {
  const params = useParams()
  const router = useRouter()
  const [season, setSeason] = useState<Season | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "fixtures" | "standings" | "stats">("overview")

  const fetchSeason = useCallback(async () => {
    try {
      const response = await fetch(`/api/leagues/${params.id}/seasons/${params.seasonId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch season")
      }
      const data = await response.json()
      setSeason(data)
    } catch (error) {
      console.error("Error fetching season:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch season")
    } finally {
      setIsLoading(false)
    }
  }, [params.id, params.seasonId, setSeason, setError, setIsLoading])

  useEffect(() => {
    fetchSeason()
  }, [fetchSeason])

  const handleDeleteSeason = async () => {
    if (!confirm("Are you sure you want to delete this season? This action cannot be undone and will delete all fixtures and matches associated with this season.")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/leagues/${params.id}/seasons/${params.seasonId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Redirect back to league page after successful deletion
      router.push(`/dashboard/leagues/${params.id}`);
    } catch (error) {
      console.error("Failed to delete season:", error);
      setError(error instanceof Error ? error.message : "Failed to delete season");
    }
  };

  const handleDeleteFixture = async (fixtureId: string) => {
    if (!confirm("Are you sure you want to delete this fixture? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/leagues/${params.id}/seasons/${params.seasonId}/fixtures/${fixtureId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Clean up localStorage
      localStorage.removeItem(`fixture_teams_${fixtureId}`);
      localStorage.removeItem(`fixture_timer_${fixtureId}`);

      // Refresh the season data
      await fetchSeason();
    } catch (error) {
      console.error("Failed to delete fixture:", error);
      setError(error instanceof Error ? error.message : "Failed to delete fixture");
    }
  };

  if (isLoading) {
    return <div className="text-center">Loading...</div>
  }

  if (!season) {
    return <div className="text-center">Season not found</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/leagues/${params.id}`}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Back to League
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-2xl font-semibold text-gray-900">{season.name}</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {new Date(season.startDate).toLocaleDateString()} -{" "}
            {new Date(season.endDate).toLocaleDateString()}
          </p>
        </div>
        <Link
          href={`/dashboard/leagues/${params.id}/seasons/${season.id}/fixtures/new`}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
        >
          Add Fixture
        </Link>
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-medium text-gray-900">Season Rules</h3>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-sm text-gray-500">Points System</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  Win: {season.rules.pointsForWin} / Draw: {season.rules.pointsForDraw} / Loss:{" "}
                  {season.rules.pointsForLoss}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Team Size</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {season.rules.teamSize} players
                  {season.rules.allowAsymmetricTeams && " (Asymmetric teams allowed)"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Teams per Match</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  Maximum {season.rules.maxTeamsPerMatch} teams
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-medium text-gray-900">Quick Stats</h3>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-sm text-gray-500">Total Fixtures</dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {season.fixtures.length}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Total Matches</dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {season.fixtures.reduce((acc, fixture) => acc + fixture.matches.length, 0)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">WOW Moments</dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {season.fixtures.reduce(
                    (acc, fixture) =>
                      acc +
                      fixture.matches.reduce(
                        (matchAcc, match) =>
                          matchAcc +
                          match.events.filter((event) => event.isWowMoment).length,
                        0
                      ),
                    0
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {activeTab === "fixtures" && (
        <div className="space-y-4">
          {season.fixtures.map((fixture) => {
            const fixtureState = getFixtureState(fixture);
            const winningTeam = getWinningTeam(fixture);

            return (
              <div
                key={fixture.id}
                className="rounded-lg border border-gray-200 bg-white p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {new Date(fixture.date).toLocaleDateString()}
                    </h3>
                    <div className="mt-1">
                      {fixtureState === 'NOT_STARTED' && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                          Waiting to Start
                        </span>
                      )}
                      {fixtureState === 'IN_PROGRESS' && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          In Progress
                        </span>
                      )}
                      {fixtureState === 'FINISHED' && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          Complete {winningTeam && `• Winner: ${winningTeam.name}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/leagues/${params.id}/seasons/${season.id}/fixtures/${fixture.id}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleDeleteFixture(fixture.id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {fixture.matches.map((match) => {
                    const matchEvents = match.events || [];
                    const hasStarted = matchEvents.length > 0;
                    const isFinished = matchEvents.some(event => event.type === 'WIN');
                    
                    return (
                      <div
                        key={match.id}
                        className={`flex items-center justify-between rounded-lg ${
                          hasStarted ? 'bg-gray-50' : 'bg-gray-50/50'
                        } p-4`}
                      >
                        <div className="flex items-center gap-4">
                          <span className={`font-medium ${hasStarted ? 'text-gray-900' : 'text-gray-500'}`}>
                            {match.homeTeam.name}
                          </span>
                          <span className="text-gray-500">vs</span>
                          <span className={`font-medium ${hasStarted ? 'text-gray-900' : 'text-gray-500'}`}>
                            {match.awayTeam.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {isFinished && (
                            <span className="text-xs text-gray-500">
                              {matchEvents.find(e => e.type === 'WIN')?.team === match.homeTeam.id 
                                ? `${match.homeTeam.name} won`
                                : `${match.awayTeam.name} won`}
                            </span>
                          )}
                          <div className="text-sm text-gray-500">
                            {matchEvents.length} events
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "standings" && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900">
              Standings coming soon...
            </h3>
          </div>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900">
              Statistics coming soon...
            </h3>
          </div>
        </div>
      )}

      {/* Delete Season Section */}
      <div className="mt-8 border-t border-gray-200 pt-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-medium text-red-900">Danger Zone</h3>
          <p className="mt-1 text-sm text-red-600">
            Once you delete a season, there is no going back. Please be certain.
          </p>
          <div className="mt-4">
            <button
              onClick={handleDeleteSeason}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Delete Season
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 