"use client"

import { signIn } from "next-auth/react"
import Image from "next/image"

export default function SignIn() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Sign in to GoalMates
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Start managing your sports leagues today
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition hover:bg-gray-50"
          >
            <Image
              src="/google.svg"
              alt="Google logo"
              width={20}
              height={20}
              className="h-5 w-5"
            />
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    </div>
  )
} 