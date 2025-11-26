'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronRight, ChevronLeft, Star, Search } from 'lucide-react'
import AppShell from './AppShell'

const HomePage = () => {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [trendingProducts, setTrendingProducts] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  
  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const heroSlides = [
    {
      title: 'Build your ultimate anime sanctuary.',
      subtitle: '🎊 New drop: Spring 2025 Collection',
      description:
        'Plushes, tees, and figures from iconic series—curated for otaku shelves, gaming setups, and cozy midnight binges.',
      image: 'https://images.unsplash.com/photo-1607452386484-84a759ab2c01',
      cta: 'Shop all products',
      cta2: 'Browse all categories',
    },
    {
      title: 'Premium figures for collectors.',
      subtitle: '✨ Limited edition drops',
      description:
        'High-quality action figures with stunning details and dynamic poses. From premium to sustainable collectibles.',
      image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477',
      cta: 'Explore figures',
      cta2: null,
    },
  ]

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products?limit=4&sort=popularity'),
        ])
        if (catRes.ok) {
          const catData = await catRes.json()
          setCategories(Array.isArray(catData) ? catData : [])
        }
        if (prodRes.ok) {
          const prodData = await prodRes.json()
          setTrendingProducts(prodData?.items || [])
        }
      } catch (e) {
        console.error('Failed to load homepage data', e)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const slide = heroSlides[currentSlide]

  return (
    <AppShell>
      <div className="space-y-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div
            className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/80"
            style={{
              backgroundImage: `linear-gradient(to bottom right, rgba(15,23,42,0.9), rgba(2,6,23,0.9)), url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="relative z-10 flex min-h-[400px] flex-col justify-between p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80">
                  {slide.subtitle}
                </p>
                <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                  {slide.title}
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  {slide.description}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  className="rounded-full bg-violet-500 px-6 text-sm font-semibold text-white hover:bg-violet-400"
                  onClick={() => router.push('/products')}
                >
                  {slide.cta} <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
                {slide.cta2 && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full border-slate-700 bg-slate-900/60 text-sm text-slate-200 hover:bg-slate-800"
                    onClick={() => router.push('/category/plushes')}
                  >
                    {slide.cta2}
                  </Button>
                )}
              </div>

              <div className="mt-4 flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  4.9 / 5.0 • 2K+ reviews
                </span>
                <span>•</span>
                <span>Free shipping over ₹80</span>
              </div>
            </div>

            {heroSlides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentSlide(
                      (prev) =>
                        (prev - 1 + heroSlides.length) % heroSlides.length,
                    )
                  }
                  className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-700 bg-slate-900/80 p-2 text-slate-300 hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
                  }
                  className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-700 bg-slate-900/80 p-2 text-slate-300 hover:bg-slate-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-4 right-4 z-20 flex gap-1">
                  {heroSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-1.5 w-6 rounded-full transition-colors ${
                        currentSlide === idx
                          ? 'bg-violet-500'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80">
                Categories
              </p>
              <button
                className="text-[11px] text-violet-300 hover:text-violet-200"
                onClick={() => router.push('/products')}
              >
                Tap a tile to dive in
              </button>
            </div>
            <p className="text-xl font-semibold tracking-tight md:text-2xl">
              Shop by category
            </p>
            <div className="grid gap-3">
              {categories.map((cat) => {
                const catMeta = {
                  plushes: {
                    desc: 'Super-soft chibi plushies from your favorite series.',
                    tags: 'Curated picks • Limited drops',
                  },
                  't-shirts': {
                    desc: 'Oversized and regular fits with bold anime prints.',
                    tags: 'Curated picks • Limited drops',
                  },
                  'action-figures': {
                    desc: 'Dynamic premium and sustainable figures for your shelf.',
                    tags: 'Curated picks • Limited drops',
                  },
                }[cat.slug] || { desc: '', tags: '' }

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => router.push(`/category/${cat.slug}`)}
                    className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-left transition-colors hover:border-violet-400 hover:bg-slate-900"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-100 group-hover:text-violet-200">
                        {cat.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">{catMeta.desc}</p>
                      <p className="mt-2 text-[10px] text-slate-500">
                        {catMeta.tags}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="rounded-full bg-violet-500 text-[11px] hover:bg-violet-400"
                    >
                      Explore
                    </Button>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80">
                Featured
              </p>
              <p className="text-xl font-semibold tracking-tight md:text-2xl">
                Trending right now
              </p>
            </div>
            <button
              className="text-xs text-violet-300 hover:text-violet-200"
              onClick={() => router.push('/products')}
            >
              View all
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {trendingProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => router.push(`/product/${product.slug}`)}
                className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80 text-left transition-colors hover:border-violet-400 hover:bg-slate-900"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-900">
                  <img
                    src={product.images?.[0] || ''}
                    alt={product.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs text-slate-400">{product.series}</p>
                  <p className="mt-1 text-sm font-medium text-slate-100 group-hover:text-violet-200">
                    {product.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-violet-300">
                    ₹{product.price?.toFixed?.(0) ?? '0'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

export default HomePage
