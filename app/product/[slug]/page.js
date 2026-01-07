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

  const [selectedVariant, setSelectedVariant] = useState(null)
  const [adding, setAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [fit, setFit] = useState('')
  const [color, setColor] = useState('')
  const [pincode, setPincode] = useState('')
  const [pincodeMessage, setPincodeMessage] = useState('')
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [showAdded, setShowAdded] = useState(false)

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
        if (!pRes.ok) throw new Error('Product not found')

        const pData = await pRes.json()
        const rData = rRes.ok ? await rRes.json() : []

        setProduct(pData)
        setReviews(Array.isArray(rData) ? rData : [])

        if (Array.isArray(pData?.variants) && pData.variants.length > 0) {
          setSelectedVariant(pData.variants[0])
        }

        // set default color if exists
        if (pData?.colors?.length) {
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
    setPincodeMessage(
      'Standard delivery: 3–7 business days • Express options coming soon.',
    )
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
        color,
        fit,
      }

      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) return

      setShowAdded(true)
      setTimeout(() => setShowAdded(false), 2000)
    } catch (e) {
      console.error('Error adding to cart', e)
    } finally {
      setAdding(false)
    }
  }

  const handleBuyNow = async () => {
    if (!product) return
    if (!user) {
      alert(
        'Please log in with Google first, then tap Buy now again to jump to checkout.',
      )
      return
    }

    setAdding(true)
    try {
      const body = {
        productId: product.id,
        productSlug: product.slug,
        quantity: quantity || 1,
        variantId: selectedVariant?.id || null,
        color,
        fit,
      }

      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) return
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
          <h1 className="text-lg font-semibold">
            This product slipped into another universe.
          </h1>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push('/')}
          >
            <ChevronLeft className="mr-1 h-3 w-3" /> Back to home
          </Button>
        </div>
      </AppShell>
    )
  }

  // 🔥 IMAGE LOGIC (safe + color aware)
  let images = product.images || []

  if (product.colors?.length && color) {
    const selectedColor = product.colors.find((c) => c.id === color)
    if (selectedColor?.images?.length) {
      images = selectedColor.images
    }
  }

  const mainImage = images[activeImage] || images[0]

  const avgRating = product.rating || (reviews.length ? 4.8 : null)
  const reviewCount = product.reviewCount || reviews.length

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1.3fr]">
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
                    className={`relative h-16 w-20 overflow-hidden rounded-lg border ${
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

          {/* Details */}
          <section className="space-y-6">
            <h1 className="text-2xl font-semibold text-slate-50">
              {product.title}
            </h1>

            <p className="text-sm text-slate-300">{product.description}</p>

            <p className="text-2xl font-semibold text-slate-50">
              ₹{product.price}
            </p>

            {product.type === 'tshirt' && (
              <div className="space-y-3 text-xs">
                {/* FIT */}
                <Select value={fit} onValueChange={setFit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oversized">Oversized</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                  </SelectContent>
                </Select>

                {/* COLOR (dynamic) */}
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.colors?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name || c.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-3 text-xs">
              <button onClick={() => handleChangeQuantity(-1)}>-</button>
              <span>{quantity}</span>
              <button onClick={() => handleChangeQuantity(1)}>+</button>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleAddToCart} disabled={adding}>
                {adding ? 'Adding...' : 'Add to cart'}
              </Button>
              <Button variant="outline" onClick={handleBuyNow}>
                Buy now
              </Button>
            </div>

            {showAdded && (
              <div className="text-emerald-400 text-xs flex items-center gap-1">
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
