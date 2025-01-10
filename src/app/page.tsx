"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { PublicHeader } from "@/components/public-header"
import { Trophy, Users, BarChart3, Activity, ArrowRight } from 'lucide-react'

const features = [
  {
    name: "Create Leagues",
    description: "Organize and manage your sports leagues with ease",
    icon: Trophy,
    color: "bg-blue-500"
  },
  {
    name: "Team Management",
    description: "Build and manage teams, assign roles, and track performance",
    icon: Users,
    color: "bg-green-500"
  },
  {
    name: "Live Statistics",
    description: "Real-time stats and analytics for all your matches",
    icon: BarChart3,
    color: "bg-purple-500"
  },
  {
    name: "Match Tracking",
    description: "Track live matches, scores, and player performance",
    icon: Activity,
    color: "bg-orange-500"
  }
]

const stats = [
  { name: "Active Leagues", value: "500+" },
  { name: "Players", value: "10k+" },
  { name: "Matches Tracked", value: "25k+" },
  { name: "Teams", value: "1,000+" }
]

export default function HomePage() {
  const { data: session, status } = useSession()
  const isLoading = status === "loading"

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      
      {/* Hero Section */}
      <div className="relative isolate">
        {/* Background gradient */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-600 to-blue-400 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl animate-fade-in">
              Welcome to GoalMates
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 animate-fade-in-delay-1">
              Your Ultimate Sports League Management Platform
            </p>

            {isLoading ? (
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <div className="h-12 w-32 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            ) : session?.user ? (
              <div className="mt-10 flex flex-col items-center gap-4 animate-fade-in-delay-2">
                <Link
                  href="/dashboard"
                  className="rounded-md bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all duration-200 hover:scale-105"
                >
                  Go to Dashboard
                </Link>
                <p className="text-sm text-gray-600">
                  Welcome back, {session.user.name || session.user.email}!
                </p>
              </div>
            ) : (
              <div className="mt-10 flex items-center justify-center gap-x-6 animate-fade-in-delay-2">
                <Link
                  href="/auth/signin"
                  className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all duration-200 hover:scale-105"
                >
                  Get Started
                </Link>
                <Link
                  href="/about"
                  className="text-sm font-semibold leading-6 text-gray-900 flex items-center group"
                >
                  Learn more <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Trusted by leagues worldwide
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                Join thousands of sports enthusiasts who manage their leagues with GoalMates
              </p>
            </div>
            <dl className="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.name}
                  className="flex flex-col bg-gray-50 p-8 hover:bg-gray-100 transition-all duration-200 hover:scale-105"
                >
                  <dt className="text-sm font-semibold leading-6 text-gray-600">{stat.name}</dt>
                  <dd className="order-first text-3xl font-semibold tracking-tight text-blue-600">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Everything You Need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Features that make league management a breeze
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
              {features.map((feature) => (
                <div 
                  key={feature.name} 
                  className="flex flex-col transition-all duration-300 hover:-translate-y-2"
                >
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <div className={`rounded-lg ${feature.color} p-3 ring-1 ring-inset ring-gray-200`}>
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white">
        <div className="mx-auto max-w-7xl py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="relative isolate overflow-hidden bg-blue-600 px-6 py-24 text-center shadow-2xl sm:rounded-3xl sm:px-16 hover:scale-[1.02] transition-transform duration-300">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to elevate your league management?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Join GoalMates today and transform the way you manage your sports leagues.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href={session ? "/dashboard" : "/auth/signin"}
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all duration-200 hover:scale-105"
              >
                {session ? "Go to Dashboard" : "Get Started"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
