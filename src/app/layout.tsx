import { Inter } from 'next/font/google'
import { NextAuthProvider } from '@/providers/auth'
import './globals.css'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: "GoalMates - Sports League Management",
  description: "Manage your sports leagues, track statistics, and record memorable moments.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
      </head>
      <body className={inter.className}>
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  )
}
