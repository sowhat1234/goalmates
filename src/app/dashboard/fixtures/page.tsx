"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { FaCalendarAlt, FaPlus, FaClock, FaCheckCircle } from "react-icons/fa"

interface Fixture {
  id: string
  date: string
  status: 'WAITING_TO_START' | 'IN_PROGRESS' | 'COMPLETED'
  season: {
    id: string
    name: string
    league: {
      id: string
      name: string
    }
  }
  matches: {
    id: string
    homeTeam: {
      name: string
      _count?: {
        events: number
      }
    }
    awayTeam: {
      name: string
      _count?: {
        events: number
      }
    }
  }[]
}

export default function FixturesDashboard() {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFixtures = async () => {
      try {
        const response = await fetch('/api/fixtures')
        if (!response.ok) throw new Error('Failed to fetch fixtures')
        const data = await response.json()
        setFixtures(data)
      } catch (error) {
        console.error('Error fetching fixtures:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFixtures()
  }, [])

  const getStatusBadge = (status: Fixture['status']) => {
    switch (status) {
      case 'WAITING_TO_START':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FaClock className="mr-1" />
            Upcoming
          </span>
        )
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FaCalendarAlt className="mr-1" />
            In Progress
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <FaCheckCircle className="mr-1" />
            Completed
          </span>
        )
    }
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Fixtures</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage all your fixtures across different leagues and seasons.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/dashboard/fixtures/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <FaPlus className="mr-2" />
            New Fixture
          </Link>
        </div>
      </div>

      {/* Fixtures List */}
      <div className="mt-8 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            {isLoading ? (
              <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white shadow rounded-lg p-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : fixtures.length === 0 ? (
              <div className="text-center py-12">
                <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No fixtures</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new fixture.</p>
                <div className="mt-6">
                  <Link
                    href="/dashboard/fixtures/new"
                    className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <FaPlus className="mr-2" />
                    New Fixture
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Date
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        League / Season
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Teams
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {fixtures.map((fixture) => (
                      <tr key={fixture.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {new Date(fixture.date).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {fixture.season.league.name} / {fixture.season.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {fixture.matches[0]?.homeTeam.name} vs {fixture.matches[0]?.awayTeam.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {getStatusBadge(fixture.status)}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            href={`/dashboard/leagues/${fixture.season.league.id}/seasons/${fixture.season.id}/fixtures/${fixture.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View<span className="sr-only">, {fixture.id}</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 