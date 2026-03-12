'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, ShoppingCart, Search, X } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ThemeToggle from '@/components/theme-toggle'

const AppShell = ({ children }) => {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loginWithGoogle } = useAuth()
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const isHome = pathname === '/'

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setShowSearch(false)
      setSearchQuery('')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Global header */}
      <header className="border-b border-border/80 bg-background/70 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="flex items-center gap-2 sm:gap-3 text-left"
              onClick={() => router.push('/')}
            >
              <span className="inline-flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-base sm:text-xl font-bold shadow-lg shadow-violet-500/30">
                ON
              </span>
              <div className="hidden sm:block">
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-purple-500">
                  Dracnoir
                </div>
                <div className="text-xs text-muted-foreground">Anime merch for your hoard</div>
              </div>
            </button>

            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 sm:px-3 text-muted-foreground hover:text-foreground"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="h-4 w-4" />
              </Button>

              {/* Theme Toggle */}
              <ThemeToggle />

              <Button
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex h-8 px-2 sm:px-3 text-muted-foreground hover:text-foreground"
                onClick={() => (user ? router.push('/profile') : loginWithGoogle())}
              >
                {user ? `Hi, ${user.name?.split?.(' ')?.[0] || 'otaku'}` : 'Login with Google'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 sm:px-3 border-border bg-card/60 text-foreground hover:bg-muted"
                onClick={() => router.push(user ? '/profile' : '/login')}
              >
                <span className="hidden sm:inline">{user ? 'Account' : 'Login'}</span>
                <span className="sm:hidden">{user ? 'Profile' : 'Login'}</span>
              </Button>
              <Button
                size="sm"
                className="h-8 px-2 sm:px-3 gap-1 bg-violet-500 hover:bg-violet-400 text-white"
                onClick={() => router.push('/cart')}
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Cart</span>
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <form onSubmit={handleSearch} className="mt-3 relative">
              <Input
                type="text"
                placeholder="Search for anime merch, plushes, figures, t-shirts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="h-10 rounded-full border-border bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-violet-500 focus:ring-violet-500"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <button
                type="button"
                onClick={() => {
                  setShowSearch(false)
                  setSearchQuery('')
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>

        {/* Secondary nav */}
        <div className="border-t border-border/80 bg-background/80 overflow-x-auto">
          <div className="container mx-auto flex items-center justify-between gap-2 sm:gap-3 px-4 py-2 text-xs sm:text-sm min-w-max sm:min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
              <span className="hidden sm:inline text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60">
                Shop by category
              </span>
              <button
                className="rounded-full border border-border bg-card/80 px-2 sm:px-3 py-1 text-[10px] sm:text-[11px] text-foreground/80 hover:border-violet-400 hover:text-violet-500 whitespace-nowrap"
                onClick={() => router.push('/category/plushes')}
              >
                Plushes
              </button>
              <button
                className="rounded-full border border-border bg-card/80 px-2 sm:px-3 py-1 text-[10px] sm:text-[11px] text-foreground/80 hover:border-violet-400 hover:text-violet-500 whitespace-nowrap"
                onClick={() => router.push('/category/t-shirts')}
              >
                T-Shirts
              </button>
              <button
                className="rounded-full border border-border bg-card/80 px-2 sm:px-3 py-1 text-[10px] sm:text-[11px] text-foreground/80 hover:border-violet-400 hover:text-violet-500 whitespace-nowrap"
                onClick={() => router.push('/category/action-figures')}
              >
                Figures
              </button>
            </div>
            <button
              className="text-[10px] sm:text-[11px] text-violet-500 hover:text-violet-400 whitespace-nowrap"
              onClick={() => router.push('/products')}
            >
              View all
            </button>
          </div>
        </div>
      </header>

      {/* Back bar (not on home) */}
      {!isHome && (
        <div className="border-b border-border/80 bg-background/80">
          <div className="container mx-auto px-4 py-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              onClick={() => router.back()}
            >
              <ChevronLeft className="h-3 w-3" /> Back
            </button>
          </div>
        </div>
      )}

      {/* Page content */}
      <main className="container mx-auto flex-1 px-4 pb-16 pt-8">
        {children}
      </main>

      {/* Global footer */}
      <footer className="border-t border-border/80 bg-background/80 text-xs text-muted-foreground">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row">
          <span>© {new Date().getFullYear()} Dracnoir. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-3">
            <button className="hover:text-foreground" type="button">
              Terms
            </button>
            <span className="h-3 w-px bg-border" />
            <button className="hover:text-foreground" type="button">
              Privacy
            </button>
            <span className="h-3 w-px bg-border" />
            <span className="text-muted-foreground/60">Built for anime collectors.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AppShell
