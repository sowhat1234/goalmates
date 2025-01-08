import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { JWT } from "next-auth/jwt"
import { Session } from "next-auth"

interface ExtendedToken extends JWT {
  id?: string
  sub?: string
  name?: string | null
  email?: string | null
  picture?: string | null
}

interface ExtendedSession extends Omit<Session, "user"> {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async jwt({ token, account }): Promise<ExtendedToken> {
      if (account) {
        token.id = token.sub
      }
      return token
    },
    async session({ token, session }): Promise<ExtendedSession> {
      if (token && session.user) {
        session.user.id = token.sub || ""
        session.user.name = token.name || ""
        session.user.email = token.email || ""
        session.user.image = token.picture || null
      }
      return session as ExtendedSession
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
} 