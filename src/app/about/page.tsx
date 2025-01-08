import Link from 'next/link'
import { FaTrophy, FaUsers, FaChartLine, FaFutbol } from 'react-icons/fa'

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-4xl py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              About GoalMates
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              GoalMates is your ultimate companion for organizing and managing sports leagues. Whether you&apos;re running a casual office tournament or a competitive local league, we&apos;ve got you covered.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Everything You Need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Features that make league management a breeze
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
              <div className="flex flex-col">
                <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <FaTrophy className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">League Organization</h3>
                <p className="mt-4 text-gray-600">
                  Create and manage multiple leagues, seasons, and fixtures. Set custom rules, team sizes, and scoring systems to match your needs.
                </p>
              </div>
              <div className="flex flex-col">
                <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <FaUsers className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Team Management</h3>
                <p className="mt-4 text-gray-600">
                  Easily manage teams and players. Track performance, assign roles, and keep everyone organized throughout the season.
                </p>
              </div>
              <div className="flex flex-col">
                <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <FaChartLine className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Statistics & Analytics</h3>
                <p className="mt-4 text-gray-600">
                  Get detailed insights into player and team performance. Track goals, assists, saves, and more with our comprehensive statistics system.
                </p>
              </div>
              <div className="flex flex-col">
                <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <FaFutbol className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Match Management</h3>
                <p className="mt-4 text-gray-600">
                  Record match events in real-time, manage scores, and keep track of game highlights with our intuitive match interface.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Join GoalMates today and transform the way you manage your sports leagues.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/auth/signin"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get Started
              </Link>
              <Link
                href="/"
                className="text-sm font-semibold leading-6 text-white hover:text-blue-100"
              >
                Back to Home <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 