'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Star, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from './context/AuthContext'

const heroImages = [
  'https://images.unsplash.com/photo-1735720518679-4c0673e59035',
  'https://images.unsplash.com/photo-1707602985834-eca0a6d63b2f',
  'https://images.unsplash.com/photo-1590708622734-b1b8df3c3576',
]

const categories = [
  {
    slug: 'plushes',
    name: 'Plushes',
    description: 'Super-soft chibi plushies from your favorite series.',
    accent: 'bg-pink-500/10 border-pink-500/30',
  },
  {
    slug: 't-shirts',
    name: 'T-Shirts',
    description: 'Oversized and regular fits with bold anime prints.',
    accent: 'bg-violet-500/10 border-violet-500/30',
  },
  {
    slug: 'action-figures',
    name: 'Action Figures',
    description: 'Dynamic premium and sustainable figures for your shelf.',
    accent: 'bg-emerald-500/10 border-emerald-500/30',
  },
]

function useHeroCarousel(intervalMs = 5000) {
  const [index, setIndex] = useState(0)

  useEffect(() => { 
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % heroImages.length)
    }, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return [index, setIndex]
}

function App() {
  const router = useRouter()
  const { user, loginWithGoogle } = useAuth()
  const [heroIndex, setHeroIndex] = useHeroCarousel()
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const res = await fetch('/api/products?limit=4&sort=popularity')
        const data = await res.json()
        setFeatured(data?.items || [])
      } catch (e) {
        console.error('Failed to load featured products', e)
      }
    }
    loadFeatured()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      {/* Top nav */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20 text-violet-300 text-lg font-bold">
              ON
            </span>
            <div>
              <div className="text-sm font-semibold tracking-wide text-violet-200">
                Dracnoir
              </div>
              <div className="text-xs text-slate-400">Anime merch for your hoard</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white"
              onClick={() => loginWithGoogle()}
            >
              {user ? `Hi, ${user.name?.split?.(' ')?.[0] || 'otaku'}` : 'Login with Google'}
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
      </header>

      {/* Hero section */}
      <main className="container mx-auto px-4 pb-16 pt-8 space-y-12">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-stretch min-h-[480px]">
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60">
            <div className="relative h-full min-h-[18rem] sm:min-h-[20rem] md:min-h-[24rem] w-full">
              <Image
                src={heroImages[heroIndex]}
                alt="Anime merch hero"
                fill
                priority
                className="object-cover object-center brightness-[0.9]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-slate-950/90 via-slate-950/30 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8">
                <div className="space-y-3 sm:space-y-4 max-w-lg">
                  <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    New drop: Spring 2025 Collection
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-50">
                    Build your ultimate <span className="text-violet-300">anime sanctuary</span>.
                  </h1>
                  <p className="text-sm sm:text-base text-slate-300 max-w-xl">
                    Plushes, tees, and figures from iconic series—curated for otaku shelves, gaming setups, and cozy midnight binges.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button
                      className="bg-violet-500 hover:bg-violet-400 text-white text-sm px-4 sm:px-5 py-2 rounded-full flex items-center gap-2"
                      onClick={() => router.push('/products')}
                    >
                      Shop all products
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="border-slate-700 bg-slate-900/60 text-slate-100 hover:bg-slate-800 rounded-full text-sm px-4 sm:px-5 py-2"
                      onClick={() => router.push('/products')}
                    >
                      Browse all categories
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 text-xs text-slate-300">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-amber-300" />
                      <span className="font-semibold">4.9</span>
                      <span className="text-slate-400">/ 5.0 • 2K+ reviews</span>
                    </div>
                    <span className="hidden sm:inline text-slate-400">Free shipping over $80</span>
                  </div>
                  <div className="flex gap-1.5">
                    {heroImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setHeroIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${
                          i === heroIndex ? 'w-5 bg-violet-400' : 'w-2 bg-slate-600'
                        }`}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Categories grid */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center justify-between">
              Shop by category
              <span className="text-xs font-normal text-slate-400">Tap a tile to dive in</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {categories.map((cat) => (
                <Card
                  key={cat.slug}
                  className={`group cursor-pointer border border-slate-800/80 bg-slate-950/80 hover:border-violet-500/60 transition-colors ${cat.accent}`}
                  onClick={() => router.push(`/category/${cat.slug}`)}
                >
                  <CardContent className="flex flex-col justify-between gap-3 p-4">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-50">{cat.name}</h3>
                          <p className="mt-1 text-xs text-slate-300">{cat.description}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-violet-300" />
                      </div>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Curated picks • Limited drops</span>
                      <span className="text-violet-300">Explore</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Featured products */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Trending right now</h2>
            <button
              className="text-xs text-violet-300 hover:text-violet-200"
              onClick={() => router.push('/products')}
            >
              View all
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <Card
                key={product.id}
                className="group overflow-hidden border border-slate-800 bg-slate-950/80 hover:border-violet-500/60 transition-colors flex flex-col cursor-pointer"
                onClick={() => router.push(`/product/${product.slug}`)}
              >
                <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                  {product.images?.[0] && (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>
                <CardContent className="flex flex-1 flex-col justify-between p-4 space-y-2">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wide text-violet-300">
                      {product.type === 'tshirt'
                        ? 'T-Shirt'
                        : product.type === 'plush'
                        ? 'Plush'
                        : 'Figure'}
                    </p>
                    <h3 className="line-clamp-2 text-sm font-semibold text-slate-50">
                      {product.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 text-xs">
                    <div className="flex items-center gap-1 text-amber-300">
                      <Star className="h-3 w-3" />
                      <span>{product.rating?.toFixed?.(1) || '4.8'}</span>
                      <span className="text-slate-500">
                        ({product.reviewCount || 0})
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-50">
                      ${product.price?.toFixed?.(2) ?? '0.00'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {featured.length === 0 && (
              <div className="col-span-full text-center text-sm text-slate-400">
                Loading featured drops...
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
