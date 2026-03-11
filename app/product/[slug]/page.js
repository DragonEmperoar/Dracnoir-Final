'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Star, ChevronLeft, CheckCircle2, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '../../context/AuthContext'
import AppShell from '../../AppShell'

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
  const [fit, setFit] = useState('')
  const [color, setColor] = useState('')
  const [pincode, setPincode] = useState('')
  const [pincodeMessage, setPincodeMessage] = useState('')
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [showAdded, setShowAdded] = useState(false)
  const [inWishlist, setInWishlist] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  
  // Review form states
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

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
        // Auto-select first color and sync variant
        if (pData.colors?.length) {
          setColor(pData.colors[0].id)
          const defaultVariant = pData.variants?.find(v => v.color === pData.colors[0].id)
          if (defaultVariant) setSelectedVariant(defaultVariant)
        }
        // Check wishlist status if logged in
        if (pData?.id) {
          try {
            const wRes = await fetch(`/api/wishlist/check/${pData.id}`)
            if (wRes.ok) {
              const wData = await wRes.json()
              setInWishlist(wData.inWishlist)
            }
          } catch {}
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

  const handleChangeQuantity = (delta) => {
    setQuantity((prev) => {
      const next = prev + delta
      if (next < 1) return 1
      if (next > 10) return 10
      return next
    })
  }

  const handleCheckPincode = () => {
    if (!pincode || pincode.trim().length < 4) {
      setPincodeMessage('Enter a valid pincode to check delivery estimate.')
      return
    }
    setPincodeMessage('Standard delivery: 3–7 business days • Express options coming soon.')
  }

  const handleSubmitReview = async () => {
    if (!user) {
      alert('Please login to submit a review')
      router.push('/login')
      return
    }
    
    if (!reviewText.trim()) {
      alert('Please enter your review')
      return
    }
    
    setSubmittingReview(true)
    try {
      const res = await fetch(`/api/products/${slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: reviewRating,
          title: reviewTitle,
          text: reviewText,
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit review')
      }
      
      const newReview = await res.json()
      setReviews([newReview, ...reviews])
      setReviewRating(5)
      setReviewTitle('')
      setReviewText('')
      setShowReviewForm(false)
      alert('Review submitted successfully!')
    } catch (error) {
      console.error('Review submission error:', error)
      alert(error.message || 'Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
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
        quantity: quantity || 1,
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
      setShowAdded(true)
      setTimeout(() => setShowAdded(false), 2000)
    } catch (e) {
      console.error('Error adding to cart', e)
    } finally {
      setAdding(false)
    }
  }

  const handleToggleWishlist = async () => {
    if (!user) {
      router.push('/login')
      return
    }
    if (!product?.id) return
    setWishlistLoading(true)
    try {
      if (inWishlist) {
        await fetch(`/api/wishlist/${product.id}`, { method: 'DELETE' })
        setInWishlist(false)
      } else {
        await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id }),
        })
        setInWishlist(true)
      }
    } catch (e) { console.error('Wishlist error', e) }
    finally { setWishlistLoading(false) }
  }

  const handleBuyNow = async () => {    if (!product) return
    if (!user) {
      alert('Please log in with Google first, then tap Buy now again to jump to checkout.')
      return
    }
    setAdding(true)
    try {
      const body = {
        productId: product.id,
        productSlug: product.slug,
        quantity: quantity || 1,
        variantId: selectedVariant?.id || null,
      }
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        console.error('Failed to prepare cart for buy now')
        return
      }
      router.push('/checkout')
    } catch (e) {
      console.error('Error in buy now', e)
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center text-slate-200">
          Loading product...
        </div>
      </AppShell>
    )
  }

  if (error || !product) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center text-slate-200">
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
            onClick={() => router.push('/')}
          >
            <ChevronLeft className="mr-1 h-3 w-3" /> Back to home
          </Button>
        </div>
      </AppShell>
    )
  }

  const selectedColor = product.colors?.find(c => c.id === color)
  const images = (selectedColor?.images?.length ? selectedColor.images : product.images) || []
  const mainImage = images[activeImage] || images[0]

  const avgRating = product.rating || (reviews.length ? 4.8 : null)
  const reviewCount = product.reviewCount || reviews.length

  return (
    <AppShell>
      {/* Step 4: JSON-LD structured data for Google rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            image: product.images?.[0] || '',
            description: product.description || '',
            brand: { '@type': 'Brand', name: 'Dracnoir' },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'INR',
              price: product.price,
              availability:
                product.stock > 0
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
              url: `https://dracnoir.com/product/${product.slug}`,
            },
            aggregateRating:
              product.reviewCount > 0
                ? {
                    '@type': 'AggregateRating',
                    ratingValue: product.rating,
                    reviewCount: product.reviewCount,
                  }
                : undefined,
          }),
        }}
      />
      <div className="space-y-6">
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
              <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
                {mainImage && (
                  <Image
                    src={mainImage}
                    alt={`${product.title} anime merchandise`}                    fill
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

            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 relative">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Price
                  </p>
                  <p className="text-2xl font-semibold text-slate-50">
                    ₹{product.price?.toFixed?.(0) ?? '0'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1 text-amber-300">
                    <Star className="h-3 w-3" />
                    {avgRating && (
                      <span className="font-semibold">{avgRating.toFixed(1)}</span>
                    )}
                    <span className="text-slate-500">({reviewCount || 0})</span>
                  </div>
                  {product.subcategory && (
                    <span className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200">
                      {product.subcategory === 'premium'
                        ? 'Premium figure'
                        : 'Sustainable series'}
                    </span>
                  )}
                </div>
              </div>

              {product.type === 'tshirt' && (
                <div className="space-y-3 border-t border-slate-800 pt-3 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-200">Select fit & color</p>
                    <button
                      type="button"
                      onClick={() => setShowSizeGuide((v) => !v)}
                      className="text-[11px] text-violet-300 hover:text-violet-200"
                    >
                      {showSizeGuide ? 'Hide size guide' : 'View size guide'}
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-[11px] text-slate-400">Fit</p>
                      <Select
                        value={fit || ''}
                        onValueChange={(value) => setFit(value)}
                      >
                        <SelectTrigger className="h-9 border-slate-700 bg-slate-900/80 text-xs text-slate-200">
                          <SelectValue placeholder="Select fit" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-800 bg-slate-900 text-xs text-slate-100">
                          <SelectItem value="Oversized">Oversized fit</SelectItem>
                          <SelectItem value="Regular">Regular fit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-400">
                        Color{color ? <span className="ml-1 text-slate-200">— {selectedColor?.name || color}</span> : ''}
                      </p>
                      {product.colors && product.colors.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {product.colors.map((c) => {
                            const isSelected = color === c.id
                            return (
                              <button
                                key={c.id}
                                type="button"
                                title={c.name}
                                onClick={() => {
                                  setColor(c.id)
                                  setActiveImage(0)
                                  const variant = product.variants?.find(v => v.color === c.id)
                                  if (variant) setSelectedVariant(variant)
                                }}
                                className={`h-7 w-7 rounded-full border-2 transition-all duration-150 focus:outline-none ${
                                  isSelected
                                    ? 'border-violet-400 ring-2 ring-violet-400/60 scale-110'
                                    : 'border-slate-600 hover:border-slate-300 hover:scale-105'
                                }`}
                                style={{ backgroundColor: c.hex || '#888888' }}
                              />
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500">No colors available</p>
                      )}
                    </div>
                  </div>

                  {showSizeGuide && (
                    <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-[11px] text-slate-300">
                      <p className="mb-1 font-medium text-slate-200">Size guide</p>
                      <p>
                        Oversized fits are relaxed with dropped shoulders. If you prefer a
                        standard ComicSense-style fit, choose Regular in your usual size.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-800 pt-3 text-xs">
                <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/80">
                  <button
                    type="button"
                    className="px-3 py-1 text-slate-300 hover:text-slate-100"
                    onClick={() => handleChangeQuantity(-1)}
                  >
                    -
                  </button>
                  <span className="min-w-[2rem] text-center text-slate-100">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="px-3 py-1 text-slate-300 hover:text-slate-100"
                    onClick={() => handleChangeQuantity(1)}
                  >
                    +
                  </button>
                </div>
                <span className="text-slate-500">
                  Max 10 per order • You can update quantity in cart too.
                </span>
              </div>

              <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                <Button
                  className="flex-1 rounded-full bg-violet-500 text-xs font-semibold text-white hover:bg-violet-400"
                  onClick={handleAddToCart}
                  disabled={adding}
                >
                  {adding ? 'Adding...' : 'Add to cart'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-full border-violet-500/70 bg-slate-950 text-xs text-violet-200 hover:bg-violet-500/10"
                  onClick={handleBuyNow}
                >
                  Buy now
                </Button>
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  disabled={wishlistLoading}
                  title={user ? (inWishlist ? 'Remove from wishlist' : 'Add to wishlist') : 'Login to save to wishlist'}
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
                    inWishlist
                      ? 'border-pink-500/70 bg-pink-500/15 text-pink-400 hover:bg-pink-500/25'
                      : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-pink-500/50 hover:text-pink-400'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${inWishlist ? 'fill-pink-400' : ''}`} />
                </button>
              </div>

              {showAdded && (
                <div className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-center">
                  <div className="flex items-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-500/15 px-4 py-2 text-[11px] text-emerald-100 shadow-lg">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Added to cart</span>
                  </div>
                </div>
              )}
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

            <section className="mt-4 space-y-4 text-xs text-slate-300">
              <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
                  Delivery
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Enter pincode"
                    className="h-8 rounded-full border border-slate-700 bg-slate-900/80 px-3 text-[11px] text-slate-100 outline-none focus:border-violet-500"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-full border-violet-500/70 bg-slate-950 text-[11px] text-violet-200 hover:bg-violet-500/10"
                    onClick={handleCheckPincode}
                  >
                    Check
                  </Button>
                </div>
                {pincodeMessage && (
                  <p className="text-[11px] text-slate-400">{pincodeMessage}</p>
                )}
              </div>
            </section>

            <section className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-100">
                  Reviews ({reviewCount || 0})
                </h2>
                {user && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full border-violet-500/40 text-xs text-violet-300 hover:bg-violet-500/10"
                    onClick={() => setShowReviewForm(!showReviewForm)}
                  >
                    {showReviewForm ? 'Cancel' : 'Write Review'}
                  </Button>
                )}
              </div>
              
              {/* Review Submission Form */}
              {showReviewForm && (
                <Card className="border border-violet-500/30 bg-slate-950/80">
                  <CardContent className="space-y-4 p-4">
                    <div>
                      <label className="mb-2 block text-xs text-slate-300">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="transition-colors"
                          >
                            <Star
                              className={`h-5 w-5 ${
                                star <= reviewRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-600'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-xs text-slate-400">
                          {reviewRating} star{reviewRating !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="reviewTitle" className="mb-1 block text-xs text-slate-300">
                        Title (optional)
                      </label>
                      <input
                        id="reviewTitle"
                        type="text"
                        placeholder="Sum up your experience"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500"
                        maxLength={100}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="reviewText" className="mb-1 block text-xs text-slate-300">
                        Review *
                      </label>
                      <textarea
                        id="reviewText"
                        placeholder="Share your thoughts about this product..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500"
                        rows={4}
                        maxLength={500}
                        required
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        {reviewText.length}/500 characters
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSubmitReview}
                        disabled={submittingReview || !reviewText.trim()}
                        className="rounded-full bg-violet-500 text-xs hover:bg-violet-400"
                      >
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowReviewForm(false)}
                        className="rounded-full border-slate-700 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {!user && reviews.length === 0 && (
                <p className="text-xs text-slate-400">
                  No reviews yet. <button onClick={() => router.push('/login')} className="text-violet-300 hover:text-violet-200">Login</button> to be the first to review!
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
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-amber-300">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < (review.rating || 0)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-300">
                            {review.userName || 'Anonymous'}
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
      </div>
    </AppShell>
  )
}

export default ProductPage
