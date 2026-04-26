'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft, Star } from 'lucide-react'
import AppShell from './AppShell'

// ── Static data ─────────────────────────────────────────

const UNIVERSES = [
  { id: 'naruto', name: 'Naruto', slug: 'naruto', image: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1775379361/Naruto_Preview_a4e9jv.webp' },
  { id: 'jujutsu-kaisen', name: 'Jujutsu Kaisen', slug: 'jujutsu-kaisen', image: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1775379424/Jujutsu_Kaisen_Preview_rxrla4.webp' },
  { id: 'attack-on-titan', name: 'Attack on Titan', slug: 'attack-on-titan', image: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1773779309/download_4_cuu1u7.webp' },
  { id: 'demon-slayer', name: 'Demon Slayer', slug: 'demon-slayer', image: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1775379477/Demon_Slayer_Preview_znizer.webp' },
  { id: 'dragon-ball', name: 'Dragon Ball', slug: 'dragon-ball', image: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1775379423/Dragon_Ball_Preview_p4hkfo.webp' },
  { id: 'one-piece', name: 'One Piece', slug: 'one-piece', image: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1775379365/One_Piece_Preview_zw00ax.webp' },
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

// ── Skeletons ─────────────────────────────────────────

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

// ── Main Component ─────────────────────────────────────

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
      description: 'Plushes, tees, and figures from iconic series—curated for otaku shelves, gaming setups, and cozy midnight binges.',
      image: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1773777432/20260109_040915_jvvqja.jpg',
      cta: 'Shop all products',
      cta2: 'Browse all categories',
    },
    {
      title: 'Premium figures for collectors.',
      subtitle: '✨ Limited edition drops',
      description: 'High-quality action figures with stunning details and dynamic poses.',
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

        if (catRes.ok) setCategories(await catRes.json())
        if (prodRes.ok) setTrendingProducts((await prodRes.json())?.items || [])
        if (dropsRes.ok) setLimitedDrops((await dropsRes.json())?.items || [])
      } catch (e) {
        console.error(e)
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

        {/* HERO */}
        <div className="group relative overflow-hidden rounded-2xl border border-border bg-black">
          <Image
            src={slide.image}
            alt="hero"
            fill
            priority
            className="object-cover transition-transform duration-700 group-hover:scale-105 saturate-[1.1] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          <div className="relative z-10 p-6 text-white">
            <h1 className="text-3xl font-bold">{slide.title}</h1>
            <p className="mt-2">{slide.description}</p>

            <Button className="mt-4 bg-violet-600 shadow-xl">
              {slide.cta}
            </Button>
          </div>
        </div>

        {/* TRENDING */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : trendingProducts.map((product) => (
                <div key={product.id} className="border rounded-lg overflow-hidden">
                  <div className="relative" style={{ aspectRatio: '4/3' }}>
                    <Image
                      src={product.images?.[0]}
                      alt={product.title}
                      fill
                      className={`object-cover ${
                        product.stock === 0 ? 'blur-[2px] brightness-75' : ''
                      }`}
                    />

                    {product.stock === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-black text-white px-2 py-1 text-xs">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-2 text-sm">{product.title}</div>
                </div>
              ))}
        </div>

        {/* LIMITED DROPS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <LimitedDropSkeleton key={i} />)
            : limitedDrops.map((product) => {
                const stockLeft = product.stock ?? 15
                const stockPct = Math.min(100, Math.max(5, (stockLeft / 50) * 100))

                return (
                  <div key={product.id} className="border rounded-lg overflow-hidden">
                    <div className="relative" style={{ aspectRatio: '4/3' }}>
                      <Image
                        src={product.images?.[0]}
                        alt={product.title}
                        fill
                        className={`object-cover ${
                          stockLeft === 0 ? 'blur-[2px] brightness-75' : ''
                        }`}
                      />

                      {stockLeft === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-black text-white px-2 py-1 text-xs">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-2">
                      <p className="text-sm">{product.title}</p>

                      <div className="h-1 bg-gray-200 mt-2">
                        <div
                          className="h-full bg-red-500"
                          style={{ width: `${stockPct}%` }}
                        />
                      </div>

                      <p className="text-xs mt-1">
                        Only {stockLeft} left
                      </p>
                    </div>
                  </div>
                )
              })}
        </div>

      </div>
    </AppShell>
  )
}

export default HomepageClient
