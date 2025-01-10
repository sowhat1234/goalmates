import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'USER' | 'LEAGUE_MANAGER' | 'ADMIN'
    } & DefaultSession["user"]
  }
} 

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name: string
    role: 'USER' | 'LEAGUE_MANAGER' | 'ADMIN'
  }
} 