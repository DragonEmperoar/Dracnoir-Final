'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Star, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

  const [quantity, setQuantity] = useState(1)
  const [fit, setFit] = useState('')
  const [color, setColor] = useState('')

  const [pincode, setPincode] = useState('')
  const [pincodeMessage, setPincodeMessage] = useState('')
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [showAdded, setShowAdded] = useState(false)
  const [adding, setAdding] = useState(false)

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  // -------------------------
  // FETCH PRODUCT + REVIEWS
  // -------------------------
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

        if (!pRes.ok) throw new Error('Product not found')

        const pData = await pRes.json()
        const rData = rRes.ok ? await rRes.json() : []

        setProduct(pData)
        setReviews(Array.isArray(rData) ? rData : [])

        // auto select first color if exists
        if (pData.colors?.length) {
          setColor(pData.colors[0].id)
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

  // ---------------------------------
  // RESET IMAGE WHEN COLOR CHANGES
  // ---------------------------------
  useEffect(() => {
    if (!product || !color || !product.colors) return
    setActiveImage(0)
  }, [color, product])

  // -------------------------
  // HELPERS
  // -------------------------
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
    setPincodeMessage('Standard delivery: 3–7 business days.')
  }

  // -------------------------
  // ADD TO CART
  // -------------------------
  const handleAddToCart = async () => {
    if (!product) return
    if (!user) {
      alert('Please log in to add items to your cart.')
      return
    }

    setAdding(true)
    try {
      const body = {
        productId: product.id,
        productSlug: product.slug,
        quantity,
        color: color || null,
        size: fit || null,
      }

      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        alert('Failed to add to cart')
        return
      }

      setShowAdded(true)
      setTimeout(() => setShowAdded(false), 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setAdding(false)
    }
  }

  const handleBuyNow = async () => {
    if (!product) return
    if (!user) {
      alert('Please log in first.')
      return
    }

    setAdding(true)
    try {
      const body = {
        productId: product.id,
        productSlug: product.slug,
        quantity,
        color: color || null,
        size: fit || null,
      }

      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) return
      router.push('/checkout')
    } catch (e) {
      console.error(e)
    } finally {
      setAdding(false)
    }
  }

  // -------------------------
  // REVIEWS
  // -------------------------
  const handleSubmitReview = async () => {
    if (!user) {
      alert('Login to submit a review')
      router.push('/login')
      return
    }

    if (!reviewText.trim()) {
      alert('Enter your review')
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

      if (!res.ok) throw new Error('Failed to submit')

      const newReview = await res.json()
      setReviews([newReview, ...reviews])
      setReviewRating(5)
      setReviewTitle('')
      setReviewText('')
      setShowReviewForm(false)
    } catch (e) {
      alert('Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  // -------------------------
  // LOADING / ERROR
  // -------------------------
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
        <div className="flex min-h-[60vh] items-center justify-center text-slate-200">
          {error || 'Product not found'}
        </div>
      </AppShell>
    )
  }

  // -------------------------
  // IMAGE LOGIC (SAFE)
  // -------------------------
  let displayImages = product.images || []

  if (product.colors?.length && color) {
    const found = product.colors.find((c) => c.id === color)
    if (found?.images?.length) displayImages = found.images
  }

  const mainImage = displayImages[activeImage] || displayImages[0]

  const avgRating = product.rating || (reviews.length ? 4.8 : null)
  const reviewCount = product.reviewCount || reviews.length

  // -------------------------
  // RENDER
  // -------------------------
  return (
    <AppShell>
      <div className="space-y-6">

        {/* GALLERY */}
        <div className="grid gap-10 lg:grid-cols-2">
          <section className="space-y-4">
            <Card className="overflow-hidden border border-slate-800 bg-slate-950/80">
              <div className="relative h-80 w-full">
                {mainImage && (
                  <Image
                    src={mainImage}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            </Card>

            {displayImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {displayImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative h-16 w-20 rounded border ${
                      idx === activeImage
                        ? 'border-violet-500'
                        : 'border-slate-800'
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* DETAILS */}
          <section className="space-y-6">
            <h1 className="text-3xl font-semibold text-slate-50">
              {product.title}
            </h1>
            <p className="text-sm text-slate-300">{product.description}</p>

            {/* PRICE */}
            <p className="text-2xl font-semibold text-slate-50">
              ₹{product.price?.toFixed?.(0) ?? 0}
            </p>

            {/* COLOR SELECT */}
            {product.colors?.length && (
              <div className="space-y-1 text-xs">
                <p className="text-slate-400">Color</p>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger className="h-9 border-slate-700 bg-slate-900 text-xs text-slate-200">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-800 bg-slate-900 text-xs text-slate-100">
                    {product.colors.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* SIZE / FIT */}
            {product.sizes?.length && (
              <div className="space-y-1 text-xs">
                <p className="text-slate-400">Size</p>
                <Select value={fit} onValueChange={setFit}>
                  <SelectTrigger className="h-9 border-slate-700 bg-slate-900 text-xs text-slate-200">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-800 bg-slate-900 text-xs text-slate-100">
                    {product.sizes.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* QUANTITY */}
            <div className="flex items-center gap-3 text-xs">
              <button onClick={() => handleChangeQuantity(-1)}>-</button>
              <span>{quantity}</span>
              <button onClick={() => handleChangeQuantity(1)}>+</button>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2">
              <Button onClick={handleAddToCart} disabled={adding}>
                {adding ? 'Adding...' : 'Add to cart'}
              </Button>
              <Button variant="outline" onClick={handleBuyNow}>
                Buy now
              </Button>
            </div>

            {showAdded && (
              <div className="flex items-center gap-2 text-emerald-400 text-xs">
                <CheckCircle2 className="h-4 w-4" /> Added to cart
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  )
}

export default ProductPage
