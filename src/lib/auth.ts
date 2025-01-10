import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false

      try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: {
            accounts: true,
          },
        })

        if (!existingUser) {
          // Create new user if doesn't exist
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || user.email.split('@')[0],
              image: user.image || null,
              role: 'USER',
              accounts: {
                create: {
                  type: account?.type || "oauth",
                  provider: account?.provider || "google",
                  providerAccountId: account?.providerAccountId || "",
                  access_token: account?.access_token,
                  token_type: account?.token_type,
                  scope: account?.scope,
                  id_token: account?.id_token,
                }
              }
            },
          })
          return true
        }

        // If user exists but no account is linked, link the account
        if (existingUser && !existingUser.accounts.length) {
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: account?.type || "oauth",
              provider: account?.provider || "google",
              providerAccountId: account?.providerAccountId || "",
              access_token: account?.access_token,
              token_type: account?.token_type,
              scope: account?.scope,
              id_token: account?.id_token,
            },
          })
          return true
        }

        // Allow sign in if the account is already linked
        return true
      } catch (error) {
        console.error("Error in signIn callback:", error)
        return false
      }
    },
    async jwt({ token, user }) {
      if (user) {
        // Get user from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            role: true,
          },
        })

        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as 'USER' | 'LEAGUE_MANAGER' | 'ADMIN'
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url
      if (url.startsWith('/')) return `${baseUrl}${url}`
      return baseUrl
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    signOut: "/"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  }
} 