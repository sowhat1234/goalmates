import { Inter } from 'next/font/google'
import { NextAuthProvider } from '@/providers/auth'
import Script from 'next/script'
import { GA_TRACKING_ID } from '@/lib/analytics'
import './globals.css'

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
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  )
}
