'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, ShoppingCart, Search, X, Menu, Home, Package, Tag, User, LogIn } from 'lucide-react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isHome = pathname === '/'

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setShowSearch(false)
      setSearchQuery('')
    }
  }

  const navTo = (path) => {
    router.push(path)
    setMobileMenuOpen(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">

      {/* ── Mobile Sidebar Drawer ───────────────────────────────────── */}
      {/* Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sliding panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-background border-r border-border shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <button
            onClick={() => navTo('/')}
            className="flex items-center gap-2"
          >
            <span
              className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-purple-500"
              style={{ fontFamily: "'Kelsi', sans-serif" }}
            >
              Dracnoir
            </span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer body */}
        <nav className="flex flex-col gap-1 p-4">
          {/* Home */}
          <button
            onClick={() => navTo('/')}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-colors text-left"
          >
            <Home className="h-4 w-4 text-violet-500" />
            Home
          </button>

          {/* Divider */}
          <div className="my-2 h-px bg-border" />
          <p className="px-3 pb-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
            Shop by Category
          </p>

          <button
            onClick={() => navTo('/category/plushes')}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-colors text-left"
          >
            <Package className="h-4 w-4 text-violet-500" />
            Plushes
          </button>
          <button
            onClick={() => navTo('/category/t-shirts')}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-colors text-left"
          >
            <Package className="h-4 w-4 text-violet-500" />
            T-Shirts
          </button>
          <button
            onClick={() => navTo('/category/action-figures')}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-colors text-left"
          >
            <Package className="h-4 w-4 text-violet-500" />
            Action Figures
          </button>
          <button
            onClick={() => navTo('/products')}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-violet-500 hover:bg-muted transition-colors text-left"
          >
            <Tag className="h-4 w-4" />
            View All Products
          </button>

          {/* Divider */}
          <div className="my-2 h-px bg-border" />
          <p className="px-3 pb-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
            Account
          </p>

          {user ? (
            <button
              onClick={() => navTo('/profile')}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-colors text-left"
            >
              <User className="h-4 w-4 text-violet-500" />
              {`Hi, ${user.name?.split?.(' ')?.[0] || 'otaku'} — Profile`}
            </button>
          ) : (
            <button
              onClick={() => navTo('/login')}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-colors text-left"
            >
              <LogIn className="h-4 w-4 text-violet-500" />
              Login / Sign Up
            </button>
          )}

          {/* Theme toggle in drawer */}
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <span className="text-sm text-muted-foreground flex-1">Theme</span>
            <ThemeToggle />
          </div>
        </nav>
      </aside>

      {/* ── Global Header ───────────────────────────────────────────── */}
      <header className="border-b border-border/80 bg-background/70 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">

          {/* Main header row — relative for absolute-centered brand */}
          <div className="relative flex items-center justify-between">

            {/* ── LEFT: Hamburger + Search + ThemeToggle ── */}
            <div className="flex items-center gap-0.5 sm:gap-1 z-10">
              {/* Hamburger */}
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 px-0 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Search */}
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 px-0 text-muted-foreground hover:text-foreground"
                onClick={() => setShowSearch(!showSearch)}
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </Button>

              {/* Theme Toggle — hidden on mobile (also in drawer) */}
              <span className="hidden sm:inline-flex">
                <ThemeToggle />
              </span>
            </div>

            {/* ── CENTER: Brand name only (absolutely centered) ── */}
            <button
              type="button"
              onClick={() => router.push('/')}
              className="absolute left-1/2 -translate-x-1/2"
              aria-label="Dracnoir home"
            >
              <span
                className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-purple-500 leading-none"
                style={{ fontFamily: "'Kelsi', sans-serif" }}
              >
                Dracnoir
              </span>
            </button>

            {/* ── RIGHT: Account + Cart ── */}
            <div className="flex items-center gap-1 sm:gap-1.5 z-10">
              {/* "Hi, name" / "Login with Google" — desktop only */}
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex h-8 px-2 sm:px-3 text-muted-foreground hover:text-foreground text-xs"
                onClick={() => (user ? router.push('/profile') : loginWithGoogle())}
              >
                {user ? `Hi, ${user.name?.split?.(' ')?.[0] || 'otaku'}` : 'Login with Google'}
              </Button>

              {/* Account button */}
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex h-8 px-2 sm:px-3 border-border bg-card/60 text-foreground hover:bg-muted text-xs"
                onClick={() => router.push(user ? '/profile' : '/login')}
              >
                {user ? 'Account' : 'Login'}
              </Button>

              {/* Cart */}
              <Button
                size="sm"
                className="h-8 px-2 sm:px-3 gap-1 bg-violet-500 hover:bg-violet-400 text-white text-xs"
                onClick={() => router.push('/cart')}
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Cart</span>
              </Button>
            </div>
          </div>

          {/* ── Search Bar (drops down) ── */}
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
                onClick={() => { setShowSearch(false); setSearchQuery('') }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>

        {/* ── Secondary nav (category bar) ── */}
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

      {/* ── Back bar (not on home) ── */}
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

      {/* ── Page content ── */}
      <main className="container mx-auto flex-1 px-4 pb-16 pt-8">
        {children}
      </main>

      {/* ── Global footer ── */}
      <footer className="border-t border-border/80 bg-background/80 text-xs text-muted-foreground">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row">
          <span>© {new Date().getFullYear()} Dracnoir. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-3">
            <button className="hover:text-foreground" type="button">Terms</button>
            <span className="h-3 w-px bg-border" />
            <button className="hover:text-foreground" type="button">Privacy</button>
            <span className="h-3 w-px bg-border" />
            <span className="text-muted-foreground/60">Built for anime collectors.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AppShell
