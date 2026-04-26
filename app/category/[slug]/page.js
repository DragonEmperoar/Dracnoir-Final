'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Star, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import AppShell from '../../AppShell'

const ANIME_SERIES = [
  'Naruto', 'One Piece', 'Jujutsu Kaisen', 'Chainsaw Man', 'My Hero Academia',
  'Attack on Titan', 'Demon Slayer', 'Fullmetal Alchemist', 'Spy x Family',
  'Haikyuu!!', 'Tokyo Revengers', 'Bleach', 'Dragon Ball Z', 'Sailor Moon',
  'Neon Genesis Evangelion', 'Mob Psycho 100', 'Re:Zero', 'Gintama', 'Black Clover', 'Fate/Stay Night',
]

const CATEGORY_META = {
  'plushes': { title: 'Plushes', tagline: 'Hug-level over 9000. Chibi, squishy, and shelf-approved.' },
  't-shirts': { title: 'T-Shirts', tagline: 'Oversized and regular fits for your next con or couch binge.' },
  'action-figures': { title: 'Action Figures', tagline: 'Dynamic poses, premium sculpts, and sustainable favorites.' },
}

const sortOptions = [
  { value: 'popularity', label: 'Most popular' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
]

function buildQueryString(base, filters, page) {
  const params = new URLSearchParams()
  if (base) params.set('categorySlug', base)
  params.set('limit', '200')
  if (filters.search) params.set('search', filters.search)
  if (filters.series) params.set('series', filters.series)
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice))
  if (filters.sort) params.set('sort', filters.sort)
  if (filters.subcategory) params.set('subcategory', filters.subcategory)
  if (page) params.set('page', String(page))
  return params.toString()
}

