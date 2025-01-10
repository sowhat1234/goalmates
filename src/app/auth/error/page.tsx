"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold">
              <span className="text-gray-900">Goal</span><span className="text-blue-600">Mates</span>
            </h1>
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Authentication Error</h2>
          <p className="mt-2 text-sm text-gray-600">
            {error === "AccessDenied" && "You do not have permission to sign in."}
            {error === "Configuration" && "There is a problem with the server configuration."}
            {!error && "An error occurred during authentication."}
          </p>
        </div>
        <div className="mt-8">
          <Link
            href="/auth/signin"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
} 