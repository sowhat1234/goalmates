"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { UserCircle, Menu } from "lucide-react"
import { signOut } from "next-auth/react"
import { useState, useRef, useEffect } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const isAdmin = session?.user?.role === 'ADMIN'
  const isLeagueManager = session?.user?.role === 'LEAGUE_MANAGER'
  const isPrivilegedUser = isAdmin || isLeagueManager

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false)
      }
      if (
        isUserMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen, isUserMenuOpen])

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Leagues', href: '/dashboard/leagues' },
    { name: 'Statistics', href: '/dashboard/stats' },
  ]

  // Add admin/league manager specific navigation items
  if (isPrivilegedUser) {
    navigation.push(
      { name: 'Players', href: '/dashboard/players' },
      { name: 'League Management', href: '/dashboard/league-management' }
    )
  }

  if (isAdmin) {
    navigation.push(
      { name: 'User Management', href: '/dashboard/users' },
      { name: 'System Stats', href: '/dashboard/statistics' }
    )
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const handleNavigation = (href: string) => {
    setIsMobileMenuOpen(false)
    router.push(href)
  }

  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'User'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/" className="text-xl font-bold text-blue-600">
                  {isAdmin ? 'GoalMates Admin' : isLeagueManager ? 'GoalMates Manager' : 'GoalMates'}
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                        isActive
                          ? "border-b-2 border-blue-500 text-gray-900"
                          : "border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      }`}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="relative ml-3" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  <UserCircle className="h-8 w-8 text-gray-400" aria-hidden="true" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">{userName}</p>
                    <p className="text-xs text-gray-500">{session?.user?.role?.toLowerCase()}</p>
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 py-1 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                      Signed in as<br />
                      <span className="font-medium text-gray-900">{session?.user?.email}</span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center sm:hidden">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                <Menu className="block h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div 
          ref={mobileMenuRef}
          className={`${isMobileMenuOpen ? 'block' : 'hidden'} sm:hidden`} 
          id="mobile-menu"
        >
          <div className="space-y-1 pb-3 pt-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`block w-full border-l-4 py-2 pl-3 pr-4 text-left text-base font-medium ${
                    isActive
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  {item.name}
                </button>
              )
            })}
          </div>
          <div className="border-t border-gray-200 pb-3 pt-4">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <UserCircle className="h-8 w-8 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-700">{userName}</div>
                <div className="text-xs text-gray-500">{session?.user?.role?.toLowerCase()}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  handleSignOut()
                }}
                className="block w-full px-4 py-2 text-left text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  )
} 