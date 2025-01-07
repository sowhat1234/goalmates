"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

type SeasonRules = {
  pointsForWin: number
  pointsForDraw: number
  pointsForLoss: number
  teamSize: number
  allowAsymmetricTeams: boolean
  maxTeamsPerMatch: number
}

export default function NewSeason() {
  const params = useParams()
  const router = useRouter()
  const [name, setName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [rules, setRules] = useState<SeasonRules>({
    pointsForWin: 3,
    pointsForDraw: 1,
    pointsForLoss: 0,
    teamSize: 5,
    allowAsymmetricTeams: true,
    maxTeamsPerMatch: 2,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/leagues/${params.id}/seasons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          startDate,
          endDate,
          rules,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create season")
      }

      router.push(`/dashboard/leagues/${params.id}`)
    } catch (error) {
      console.error("Error creating season:", error)
    }
  }

  const inputClassName = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">New Season</h1>
        <Link
          href={`/dashboard/leagues/${params.id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Back to League
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Season Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClassName}
              required
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700"
              >
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClassName}
                required
              />
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700"
              >
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClassName}
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-900">Season Rules</h2>

          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <label
                htmlFor="pointsForWin"
                className="block text-sm font-medium text-gray-700"
              >
                Points for Win
              </label>
              <input
                type="number"
                id="pointsForWin"
                value={rules.pointsForWin}
                onChange={(e) =>
                  setRules({ ...rules, pointsForWin: parseInt(e.target.value) })
                }
                className={inputClassName}
                required
              />
            </div>
            <div>
              <label
                htmlFor="pointsForDraw"
                className="block text-sm font-medium text-gray-700"
              >
                Points for Draw
              </label>
              <input
                type="number"
                id="pointsForDraw"
                value={rules.pointsForDraw}
                onChange={(e) =>
                  setRules({ ...rules, pointsForDraw: parseInt(e.target.value) })
                }
                className={inputClassName}
                required
              />
            </div>
            <div>
              <label
                htmlFor="pointsForLoss"
                className="block text-sm font-medium text-gray-700"
              >
                Points for Loss
              </label>
              <input
                type="number"
                id="pointsForLoss"
                value={rules.pointsForLoss}
                onChange={(e) =>
                  setRules({ ...rules, pointsForLoss: parseInt(e.target.value) })
                }
                className={inputClassName}
                required
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="teamSize"
                className="block text-sm font-medium text-gray-700"
              >
                Default Team Size
              </label>
              <input
                type="number"
                id="teamSize"
                value={rules.teamSize}
                onChange={(e) =>
                  setRules({ ...rules, teamSize: parseInt(e.target.value) })
                }
                className={inputClassName}
                required
              />
            </div>
            <div>
              <label
                htmlFor="maxTeamsPerMatch"
                className="block text-sm font-medium text-gray-700"
              >
                Max Teams Per Match
              </label>
              <input
                type="number"
                id="maxTeamsPerMatch"
                value={rules.maxTeamsPerMatch}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    maxTeamsPerMatch: parseInt(e.target.value),
                  })
                }
                className={inputClassName}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowAsymmetricTeams"
                checked={rules.allowAsymmetricTeams}
                onChange={(e) =>
                  setRules({ ...rules, allowAsymmetricTeams: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="allowAsymmetricTeams"
                className="ml-2 block text-sm text-gray-700"
              >
                Allow Asymmetric Team Sizes
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              If enabled, teams can have different numbers of players
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
          >
            Create Season
          </button>
        </div>
      </form>
    </div>
  )
} 