"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import Image from 'next/image'
import { FaTrophy, FaUsers, FaCalendarAlt, FaChartBar } from "react-icons/fa"
import { useState } from "react"

export default function Home() {
  const { data: session, status } = useSession()
  const [showDropdown, setShowDropdown] = useState(false)

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/" })
  }

  // If authenticated, show dashboard content
  if (session?.user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                {/* Logo */}
                <div className="flex-shrink-0 flex items-center">
                  <Link href="/" className="text-2xl font-bold text-gray-900">
                    Goal<span className="text-blue-600">Mates</span>
                  </Link>
                </div>
                {/* Navigation Links */}
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    href="/dashboard/leagues"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    <FaTrophy className="mr-2" />
                    Leagues
                  </Link>
                  <Link
                    href="/dashboard/players"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    <FaUsers className="mr-2" />
                    Players
                  </Link>
                  <Link
                    href="/dashboard/fixtures"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    <FaCalendarAlt className="mr-2" />
                    Fixtures
                  </Link>
                  <Link
                    href="/dashboard/statistics"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    <FaChartBar className="mr-2" />
                    Statistics
                  </Link>
                </div>
              </div>
              {/* User Menu */}
              <div className="flex items-center">
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-3 focus:outline-none"
                  >
                    <Image
                      width={32}
                      height={32}
                      className="rounded-full ring-2 ring-gray-200 hover:ring-blue-600 transition-all"
                      src={session.user.image || "https://www.gravatar.com/avatar/?d=mp"}
                      alt={session.user.name || "User"}
                    />
                  </button>
                  
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                          {session.user.name || "User"}
                        </div>
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Quick Stats Cards */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FaTrophy className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Active Leagues</dt>
                        <dd className="text-lg font-medium text-gray-900">5</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FaUsers className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Players</dt>
                        <dd className="text-lg font-medium text-gray-900">24</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FaCalendarAlt className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Upcoming Fixtures</dt>
                        <dd className="text-lg font-medium text-gray-900">3</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FaChartBar className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Matches</dt>
                        <dd className="text-lg font-medium text-gray-900">12</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                  href="/dashboard/leagues/new"
                  className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <FaTrophy className="mx-auto h-12 w-12 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-900">Create New League</span>
                </Link>
                <Link
                  href="/dashboard/fixtures/new"
                  className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-900">Schedule Fixture</span>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // If not authenticated, show landing page
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                Goal<span className="text-blue-600">Mates</span>
              </Link>
            </div>
            <div className="flex items-center">
              <Link
                href="/api/auth/signin"
                className="ml-8 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Manage your sports leagues,</span>
              <span className="block text-blue-600">track statistics, and record memorable moments.</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Create leagues, manage teams, track scores, and keep everyone in the game with our easy-to-use sports league management platform.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link
                  href="/api/auth/signin"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                >
                  Get Started
                </Link>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link
                  href="/about"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
