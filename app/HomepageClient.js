'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft, Star } from 'lucide-react'
import AppShell from './AppShell'

// ── Static data ────────────────────────────────────────────────────────────

const UNIVERSES = [
  { id: 'naruto',          name: 'Naruto',          slug: 'naruto',          image: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1775379361/Naruto_Preview_a4e9jv.webp' },
  { id: 'jujutsu-kaisen',  name: 'Jujutsu Kaisen',  slug: 'jujutsu-kaisen',  image: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1775379424/Jujutsu_Kaisen_Preview_rxrla4.webp' },
  { id: 'attack-on-titan', name: 'Attack on Titan', slug: 'attack-on-titan', image: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1773779309/download_4_cuu1u7.webp' },
  { id: 'demon-slayer',    name: 'Demon Slayer',    slug: 'demon-slayer',    image: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1775379477/Demon_Slayer_Preview_znizer.webp' },
  { id: 'dragon-ball',     name: 'Dragon Ball',     slug: 'dragon-ball',     image: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1775379423/Dragon_Ball_Preview_p4hkfo.webp' },
  { id: 'one-piece',       name: 'One Piece',       slug: 'one-piece',       image: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1775379365/One_Piece_Preview_zw00ax.webp' },
]

const COLLECTOR_SETUPS = [
  {
    id: 'figure-shelf',
    title: 'Anime Figure Shelf',
    desc: 'Curate your ultimate collector display',
    image: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1773779819/IMG_0253_zuyxao.webp',
  },
  {
    id: 'manga-corner',
    title: 'Cozy Manga Corner',
    desc: 'The perfect reading nook aesthetic',
    image: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1773779817/20260109_222013_th2vit.webp',
  },
  {
    id: 'gaming-setup',
    title: 'Ultimate Gaming Setup',
    desc: 'RGB meets anime culture',
    image: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1773779817/IMG_0322_sxcr9k.webp',
  },
]

// ── Skeleton Components ────────────────────────────────────────────────────

const ProductCardSkeleton = () => (
  <div className="overflow-hidden rounded-lg border border-border bg-card/80">
    <div className="animate-pulse bg-muted" style={{ aspectRatio: '4/3' }} />
    <div className="p-2 space-y-1.5">
      <div className="h-2 w-2/3 rounded bg-muted animate-pulse" />
      <div className="h-2.5 w-full rounded bg-muted animate-pulse" />
      <div className="h-2.5 w-1/3 rounded bg-muted/70 animate-pulse" />
    </div>
  </div>
)

const LimitedDropSkeleton = () => (
  <div className="overflow-hidden rounded-xl border border-border bg-card/80">
    <div className="animate-pulse bg-muted" style={{ aspectRatio: '4/3' }} />
    <div className="space-y-1.5 p-2.5">
      <div className="h-2.5 w-full rounded bg-muted animate-pulse" />
      <div className="h-2.5 w-1/3 rounded bg-muted/70 animate-pulse" />
      <div className="h-1.5 w-full rounded-full bg-muted animate-pulse mt-1" />
    </div>
  </div>
)

// ── Main Component ─────────────────────────────────────────────────────────

const HomepageClient = () => {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [trendingProducts, setTrendingProducts] = useState([])
  const [limitedDrops, setLimitedDrops] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(true)

  const heroSlides = [
    {
      title: 'Build your ultimate anime sanctuary.',
      subtitle: '🎊 New drop: Spring 2025 Collection',
      description:
        'Plushes, tees, and figures from iconic series—curated for otaku shelves, gaming setups, and cozy midnight binges.',
      image: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1773777432/20260109_040915_jvvqja.jpg',
      cta: 'Shop all products',
      cta2: 'Browse all categories',
    },
    {
      title: 'Premium figures for collectors.',
      subtitle: '✨ Limited edition drops',
      description:
        'High-quality action figures with stunning details and dynamic poses. From premium to sustainable collectibles.',
      image: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1773777239/20260109_030452_c7k9vc.webp',
      cta: 'Explore figures',
      cta2: null,
    },
  ]

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, prodRes, dropsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products?limit=4&sort=popularity'),
          fetch('/api/products?limit=4&sort=new'),
        ])
        if (catRes.ok) {
          const catData = await catRes.json()
          setCategories(Array.isArray(catData) ? catData : [])
        }
        if (prodRes.ok) {
          const prodData = await prodRes.json()
          setTrendingProducts(prodData?.items || [])
        }
        if (dropsRes.ok) {
          const dropsData = await dropsRes.json()
          setLimitedDrops(dropsData?.items || [])
        }
      } catch (e) {
        console.error('Failed to load homepage data', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [heroSlides.length])

  const slide = heroSlides[currentSlide]

  return (
    <AppShell>
      <div className="space-y-12">

        {/* ── HERO + CATEGORIES ─────────────────────────────────────────── */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Hero card - Bright and Vibrant */}
          <div className="group relative overflow-hidden rounded-2xl border border-border bg-black">
            <Image
              key={slide.image}
              src={slide.image}
              alt="Dracnoir anime merch hero"
              fill
              priority
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105 saturate-[1.1] contrast-[1.05]"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            
            {/* Minimal Scrim: Only darkens slightly where text sits to maintain vibrancy */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            
            <div className="relative z-10 flex min-h-[400px] flex-col justify-between p-6">
              <div className="drop-shadow-md">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">
                  {slide.subtitle}
                </p>
                <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
                  {slide.title}
                </h1>
                <p className="mt-4 max-w-[90%] text-sm font-medium leading-relaxed text-white/90">
                  {slide.description}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  className="rounded-full bg-violet-600 px-6 text-sm font-semibold text-white shadow-xl hover:bg-violet-500"
                  onClick={() => router.push('/products')}
                >
                  {slide.cta} <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
                {slide.cta2 && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full border-white/20 bg-white/10 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20"
                    onClick={() => router.push('/category/plushes')}
                  >
                    {slide.cta2}
                  </Button>
                )}
              </div>

              <div className="mt-4 flex items-center gap-3 text-[11px] font-bold text-white/80">
                <span className="flex items-center gap-1 drop-shadow-sm">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  4.9 / 5.0 • 2K+ reviews
                </span>
                <span>•</span>
                <span className="drop-shadow-sm">Free shipping over ₹80</span>
              </div>
            </div>

            {/* Navigation Arrows */}
            {heroSlides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
                  }
                  className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/10 bg-black/20 p-2 text-white hover:bg-black/40 backdrop-blur-sm transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
                  className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/10 bg-black/20 p-2 text-white hover:bg-black/40 backdrop-blur-sm transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-4 right-4 z-20 flex gap-1">
                  {heroSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-1.5 w-6 rounded-full transition-all ${
                        currentSlide === idx ? 'bg-violet-400' : 'bg-white/20 hover:bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Categories Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-violet-500/80">Categories</p>
              <button
                className="text-[11px] text-violet-500 hover:text-violet-400"
                onClick={() => router.push('/products')}
              >
                Tap a tile to dive in
              </button>
            </div>
            <p className="text-xl font-semibold tracking-tight md:text-2xl">Shop by category</p>
            <div className="grid gap-3">
              {categories.map((cat) => {
                const catMeta = {
                  plushes: {
                    desc: 'Super-soft chibi plushies from your favorite series.',
                    tags: 'Curated picks • Limited drops',
                    color: 'violet',
                    gradient: 'from-violet-500/20 to-purple-500/20',
                    border: 'border-violet-500/30',
                    textColor: 'text-violet-700 dark:text-violet-100',
                    hoverBorder: 'hover:border-violet-400',
                  },
                  't-shirts': {
                    desc: 'Oversized and regular fits with bold anime prints.',
                    tags: 'Curated picks • Limited drops',
                    color: 'emerald',
                    gradient: 'from-emerald-500/20 to-teal-500/20',
                    border: 'border-emerald-500/30',
                    textColor: 'text-emerald-700 dark:text-emerald-100',
                    hoverBorder: 'hover:border-emerald-400',
                  },
                  'action-figures': {
                    desc: 'Dynamic premium and sustainable figures for your shelf.',
                    tags: 'Curated picks • Limited drops',
                    color: 'amber',
                    gradient: 'from-amber-500/20 to-orange-500/20',
                    border: 'border-amber-500/30',
                    textColor: 'text-amber-700 dark:text-amber-100',
                    hoverBorder: 'hover:border-amber-400',
                  },
                }[cat.slug] || {
                  desc: '',
                  tags: '',
                  gradient: 'from-muted to-muted/60',
                  border: 'border-border',
                  textColor: 'text-foreground',
                  hoverBorder: 'hover:border-border/80',
                }

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => router.push(`/category/${cat.slug}`)}
                    className={`group relative overflow-hidden rounded-xl border ${catMeta.border} bg-gradient-to-br ${catMeta.gradient} backdrop-blur-xl p-4 text-left transition-all ${catMeta.hoverBorder} hover:shadow-lg`}
                  >
                    <div className="relative flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-semibold ${catMeta.textColor}`}>{cat.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{catMeta.desc}</p>
                        <p className="mt-2 text-[10px] text-muted-foreground/60">{catMeta.tags}</p>
                      </div>
                      <Button
                        size="sm"
                        className={`rounded-full ${
                          catMeta.color === 'violet'
                            ? 'bg-violet-500 hover:bg-violet-400'
                            : catMeta.color === 'emerald'
                            ? 'bg-emerald-500 hover:bg-emerald-400'
                            : 'bg-amber-500 hover:bg-amber-400'
                        } text-[11px] text-white`}
                      >
                        Explore
                      </Button>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── SHOP BY UNIVERSE ──────────────────────────────────────────── */}
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-500/80">Explore</p>
            <p className="text-xl font-semibold tracking-tight md:text-2xl">Shop by Universe</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {UNIVERSES.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => router.push(`/anime/${u.slug}`)}
                className="group relative overflow-hidden rounded-xl border border-border bg-card"
                style={{ aspectRatio: '3/4' }}
              >
                <Image
                  src={u.image}
                  alt={u.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <p className="text-center text-[11px] font-semibold leading-tight text-white drop-shadow">
                    {u.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── TRENDING PRODUCTS ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-violet-500/80">Featured</p>
              <p className="text-xl font-semibold tracking-tight md:text-2xl">Trending right now</p>
            </div>
            <button
              className="text-xs text-violet-500 hover:text-violet-400"
              onClick={() => router.push('/products')}
            >
              View all
            </button>
          </div>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : trendingProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => router.push(`/product/${product.slug}`)}
                    className="group overflow-hidden rounded-lg border border-border bg-card/80 text-left transition-colors hover:border-violet-400 hover:bg-card"
                  >
                    <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: '4/3' }}>
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-muted" />
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-[10px] text-muted-foreground truncate">{product.series}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-foreground truncate group-hover:text-violet-500">
                        {product.title}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-violet-500">
                        ₹{product.price?.toFixed?.(0) ?? '0'}
                      </p>
                    </div>
                  </button>
                ))}
          </div>
        </div>

        {/* ── LIMITED DROPS ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-red-500/80">Scarcity</p>
              <p className="text-xl font-semibold tracking-tight md:text-2xl">🔥 Limited Drops</p>
            </div>
            <button
              className="text-xs text-violet-500 hover:text-violet-400"
              onClick={() => router.push('/products')}
            >
              View all
            </button>
          </div>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <LimitedDropSkeleton key={i} />)
              : limitedDrops.map((product) => {
                  const stockLeft = product.stock ?? 15
                  const stockPct = Math.min(100, Math.max(5, (stockLeft / 50) * 100))
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => router.push(`/product/${product.slug}`)}
                      className="group overflow-hidden rounded-xl border border-border bg-card/80 text-left transition-colors hover:border-red-500/50 hover:bg-card"
                    >
                      <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: '4/3' }}>
                        {product.images?.[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-muted" />
                        )}
                        <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                          LIMITED
                        </span>
                      </div>
                      <div className="space-y-1.5 p-2.5">
                        <p className="truncate text-[11px] font-medium text-foreground group-hover:text-red-500">
                          {product.title}
                        </p>
                        <p className="text-[11px] font-semibold text-violet-500">
                          ₹{product.price?.toFixed?.(0) ?? '0'}
                        </p>
                        <div className="space-y-0.5">
                          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-red-500 to-amber-400"
                              style={{ width: `${stockPct}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground">Only {stockLeft} left</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
          </div>
        </div>

        {/* ── COLLECTOR SETUP INSPIRATION ───────────────────────────────── */}
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-500/80">Inspiration</p>
            <p className="text-xl font-semibold tracking-tight md:text-2xl">Build Your Otaku Setup</p>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {COLLECTOR_SETUPS.map((setup) => (
              <button
                key={setup.id}
                type="button"
                onClick={() => router.push('/products')}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card text-left"
                style={{ aspectRatio: '4/3' }}
              >
                <Image
                  src={setup.image}
                  alt={setup.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-sm font-bold text-white">{setup.title}</p>
                  <p className="mt-0.5 text-xs text-white/70">{setup.desc}</p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-violet-500/80 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm group-hover:bg-violet-500">
                    Shop the setup <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  )
}

export default HomepageClient
