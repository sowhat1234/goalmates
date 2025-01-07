import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.id = token.sub
      }
      return token
    },
    async session({ token, session }) {
      if (token && session.user) {
        session.user.id = token.sub || ""
        session.user.name = token.name || ""
        session.user.email = token.email || ""
        session.user.image = token.picture || ""
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
} 