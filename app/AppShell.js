'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, ShoppingCart, Search } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { Button } from '@/components/ui/button'

const AppShell = ({ children }) => {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loginWithGoogle } = useAuth()

  const isHome = pathname === '/'

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      {/* Global header */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <button
            type="button"
            className="flex items-center gap-2 sm:gap-3 text-left"
            onClick={() => router.push('/')}
          >
            <span className="inline-flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-base sm:text-xl font-bold shadow-lg shadow-violet-500/30">
              ON
            </span>
            <div className="hidden sm:block">
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-purple-300">
                Dracnoir
              </div>
              <div className="text-xs text-slate-400">Anime merch for your hoard</div>
            </div>
          </button>

          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white"
              onClick={() => router.push('/products')}
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white"
              onClick={() => (user ? router.push('/profile') : loginWithGoogle())}
            >
              {user ? `Hi, ${user.name?.split?.(' ')?.[0] || 'otaku'}` : 'Login with Google'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800"
              onClick={() => router.push(user ? '/profile' : '/login')}
            >
              {user ? 'Account options' : 'Login/Signup via Email'}
            </Button>
            <Button
              size="sm"
              className="gap-1 bg-violet-500 hover:bg-violet-400 text-white"
              onClick={() => router.push('/cart')}
            >
              <ShoppingCart className="h-4 w-4" />
              Cart
            </Button>
          </div>
        </div>

        {/* Secondary nav: show on all pages for now */}
        <div className="border-t border-slate-800/80 bg-slate-950/80">
          <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs sm:text-sm">
            <div className="flex flex-wrap items-center gap-3 text-slate-300">
              <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                Shop by category
              </span>
              <button
                className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-200 hover:border-violet-400 hover:text-violet-200"
                onClick={() => router.push('/category/plushes')}
              >
                Plushes
              </button>
              <button
                className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-200 hover:border-violet-400 hover:text-violet-200"
                onClick={() => router.push('/category/t-shirts')}
              >
                T-Shirts
              </button>
              <button
                className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-200 hover:border-violet-400 hover:text-violet-200"
                onClick={() => router.push('/category/action-figures')}
              >
                Action Figures
              </button>
            </div>
            <button
              className="text-[11px] text-violet-300 hover:text-violet-200"
              onClick={() => router.push('/products')}
            >
              View all products
            </button>
          </div>
        </div>
      </header>

      {/* Back bar (not on home) */}
      {!isHome && (
        <div className="border-b border-slate-800/80 bg-slate-950/80">
          <div className="container mx-auto px-4 py-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-slate-100"
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
      <footer className="border-t border-slate-800/80 bg-slate-950/80 text-xs text-slate-400">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row">
          <span>© {new Date().getFullYear()} Dracnoir. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-3">
            <button className="hover:text-slate-200" type="button">
              Terms
            </button>
            <span className="h-3 w-px bg-slate-700" />
            <button className="hover:text-slate-200" type="button">
              Privacy
            </button>
            <span className="h-3 w-px bg-slate-700" />
            <span className="text-slate-500">Built for anime collectors.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AppShell
