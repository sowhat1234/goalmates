"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"

export default function HomePage() {
  const { data: session, status } = useSession()
  const isLoading = status === "loading"

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600">GoalMates</h1>
          <p className="mt-3 text-lg text-gray-600">
            Your Ultimate Sports League Management Platform
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <div className="w-full h-10 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="w-3/4 mx-auto h-4 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
          ) : session?.user ? (
            <div className="space-y-4">
              <Link
                href="/dashboard"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Dashboard
              </Link>
              <p className="text-center text-sm text-gray-600">
                Welcome back, {session.user.email}!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Link
                href="/auth/signin"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign In
              </Link>
              <p className="text-center text-sm text-gray-600">
                Sign in to manage your leagues and teams
              </p>
            </div>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Create Leagues</h3>
              <p className="mt-2 text-sm text-gray-500">
                Organize and manage your sports leagues with ease
              </p>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Track Stats</h3>
              <p className="mt-2 text-sm text-gray-500">
                Keep track of player statistics and league standings
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
