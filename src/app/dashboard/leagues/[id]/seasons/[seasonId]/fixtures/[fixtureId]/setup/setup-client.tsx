"use client"

import { TeamSelection } from "@/components/fixture/setup/team-selection"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { LoadingSpinner } from "@/components/ui/loading"

interface SetupClientProps {
  id: string
  seasonId: string
  fixtureId: string
}

export function SetupClient({ id, seasonId, fixtureId }: SetupClientProps) {
  const router = useRouter()
  const [fixture, setFixture] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFixture = async () => {
      if (!id || !seasonId || !fixtureId) {
        setError('Missing required parameters')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/leagues/${id}/seasons/${seasonId}/fixtures/${fixtureId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch fixture')
        }
        const data = await response.json()
        
        if (data.status !== 'NOT_STARTED') {
          router.push(`/dashboard/leagues/${id}/seasons/${seasonId}/fixtures/${fixtureId}`)
          return
        }

        setFixture(data)
      } catch (error) {
        console.error('Error fetching fixture:', error)
        setError(error instanceof Error ? error.message : 'Failed to load fixture')
      } finally {
        setLoading(false)
      }
    }

    fetchFixture()
  }, [id, seasonId, fixtureId, router])

  if (loading) {
    return <LoadingSpinner text="Loading fixture..." />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!fixture) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <TeamSelection 
        match={fixture.matches[0]} 
        fixtureId={fixtureId}
        onStart={async (homeName: string, awayName: string, waitingName: string) => {
          try {
            const response = await fetch(`/api/leagues/${id}/seasons/${seasonId}/fixtures/${fixtureId}/start`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                homeTeam: homeName,
                awayTeam: awayName,
                waitingTeam: waitingName,
              }),
            })

            if (!response.ok) {
              const errorData = await response.text()
              throw new Error(errorData || 'Failed to start match')
            }

            router.push(`/dashboard/leagues/${id}/seasons/${seasonId}/fixtures/${fixtureId}`)
          } catch (error) {
            console.error('Error starting match:', error)
            throw new Error('Failed to start match')
          }
        }}
      />
    </div>
  )
} 