"use client"

import { signIn } from "next-auth/react"
import Image from "next/image"

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Sign in to GoalMates</h2>
          <p className="mt-2 text-sm text-gray-600">
            Start managing your sports leagues today
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Image
              src="/google.svg"
              alt="Google Logo"
              width={24}
              height={24}
              className="mr-2"
            />
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  )
} 