'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Star, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '../../context/AuthContext'
import AppShell from '../../AppShell'

function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params.slug

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  /** NEW STATES */
  const [selectedColor, setSelectedColor] = useState(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState(null)

  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [showAdded, setShowAdded] = useState(false)

  useEffect(() => {
    if (!slug) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const [pRes, rRes] = await Promise.all([
          fetch(`/api/products/${slug}`),
          fetch(`/api/products/${slug}/reviews`),
        ])

        const productData = await pRes.json()
        const reviewData = rRes.ok ? await rRes.json() : []

        setProduct(productData)
        setReviews(reviewData)

        /** DEFAULT COLOR */
        if (productData.colors?.length) {
          setSelectedColor(productData.colors[0])
        }

        /** DEFAULT VARIANT */
        if (productData.variants?.length) {
          setSelectedVariant(productData.variants[0])
        }

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug])

  const images = selectedColor?.images || []
  const mainImage = images[activeImageIndex] || images[0]

  const handleAddToCart = async () => {
    if (!user || !product) return

    setAdding(true)
    await fetch('/api/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        productSlug: product.slug,
        quantity,
        variantId: selectedVariant?.id || null,
        color: selectedColor?.name || null,
      }),
    })

    setShowAdded(true)
    setTimeout(() => setShowAdded(false), 2000)
    setAdding(false)
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center text-slate-300">
          Loading product…
        </div>
      </AppShell>
    )
  }

  if (!product) return null

  return (
    <AppShell>
      <div className="grid gap-10 lg:grid-cols-2">

        {/* IMAGE GALLERY */}
        <section className="space-y-4">
          <Card className="overflow-hidden border border-slate-800 bg-slate-950/80">
            <div className="relative h-80">
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

          <div className="flex gap-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`relative h-16 w-20 rounded-lg overflow-hidden border ${
                  idx === activeImageIndex ? 'border-violet-500' : 'border-slate-800'
                }`}
              >
                <Image src={img} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        </section>

        {/* PRODUCT DETAILS */}
        <section className="space-y-6">
          <h1 className="text-2xl font-semibold text-slate-50">{product.title}</h1>
          <p className="text-sm text-slate-300">{product.description}</p>

          {/* PRICE */}
          <p className="text-2xl font-bold text-violet-300">₹{product.price}</p>

          {/* COLOR SELECT */}
          {product.colors?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">Color</p>
              <div className="flex gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => {
                      setSelectedColor(color)
                      setActiveImageIndex(0)
                    }}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      selectedColor?.name === color.name
                        ? 'border-violet-500 text-violet-300'
                        : 'border-slate-700 text-slate-300'
                    }`}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* VARIANT SELECT */}
          {product.variants?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">Fit & Size</p>
              <Select
                value={selectedVariant?.id || ''}
                onValueChange={(id) =>
                  setSelectedVariant(product.variants.find(v => v.id === id))
                }
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-xs">
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent>
                  {product.variants.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.fit} • {v.size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* QUANTITY */}
          <div className="flex items-center gap-3">
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity(q => q + 1)}>+</button>
          </div>

          {/* ACTIONS */}
          <Button
            onClick={handleAddToCart}
            disabled={adding}
            className="rounded-full bg-violet-500 hover:bg-violet-400"
          >
            {adding ? 'Adding…' : 'Add to cart'}
          </Button>

          {showAdded && (
            <div className="flex items-center gap-2 text-emerald-400 text-xs">
              <CheckCircle2 className="h-4 w-4" />
              Added to cart
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}

export default ProductPage
