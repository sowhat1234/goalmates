"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { FaUsers, FaPlus, FaFutbol, FaHandsHelping, FaShieldAlt, FaTrash } from "react-icons/fa"

interface Player {
  id: string
  name: string
  league: {
    id: string
    name: string
  }
  stats: {
    goals: number
    assists: number
    saves: number
    yellowCards: number
    redCards: number
    wowMoments: number
  }
}

export default function PlayersDashboard() {
  const { data: session } = useSession()
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletePlayerId, setDeletePlayerId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const isPrivilegedUser = session?.user?.role === 'ADMIN' || session?.user?.role === 'LEAGUE_MANAGER'

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch('/api/players')
        if (!response.ok) throw new Error('Failed to fetch players')
        const data = await response.json()
        setPlayers(data)
      } catch (error) {
        console.error('Error fetching players:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlayers()
  }, [])

  const handleDelete = async (playerId: string) => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/players/${playerId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete player')
      
      // Remove player from state
      setPlayers(players.filter(player => player.id !== playerId))
    } catch (error) {
      console.error('Error deleting player:', error)
    } finally {
      setIsDeleting(false)
      setDeletePlayerId(null)
    }
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Players</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all players across your leagues with their statistics and achievements.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/dashboard/players/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <FaPlus className="mr-2" />
            New Player
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletePlayerId && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FaTrash className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      Delete Player
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this player? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => handleDelete(deletePlayerId)}
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletePlayerId(null)}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Players List */}
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
            ) : players.length === 0 ? (
              <div className="text-center py-12">
                <FaUsers className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No players</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding a new player.</p>
                <div className="mt-6">
                  <Link
                    href="/dashboard/players/new"
                    className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <FaPlus className="mr-2" />
                    New Player
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        League
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        <div className="flex items-center">
                          <FaFutbol className="mr-1" />
                          Goals
                        </div>
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        <div className="flex items-center">
                          <FaHandsHelping className="mr-1" />
                          Assists
                        </div>
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        <div className="flex items-center">
                          <FaShieldAlt className="mr-1" />
                          Saves
                        </div>
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {players.map((player) => (
                      <tr key={player.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {player.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {player.league.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {player.stats.goals}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {player.stats.assists}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {player.stats.saves}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex items-center justify-end space-x-4">
                            <Link
                              href={`/dashboard/leagues/${player.league.id}/players/${player.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View<span className="sr-only">, {player.name}</span>
                            </Link>
                            {isPrivilegedUser && (
                              <button
                                onClick={() => setDeletePlayerId(player.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FaTrash className="h-4 w-4" />
                                <span className="sr-only">Delete {player.name}</span>
                              </button>
                            )}
                          </div>
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