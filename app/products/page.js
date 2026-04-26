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
      <div className="relative w-full overflow-hidden bg-muted" style={{ aspectRatio: product.aspectRatio || '4/3' }}>
        {product.images?.[0] && (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
              soldOut ? 'blur-[2px] brightness-75' : ''
            }`}
            style={{ objectPosition: product.imagePositions?.[0] || product.imagePosition || 'center' }}
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
  const [loading, setLoading] = useState(false)

  const selectedSeriesOptions = useMemo(() => ANIME_SERIES, [])

  const fetchPage = async (opts = {}) => {
    setLoading(true)
    try {
      const qs = buildQueryString(filters, 1)
      const res = await fetch(`/api/products?${qs}&limit=1000`)
      const data = await res.json()
      setProducts(data?.items || [])
    } catch (e) {
      console.error('Failed to load products', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPage()
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

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-violet-500/80">Dracnoir</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">All products</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Browse plushes, tees, and figures. Filter by series, price, and more.
        </p>
      </section>

      {/* ── Compact filter bar ── */}
      <div className="flex flex-wrap gap-2 items-end">
        <Input
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
          className="h-8 w-36 border-border bg-background text-xs placeholder:text-muted-foreground"
        />

        <Select value={filters.type || 'all'} onValueChange={(v) => handleFilterChange({ type: v === 'all' ? '' : v })}>
          <SelectTrigger className="h-8 w-32 border-border bg-background text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="tshirt">T-Shirts</SelectItem>
            <SelectItem value="plush">Plushes</SelectItem>
            <SelectItem value="figure">Figures</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.series || 'all'} onValueChange={(v) => handleFilterChange({ series: v === 'all' ? '' : v })}>
          <SelectTrigger className="h-8 w-36 border-border bg-background text-xs"><SelectValue placeholder="Series" /></SelectTrigger>
          <SelectContent className="max-h-64">
            <SelectItem value="all">All series</SelectItem>
            {selectedSeriesOptions.map((name) => (<SelectItem key={name} value={name}>{name}</SelectItem>))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Input type="number" inputMode="decimal" placeholder="Min ₹"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange({ minPrice: e.target.value })}
            className="h-8 w-20 border-border bg-background text-xs"
          />
          <span className="text-muted-foreground text-xs">–</span>
          <Input type="number" inputMode="decimal" placeholder="Max ₹"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange({ maxPrice: e.target.value })}
            className="h-8 w-20 border-border bg-background text-xs"
          />
        </div>

        <Select value={filters.sort} onValueChange={(v) => handleFilterChange({ sort: v })}>
          <SelectTrigger className="h-8 w-36 border-border bg-background text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {sortOptions.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
          </SelectContent>
        </Select>

        {(filters.search || filters.type || filters.series || filters.minPrice || filters.maxPrice) && (
          <button
            onClick={() => handleFilterChange({ search: '', type: '', series: '', minPrice: '', maxPrice: '', sort: 'popularity' })}
            className="h-8 rounded-lg border border-border px-2.5 text-xs text-muted-foreground hover:text-foreground hover:border-red-400 transition-colors"
          >
            Clear
          </button>
        )}

        <span className="ml-auto text-xs text-muted-foreground self-center">
          {loading ? 'Loading…' : `${products.length} item${products.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* ── Products grid ── */}
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onClick={() => router.push(`/product/${product.slug}`)} />
        ))}
        {!loading && products.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-12">No items match these filters.</p>
        )}
      </div>
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
