"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"

type Season = {
  id: string
  name: string
  startDate: string
  endDate: string
  rules: {
    pointsForWin: number
    pointsForDraw: number
    pointsForLoss: number
  }
}

type League = {
  id: string
  name: string
  ownerId: string
}

export default function SeasonsPage() {
  const params = useParams()
  const { data: session } = useSession()
  const [seasons, setSeasons] = useState<Season[]>([])
  const [league, setLeague] = useState<League | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [seasonsResponse, leagueResponse] = await Promise.all([
          fetch(`/api/leagues/${params.id}/seasons`),
          fetch(`/api/leagues/${params.id}`)
        ])
        
        if (!seasonsResponse.ok) throw new Error('Failed to fetch seasons')
        if (!leagueResponse.ok) throw new Error('Failed to fetch league')
        
        const [seasonsData, leagueData] = await Promise.all([
          seasonsResponse.json(),
          leagueResponse.json()
        ])
        
        setSeasons(seasonsData)
        setLeague(leagueData)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch data')
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user) {
      fetchData()
    }
  }, [params.id, session])

  const isAdmin = session?.user?.role === 'ADMIN'
  const isOwner = league?.ownerId === session?.user?.id
  const canManageLeague = isAdmin || isOwner

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Seasons</h1>
        {canManageLeague && (
          <Link
            href={`/dashboard/leagues/${params.id}/seasons/new`}
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            New Season
          </Link>
        )}
      </div>

      <div className="flex flex-nowrap overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-gray-200">
        <Link
          href={`/dashboard/leagues/${params.id}`}
          className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 whitespace-nowrap mr-8"
        >
          Overview
        </Link>
        <Link
          href={`/dashboard/leagues/${params.id}/seasons`}
          className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600 whitespace-nowrap mr-8"
        >
          Seasons
        </Link>
        <Link
          href={`/dashboard/leagues/${params.id}/players`}
          className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 whitespace-nowrap"
        >
          Players
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-red-600">Error</h3>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
        </div>
      ) : seasons.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">No Seasons</h3>
          <p className="mt-2 text-sm text-gray-500">Get started by creating your first season.</p>
          {canManageLeague && (
            <div className="mt-6">
              <Link
                href={`/dashboard/leagues/${params.id}/seasons/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Season
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {seasons.map((season) => (
            <Link
              key={season.id}
              href={`/dashboard/leagues/${params.id}/seasons/${season.id}`}
              className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-medium text-gray-900">{season.name}</h3>
              <div className="mt-2 text-sm text-gray-500">
                <p>
                  {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                </p>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div>
                  <dt className="inline text-gray-500">Win: </dt>
                  <dd className="inline text-gray-900">{season.rules.pointsForWin} points</dd>
                </div>
                <div>
                  <dt className="inline text-gray-500">Draw: </dt>
                  <dd className="inline text-gray-900">{season.rules.pointsForDraw} points</dd>
                </div>
                <div>
                  <dt className="inline text-gray-500">Loss: </dt>
                  <dd className="inline text-gray-900">{season.rules.pointsForLoss} points</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
} 