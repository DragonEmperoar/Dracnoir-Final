'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Star, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ANIME_SERIES = [
  'Naruto',
  'One Piece',
  'Jujutsu Kaisen',
  'Chainsaw Man',
  'My Hero Academia',
  'Attack on Titan',
  'Demon Slayer',
  'Fullmetal Alchemist',
  'Spy x Family',
  'Haikyuu!!',
  'Tokyo Revengers',
  'Bleach',
  'Dragon Ball Z',
  'Sailor Moon',
  'Neon Genesis Evangelion',
  'Mob Psycho 100',
  'Re:Zero',
  'Gintama',
  'Black Clover',
  'Fate/Stay Night',
]

const CATEGORY_META = {
  'plushes': {
    title: 'Plushes',
    tagline: 'Hug-level over 9000. Chibi, squishy, and shelf-approved.',
  },
  't-shirts': {
    title: 'T-Shirts',
    tagline: 'Oversized and regular fits for your next con or couch binge.',
  },
  'action-figures': {
    title: 'Action Figures',
    tagline: 'Dynamic poses, premium sculpts, and sustainable favorites.',
  },
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
  return (
    <Card
      className="group flex cursor-pointer flex-col overflow-hidden border border-slate-800 bg-slate-950/80 transition-colors hover:border-violet-500/60"
      onClick={onClick}
    >
      <div className="relative h-40 w-full overflow-hidden bg-slate-900">
        {product.images?.[0] && (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <CardContent className="flex flex-1 flex-col justify-between space-y-2 p-4">
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
          <p className="line-clamp-2 text-xs text-slate-400">
            {product.description}
          </p>
        </div>
        <div className="flex items-center justify-between pt-2 text-xs">
          <div className="flex items-center gap-1 text-amber-300">
            <Star className="h-3 w-3" />
            <span>{product.rating?.toFixed?.(1) || '4.8'}</span>
            <span className="text-slate-500">({product.reviewCount || 0})</span>
          </div>
          <div className="text-sm font-semibold text-slate-50">
            ${product.price?.toFixed?.(2) ?? '0.00'}
          </div>
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

  const meta = CATEGORY_META[slug] || {
    title: 'Collection',
    tagline: 'Explore hand-picked anime merch.',
  }

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

  const isFigures = slug === 'action-figures'

  const selectedSeriesOptions = useMemo(() => {
    return ANIME_SERIES
  }, [])

  const fetchPage = async (targetPage, opts = { append: false }) => {
    if (!slug) return
    if (slug === 'action-figures' && !filters.subcategory) {
      // Require a subcategory selection (premium / sustainable) before loading
      setProducts([])
      setHasMore(false)
      setPage(1)
      return
    }
    setLoading(true)
    try {
      const qs = buildQueryString(slug, filters, targetPage)
      const res = await fetch(`/api/products?${qs}`)
      const data = await res.json()
      setHasMore(targetPage < (data?.totalPages || 1))
      setPage(targetPage)
      setProducts((prev) =>
        opts.append && targetPage > 1 ? [...prev, ...(data?.items || [])] : data?.items || [],
      )
    } catch (e) {
      console.error('Failed to load products', e)
    } finally {
      setLoading(false)
    }
  }

  // Initial & filter-driven fetch
  useEffect(() => {
    fetchPage(1, { append: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, filters.search, filters.series, filters.sort, filters.minPrice, filters.maxPrice, filters.subcategory])

  const updateUrl = (nextFilters) => {
    const params = new URLSearchParams()
    if (nextFilters.search) params.set('q', nextFilters.search)
    if (nextFilters.series) params.set('series', nextFilters.series)
    if (nextFilters.minPrice) params.set('minPrice', String(nextFilters.minPrice))
    if (nextFilters.maxPrice) params.set('maxPrice', String(nextFilters.maxPrice))
    if (nextFilters.sort && nextFilters.sort !== 'popularity')
      params.set('sort', nextFilters.sort)
    if (nextFilters.subcategory) params.set('subcategory', nextFilters.subcategory)

    const qs = params.toString()
    router.replace(qs ? `/category/${slug}?${qs}` : `/category/${slug}`)
  }

  const handleFilterChange = (patch) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch }
      updateUrl(next)
      return next
    })
  }

  const handleLoadMore = () => {
    if (!hasMore || loading) return
    fetchPage(page + 1, { append: true })
  }

  const handleProductClick = (product) => {
    router.push(`/product/${product.slug}`)
  }

  return (
    <AppShell>
      <div className="space-y-10">
        <section className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80">
                Category
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
                {meta.title}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-300">{meta.tagline}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-300">
              <div className="rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1">
                Curated drop • Live inventory
              </div>
              <div className="rounded-full border border-violet-700/60 bg-violet-500/10 px-3 py-1 text-violet-200">
                {slug === 'action-figures' ? 'Premium & sustainable figures' : 'Soft, wearable, displayable'}
              </div>
            </div>
          </div>

          {isFigures && (
            <div className="grid gap-4 md:grid-cols-[minmax(0,_1.4fr)_minmax(0,_1fr)]">
              <Card className="relative overflow-hidden border border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-slate-950">
                <CardContent className="flex flex-col justify-between gap-4 p-5 sm:p-6 md:flex-row md:items-center">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/80">
                      Premium figures
                    </p>
                    <h2 className="text-lg font-semibold text-slate-50 sm:text-xl">
                      Museum-grade sculpts for your top shelf.
                    </h2>
                    <p className="text-sm text-slate-200/90">
                      High-detail PVC, dynamic poses, and FX parts that pop under RGB. For collectors who want their centerpiece to glow.
                    </p>
                    <Button
                      size="sm"
                      className="mt-1 rounded-full bg-emerald-500 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                      onClick={() => router.push('/products?subcategory=premium')}
                    >
                      Browse premium figures
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-col items-end gap-2 text-right text-xs text-emerald-200/90 md:mt-0">
                    <span>Limited runs • Numbered batches</span>
                    <span>Hand-painted details</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-emerald-500/25 bg-slate-950/80">
                <CardContent className="flex h-full flex-col justify-between gap-3 p-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-300/80">
                      Sustainable figures
                    </p>
                    <h3 className="text-sm font-semibold text-slate-50">
                      Lower footprint, same shelf flex.
                    </h3>
                    <p className="text-xs text-slate-300">
                      Bio-based materials, minimal packaging, and designs that still look fire on your desk setup.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1 w-fit rounded-full border-emerald-500/60 bg-transparent text-[11px] text-emerald-200 hover:bg-emerald-500/10"
                    onClick={() => router.push('/products?subcategory=sustainable')}
                  >
                    View sustainable picks
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        {/* Only show filters + grid for non-figure categories */}
        {slug !== 'action-figures' && (
          <section className="grid gap-8 md:grid-cols-[minmax(0,_1.1fr)_minmax(0,_2.2fr)]">
            {/* Filters */}
            <aside className="space-y-5 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                  Filters
                </p>
                <Input
                  placeholder="Search by name or series"
                  value={filters.search}
                  onChange={(e) =>
                    handleFilterChange({ search: e.target.value })
                  }
                  className="h-9 border-slate-700 bg-slate-900/80 text-sm placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-300">Anime series</p>
                <Select
                  value={filters.series || 'all'}
                  onValueChange={(value) =>
                    handleFilterChange({ series: value === 'all' ? '' : value })
                  }
                >
                  <SelectTrigger className="h-9 border-slate-700 bg-slate-900/80 text-xs text-slate-200">
                    <SelectValue placeholder="All series" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 border-slate-800 bg-slate-900 text-xs text-slate-100">
                    <SelectItem value="all">All series</SelectItem>
                    {selectedSeriesOptions.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-300">Price range ($)</p>
                <div className="flex gap-2 text-xs">
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) =>
                      handleFilterChange({ minPrice: e.target.value })
                    }
                    className="h-9 w-full border-slate-700 bg-slate-900/80 text-xs"
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      handleFilterChange({ maxPrice: e.target.value })
                    }
                    className="h-9 w-full border-slate-700 bg-slate-900/80 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-300">Sort by</p>
                <Select
                  value={filters.sort}
                  onValueChange={(value) => handleFilterChange({ sort: value })}
                >
                  <SelectTrigger className="h-9 border-slate-700 bg-slate-900/80 text-xs text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-800 bg-slate-900 text-xs text-slate-100">
                    {sortOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </aside>

            {/* Products grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  {products.length > 0
                    ? `Showing ${products.length} item${products.length !== 1 ? 's' : ''}`
                    : loading
                    ? 'Loading drops...'
                    : 'No items match these filters yet.'}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => handleProductClick(product)}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    onClick={handleLoadMore}
                    className="rounded-full border-slate-700 bg-slate-900/80 text-xs text-slate-100 hover:bg-slate-800"
                  >
                    {loading ? 'Loading more...' : 'Load more'}
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  )
}

export default CategoryPage
