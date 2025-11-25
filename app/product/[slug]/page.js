'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Star, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '../../context/AuthContext'

function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const rawSlug = params?.slug
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(0)

  const [selectedVariant, setSelectedVariant] = useState(null)
  const [adding, setAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [pincode, setPincode] = useState('')
  const [pincodeMessage, setPincodeMessage] = useState('')
  const [showSizeGuide, setShowSizeGuide] = useState(false)

  useEffect(() => {
    if (!slug) return
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const [pRes, rRes] = await Promise.all([
          fetch(`/api/products/${slug}`),
          fetch(`/api/products/${slug}/reviews`),
        ])
        if (!pRes.ok) {
          throw new Error('Product not found')
        }
        const pData = await pRes.json()
        const rData = rRes.ok ? await rRes.json() : []
        setProduct(pData)
        setReviews(Array.isArray(rData) ? rData : [])
        if (Array.isArray(pData?.variants) && pData.variants.length > 0) {
          setSelectedVariant(pData.variants[0])
        }
      } catch (e) {
        console.error(e)
        setError('Unable to load this product right now.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug])

  const handleSelectVariant = (variant) => {
    setSelectedVariant(variant)
  }

  const handleAddToCart = async () => {
    if (!product) return
    if (!user) {
      alert('Please log in with Google to add items to your cart.')
      return
    }
    setAdding(true)
    try {
      const body = {
        productId: product.id,
        productSlug: product.slug,
        quantity: 1,
        variantId: selectedVariant?.id || null,
      }
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.status === 401) {
        alert('Session expired. Please log in again.')
        return
      }
      if (!res.ok) {
        console.error('Failed to add to cart')
        return
      }
      // Optional: redirect or toast could go here; for now, stay on page
      alert('Added to cart!')
    } catch (e) {
      console.error('Error adding to cart', e)
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        Loading product...
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-200">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-slate-500">
          Product
        </p>
        <h1 className="text-lg font-semibold">This product slipped into another universe.</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-400">
          {error || 'We could not find the page you were looking for.'}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 rounded-full border-slate-700 bg-slate-900/80 text-xs text-slate-100 hover:bg-slate-800"
          onClick={() => (window.location.href = '/')}
        >
          <ChevronLeft className="mr-1 h-3 w-3" /> Back to home
        </Button>
      </div>
    )
  }

  const images = product.images || []
  const mainImage = images[activeImage] || images[0]

  const avgRating = product.rating || (reviews.length ? 4.8 : null)
  const reviewCount = product.reviewCount || reviews.length

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <main className="container mx-auto px-4 pb-16 pt-8">
        <div className="mb-3 text-[11px] text-slate-500 flex items-center gap-1">
          <button
            className="hover:text-slate-200 flex items-center gap-1"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-3 w-3" /> Home
          </button>
          <span className="mx-1">/</span>
          <span className="capitalize text-slate-400">
            {product.type === 'tshirt'
              ? 'T-Shirts'
              : product.type === 'plush'
              ? 'Plushes'
              : 'Figures'}
          </span>
          <span className="mx-1">/</span>
          <span className="text-slate-200 line-clamp-1">{product.title}</span>
        </div>

        <div className="mb-6 flex items-center justify-between text-xs text-slate-400">
          <button
            className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-200 hover:bg-slate-800"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-3 w-3" /> Back
          </button>
          <div className="flex items-center gap-3">
            {product.series && (
              <span className="rounded-full border border-violet-600/60 bg-violet-500/10 px-3 py-1 text-[11px] text-violet-200">
                {product.series}
              </span>
            )}
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-300">
              {product.type === 'tshirt'
                ? 'T-Shirt'
                : product.type === 'plush'
                ? 'Plush'
                : 'Figure'}
            </span>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,_1.2fr)_minmax(0,_1.3fr)]">
          {/* Gallery */}
          <section className="space-y-4">
            <Card className="overflow-hidden border border-slate-800 bg-slate-950/80">
              <div className="relative h-72 w-full sm:h-96">
                {mainImage && (
                  <Image
                    src={mainImage}
                    alt={product.title}
                    fill
                    className="object-cover object-center"
                  />
                )}
              </div>
            </Card>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img + idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border ${
                      idx === activeImage
                        ? 'border-violet-500'
                        : 'border-slate-800'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.title} view ${idx + 1}`}
                      fill
                      className="object-cover object-center"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Details */}
          <section className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
                {product.title}
              </h1>
              <p className="max-w-xl text-sm text-slate-300">{product.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <div className="flex items-center gap-1 text-amber-300">
                  <Star className="h-4 w-4" />
                  {avgRating && <span className="font-semibold">{avgRating.toFixed(1)}</span>}
                  <span className="text-slate-500">({reviewCount || 0} reviews)</span>
                </div>
                <div className="h-4 w-px bg-slate-700" />
                <span>Ships in 2–4 business days</span>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Price
                  </p>
                  <p className="text-2xl font-semibold text-slate-50">
                    ${product.price?.toFixed?.(2) ?? '0.00'}
                  </p>
                </div>
                {product.subcategory && (
                  <span className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200">
                    {product.subcategory === 'premium'
                      ? 'Premium figure'
                      : 'Sustainable series'}
                  </span>
                )}
              </div>

              {product.type === 'tshirt' && Array.isArray(product.variants) && (
                <div className="mt-3 space-y-3 border-t border-slate-800 pt-3 text-xs">
                  <p className="font-medium text-slate-200">Select fit & size</p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant) => {
                      const isActive = selectedVariant?.id === variant.id
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => handleSelectVariant(variant)}
                          className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
                            isActive
                              ? 'border-violet-500 bg-violet-500/20 text-violet-100'
                              : 'border-slate-700 bg-slate-900/80 text-slate-200 hover:border-violet-400/70'
                          }`}
                        >
                          {variant.fit} • {variant.size} • {variant.color}
                        </button>
                      )
                    })}
                  </div>
                  {selectedVariant && (
                    <p className="text-[11px] text-slate-400">
                      In stock:{' '}
                      <span className="text-slate-100">
                        {selectedVariant.stock} pcs
                      </span>
                    </p>
                  )}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  className="rounded-full bg-violet-500 text-xs font-semibold text-white hover:bg-violet-400"
                  onClick={handleAddToCart}
                >
                  Add to cart
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-slate-700 bg-slate-900/80 text-xs text-slate-100 hover:bg-slate-800"
                >
                  Add to wishlist
                </Button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Cart and checkout flow coming up next – this button will wire into your persistent cart.
              </p>
            </div>

            <div className="grid gap-4 text-xs text-slate-300 sm:grid-cols-2">
              {product.material && (
                <Card className="border border-slate-800 bg-slate-950/80">
                  <CardContent className="space-y-1 p-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
                      Material
                    </p>
                    <p>{product.material}</p>
                  </CardContent>
                </Card>
              )}
              {product.dimensions && (
                <Card className="border border-slate-800 bg-slate-950/80">
                  <CardContent className="space-y-1 p-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
                      Dimensions
                    </p>
                    <p>{product.dimensions}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <section className="mt-4 space-y-3">
              <h2 className="text-sm font-semibold text-slate-100">Reviews</h2>
              {reviews.length === 0 && (
                <p className="text-xs text-slate-400">
                  No reviews yet. Be the first to rate this drop once auth is live.
                </p>
              )}
              <div className="space-y-3">
                {reviews.map((review) => (
                  <Card
                    key={review.id}
                    className="border border-slate-800 bg-slate-950/80"
                  >
                    <CardContent className="space-y-2 p-4 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-300">
                          <Star className="h-3 w-3" />
                          <span className="font-semibold">
                            {review.rating?.toFixed?.(1) || review.rating}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {review.createdAt
                            ? new Date(review.createdAt).toLocaleDateString()
                            : ''}
                        </span>
                      </div>
                      {review.title && (
                        <p className="text-[11px] font-medium text-slate-100">
                          {review.title}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-300">{review.text}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </section>
        </div>
      </main>
    </div>
  )
}

export default ProductPage
