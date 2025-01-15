import { Suspense } from "react"
import { SetupClient } from "./setup-client"
import { LoadingSpinner } from "@/components/ui/loading"

interface SetupPageProps {
  params: Promise<{
    id: string
    seasonId: string
    fixtureId: string
  }>
}

export default async function SetupPage({ params }: SetupPageProps) {
  const resolvedParams = await params
  const { id, seasonId, fixtureId } = resolvedParams

  return (
    <Suspense fallback={<LoadingSpinner text="Loading setup..." />}>
      <SetupClient 
        id={id}
        seasonId={seasonId}
        fixtureId={fixtureId}
      />
    </Suspense>
  )
} 