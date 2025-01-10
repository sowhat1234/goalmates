"use client"

import { signIn } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function SignInContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')

  const handleGoogleSignIn = () => {
    setIsLoading(true)
    signIn("google", {
      callbackUrl: callbackUrl || "/",
      redirect: true,
    })
  }

  // If we're already on the sign-in page with a callbackUrl that's /auth/signin,
  // redirect to home to prevent loops
  if (callbackUrl?.includes('/auth/signin')) {
    signIn("google", {
      callbackUrl: "/",
      redirect: true,
    })
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold">
              <span className="text-gray-900">Goal</span><span className="text-blue-600">Mates</span>
            </h1>
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Welcome to GoalMates</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in with your Google account to get started
          </p>
        </div>

        <div className="mt-8">
          {error && (
            <div className="mb-4 bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {!isLoading ? (
              <>
                <Image
                  src="/google.svg"
                  alt="Google Logo"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                Continue with Google
              </>
            ) : (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600 mr-3"></div>
                Connecting to Google...
              </div>
            )}
          </button>

          <p className="mt-4 text-center text-sm text-gray-600">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
} 