function ProductCard({ product, onClick }) {
  const soldOut = product.stock === 0
  return (
    <Card
      className="group flex cursor-pointer flex-col overflow-hidden border border-border bg-card transition-colors hover:border-violet-500/60"
      onClick={onClick}
    >
      <div className="relative w-full overflow-hidden bg-muted" style={{ aspectRatio: '4/3' }}>
        {product.images?.[0] && (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${soldOut ? 'blur-[2px] brightness-75' : ''}`}
          />
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-black/70 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
              Sold Out
            </span>
          </div>
        )}
      </div>
      <CardContent className="flex flex-1 flex-col justify-between space-y-1 p-3">
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-wide text-violet-500">
            {product.type === 'tshirt' ? 'T-Shirt' : product.type === 'plush' ? 'Plush' : 'Figure'}
          </p>
          {product.series && <p className="text-[10px] text-muted-foreground truncate">{product.series}</p>}
          <h3 className="line-clamp-1 text-xs font-semibold text-foreground">{product.title}</h3>
        </div>
        <div className="flex items-center justify-between pt-1 text-xs">
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="h-2.5 w-2.5" />
            <span className="text-[11px]">{product.rating?.toFixed?.(1) || '4.8'}</span>
          </div>
          <div className="text-xs font-semibold text-foreground">₹{product.price?.toFixed?.(0) ?? '0'}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function CategoryPage() {
  const params = useParams()
  const rawSlug = params?.slug
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug
  const searchParams = useSearchParams()
  const router = useRouter()

  const meta = CATEGORY_META[slug] || { title: 'Collection', tagline: 'Explore hand-picked anime merch.' }

  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('q') || '',
    series: searchParams.get('series') || '',
    sort: searchParams.get('sort') || 'popularity',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    subcategory: searchParams.get('subcategory') || '',
  }))
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef(null)
  const loadingRef = useRef(false)
  const pageRef = useRef(1)
  const hasMoreRef = useRef(true)

  const isFigures = slug === 'action-figures'
  const selectedSeriesOptions = useMemo(() => ANIME_SERIES, [])

  const fetchPage = useCallback(async (targetPage, opts = { append: false }) => {
    if (!slug) return
    if (slug === 'action-figures' && !filters.subcategory) {
      setProducts([]); setHasMore(false); hasMoreRef.current = false; setPage(1); pageRef.current = 1; return
    }
    if (loadingRef.current && opts.append) return
    loadingRef.current = true
    setLoading(true)
    try {
      const qs = buildQueryString(slug, filters, targetPage)
      const res = await fetch(`/api/products?${qs}`)
      const data = await res.json()
      const more = targetPage < (data?.totalPages || 1)
      setHasMore(more)
      hasMoreRef.current = more
      setPage(targetPage)
      pageRef.current = targetPage
      setProducts((prev) => {
        if (opts.append && targetPage > 1) {
          const existingIds = new Set(prev.map(p => p.id))
          const fresh = (data?.items || []).filter(p => !existingIds.has(p.id))
          return [...prev, ...fresh]
        }
        return data?.items || []
      })
    } catch (e) { console.error('Failed to load products', e) }
    finally { loadingRef.current = false; setLoading(false) }
  }, [slug, filters])

  // Reset and reload when filters change
  useEffect(() => {
    pageRef.current = 1
    hasMoreRef.current = true
    loadingRef.current = false
    fetchPage(1, { append: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, filters.search, filters.series, filters.sort, filters.minPrice, filters.maxPrice, filters.subcategory])

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
          fetchPage(pageRef.current + 1, { append: true })
        }
      },
      { rootMargin: '300px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchPage])

  const handleFilterChange = (patch) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch }
      const params = new URLSearchParams()
      if (next.search) params.set('q', next.search)
      if (next.series) params.set('series', next.series)
      if (next.minPrice) params.set('minPrice', String(next.minPrice))
      if (next.maxPrice) params.set('maxPrice', String(next.maxPrice))
      if (next.sort && next.sort !== 'popularity') params.set('sort', next.sort)
      if (next.subcategory) params.set('subcategory', next.subcategory)
      const qs = params.toString()
      router.replace(qs ? `/category/${slug}?${qs}` : `/category/${slug}`)
      return next
    })
  }

  return (
    <AppShell>
      <div className="space-y-10">
        <section className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-violet-500/80">Category</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{meta.title}</h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">{meta.tagline}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="rounded-full border border-border bg-card/70 px-3 py-1 text-muted-foreground">
                Curated drop • Live inventory
              </div>
              <div className="rounded-full border border-violet-700/60 bg-violet-500/10 px-3 py-1 text-violet-500">
                {slug === 'action-figures' ? 'Premium & sustainable figures' : 'Soft, wearable, displayable'}
              </div>
            </div>
          </div>

          {isFigures && (
            <div className="grid gap-4 md:grid-cols-[minmax(0,_1.4fr)_minmax(0,_1fr)]">
              <Card className="relative overflow-hidden border border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-card to-card">
                <CardContent className="flex flex-col justify-between gap-4 p-5 sm:p-6 md:flex-row md:items-center">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">Premium figures</p>
                    <h2 className="text-lg font-semibold sm:text-xl">Museum-grade sculpts for your top shelf.</h2>
                    <p className="text-sm text-muted-foreground">High-detail PVC, dynamic poses, and FX parts that pop under RGB. For collectors who want their centerpiece to glow.</p>
                    <Button
                      size="sm"
                      className="mt-1 rounded-full bg-emerald-500 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                      onClick={() => handleFilterChange({ subcategory: 'premium' })}
                    >
                      Browse premium figures
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-col items-end gap-2 text-right text-xs text-emerald-600 dark:text-emerald-200 md:mt-0">
                    <span>Limited runs • Numbered batches</span>
                    <span>Hand-painted details</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-emerald-500/25 bg-card">
                <CardContent className="flex h-full flex-col justify-between gap-3 p-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">Sustainable figures</p>
                    <h3 className="text-sm font-semibold">Lower footprint, same shelf flex.</h3>
                    <p className="text-xs text-muted-foreground">Bio-based materials, minimal packaging, and designs that still look fire on your desk setup.</p>
                  </div>
                  <Button
                    variant="outline" size="sm"
                    className="mt-1 w-fit rounded-full border-emerald-500/60 text-[11px] text-emerald-600 dark:text-emerald-200 hover:bg-emerald-500/10"
                    onClick={() => handleFilterChange({ subcategory: 'sustainable' })}
                  >
                    View sustainable picks
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        {(slug !== 'action-figures' || filters.subcategory) && (
          <section className="grid gap-8 md:grid-cols-[minmax(0,_1.1fr)_minmax(0,_2.2fr)]">
            {/* Filters */}
            <aside className="space-y-5 rounded-2xl border border-border bg-card/80 p-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Filters</p>
                <Input
                  placeholder="Search by name or series"
                  value={filters.search}
                  onChange={(e) => handleFilterChange({ search: e.target.value })}
                  className="h-9 border-border bg-background text-sm placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground/80">Anime series</p>
                <Select value={filters.series || 'all'} onValueChange={(value) => handleFilterChange({ series: value === 'all' ? '' : value })}>
                  <SelectTrigger className="h-9 border-border bg-background text-xs"><SelectValue placeholder="All series" /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="all">All series</SelectItem>
                    {selectedSeriesOptions.map((name) => (<SelectItem key={name} value={name}>{name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground/80">Price range (₹)</p>
                <div className="flex gap-2 text-xs">
                  <Input type="number" inputMode="decimal" placeholder="Min" value={filters.minPrice} onChange={(e) => handleFilterChange({ minPrice: e.target.value })} className="h-9 w-full border-border bg-background text-xs" />
                  <Input type="number" inputMode="decimal" placeholder="Max" value={filters.maxPrice} onChange={(e) => handleFilterChange({ maxPrice: e.target.value })} className="h-9 w-full border-border bg-background text-xs" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground/80">Sort by</p>
                <Select value={filters.sort} onValueChange={(value) => handleFilterChange({ sort: value })}>
                  <SelectTrigger className="h-9 border-border bg-background text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </aside>

            {/* Products grid + infinite scroll */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {products.length > 0
                    ? `Showing ${products.length} item${products.length !== 1 ? 's' : ''}`
                    : loading ? 'Loading drops...' : 'No items match these filters yet.'}
                </span>
              </div>

              <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} onClick={() => router.push(`/product/${product.slug}`)} />
                ))}
              </div>

              {/* Sentinel element — IntersectionObserver watches this */}
              <div ref={sentinelRef} className="h-4 w-full" />

              {/* Loading indicator */}
              {loading && (
                <div className="flex justify-center py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                </div>
              )}

              {/* End of results */}
              {!hasMore && products.length > 0 && (
                <p className="text-center text-xs text-muted-foreground py-2">All {products.length} items loaded</p>
              )}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  )
}

export default CategoryPage
