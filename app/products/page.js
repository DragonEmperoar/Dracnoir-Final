'use client'

import { useEffect, useState, useMemo } from 'react'
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
  'Naruto',
  'One Piece',
  'Jujutsu Kaisen',
  'Chainsaw Man',
  'My Hero Academia',
  'Attack on Titan',
  'Demon Slayer',
  'Fullmetal Alchemist',
  'Spy x Family',
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
  if (filters.series) params.set('series', filters.series)
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice))
  if (filters.sort) params.set('sort', filters.sort)
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

const AllProductsPage = () => {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('q') || '',
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
  }, [filters.search, filters.series, filters.sort, filters.minPrice, filters.maxPrice])

  const updateUrl = (nextFilters) => {
    const params = new URLSearchParams()
    if (nextFilters.search) params.set('q', nextFilters.search)
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

  const handleProductClick = (product) => {
    router.push(`/product/${product.slug}`)
  }

  return (
    <AppShell>
      <div className="space-y-10">
        <section className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80">Dracnoir</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
            All products
          </h1>
          <p className="max-w-xl text-sm text-slate-300">
            Browse the entire hoard of plushes, tees, and figures. Filter by series, price, and more.
          </p>
        </section>

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
                onChange={(e) => handleFilterChange({ search: e.target.value })}
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
                  onChange={(e) => handleFilterChange({ minPrice: e.target.value })}
                  className="h-9 w-full border-slate-700 bg-slate-900/80 text-xs"
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange({ maxPrice: e.target.value })}
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
      </div>
    </AppShell>
  )
}

export default AllProductsPage
