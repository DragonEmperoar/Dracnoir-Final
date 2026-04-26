'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
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
import AppShell from '../AppShell'

const ANIME_SERIES = [
  'Naruto', 'One Piece', 'Jujutsu Kaisen', 'Chainsaw Man', 'My Hero Academia',
  'Attack on Titan', 'Demon Slayer', 'Fullmetal Alchemist', 'Spy x Family',
]

const sortOptions = [
  { value: 'popularity', label: 'Most popular' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
]

function buildQueryString(filters, page) {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.type) params.set('type', filters.type)
  if (filters.series) params.set('series', filters.series)
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice))
  if (filters.sort) params.set('sort', filters.sort)
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
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
              soldOut ? 'blur-[2px] brightness-75' : ''
            }`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
          {product.series && (
            <p className="text-[10px] text-muted-foreground truncate">{product.series}</p>
          )}
          <h3 className="line-clamp-1 text-xs font-semibold text-foreground">
            {product.title}
          </h3>
        </div>
        <div className="flex items-center justify-between pt-1 text-xs">
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="h-2.5 w-2.5" />
            <span className="text-[11px]">{product.rating?.toFixed?.(1) || '4.8'}</span>
          </div>
          <div className="text-xs font-semibold text-foreground">
            {soldOut ? <span className="text-red-400">Sold Out</span> : `₹${product.price?.toFixed?.(0) ?? '0'}`}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const ProductsContent = () => {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('q') || '',
    type: searchParams.get('type') || '',
    series: searchParams.get('series') || '',
    sort: searchParams.get('sort') || 'popularity',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
  }))
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  const selectedSeriesOptions = useMemo(() => ANIME_SERIES, [])

  const fetchPage = async (targetPage, opts = { append: false }) => {
    setLoading(true)
    try {
      const qs = buildQueryString(filters, targetPage)
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

  useEffect(() => {
    fetchPage(1, { append: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.type, filters.series, filters.sort, filters.minPrice, filters.maxPrice])

  const updateUrl = (nextFilters) => {
    const params = new URLSearchParams()
    if (nextFilters.search) params.set('q', nextFilters.search)
    if (nextFilters.type) params.set('type', nextFilters.type)
    if (nextFilters.series) params.set('series', nextFilters.series)
    if (nextFilters.minPrice) params.set('minPrice', String(nextFilters.minPrice))
    if (nextFilters.maxPrice) params.set('maxPrice', String(nextFilters.maxPrice))
    if (nextFilters.sort && nextFilters.sort !== 'popularity')
      params.set('sort', nextFilters.sort)
    const qs = params.toString()
    router.replace(qs ? `/products?${qs}` : '/products')
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

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-violet-500/80">Dracnoir</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          All products
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Browse the entire hoard of plushes, tees, and figures. Filter by series, price, and more.
        </p>
      </section>

      <section className="grid gap-8 md:grid-cols-[minmax(0,_1.1fr)_minmax(0,_2.2fr)]">
        {/* Filters */}
        <aside className="space-y-5 rounded-2xl border border-border bg-card/80 p-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Filters
            </p>
            <Input
              placeholder="Search by name or series"
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              className="h-9 border-border bg-background text-sm placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground/80">Product type</p>
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) =>
                handleFilterChange({ type: value === 'all' ? '' : value })
              }
            >
              <SelectTrigger className="h-9 border-border bg-background text-xs">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="tshirt">T-Shirts</SelectItem>
                <SelectItem value="plush">Plushes</SelectItem>
                <SelectItem value="figure">Figures</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground/80">Anime series</p>
            <Select
              value={filters.series || 'all'}
              onValueChange={(value) =>
                handleFilterChange({ series: value === 'all' ? '' : value })
              }
            >
              <SelectTrigger className="h-9 border-border bg-background text-xs">
                <SelectValue placeholder="All series" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="all">All series</SelectItem>
                {selectedSeriesOptions.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground/80">Price range (₹)</p>
            <div className="flex gap-2 text-xs">
              <Input
                type="number" inputMode="decimal" placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange({ minPrice: e.target.value })}
                className="h-9 w-full border-border bg-background text-xs"
              />
              <Input
                type="number" inputMode="decimal" placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange({ maxPrice: e.target.value })}
                className="h-9 w-full border-border bg-background text-xs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground/80">Sort by</p>
            <Select
              value={filters.sort}
              onValueChange={(value) => handleFilterChange({ sort: value })}
            >
              <SelectTrigger className="h-9 border-border bg-background text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </aside>

        {/* Products grid */}
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
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => router.push(`/product/${product.slug}`)}
              />
            ))}
          </div>
          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline" size="sm" disabled={loading}
                onClick={handleLoadMore}
                className="rounded-full border-border text-xs hover:bg-muted"
              >
                {loading ? 'Loading more...' : 'Load more'}
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default function AllProductsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
        <ProductsContent />
      </Suspense>
    </AppShell>
  )
}
