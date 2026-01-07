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
  const rawSlug = params?.slug
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [adding, setAdding] = useState(false)
  const [showAdded, setShowAdded] = useState(false)

  useEffect(() => {
    if (!slug) return
    const fetchData = async () => {
      try {
        const [pRes, rRes] = await Promise.all([
          fetch(`/api/products/${slug}`),
          fetch(`/api/products/${slug}/reviews`),
        ])
        if (!pRes.ok) throw new Error('Product not found')

        const pData = await pRes.json()
        const rData = rRes.ok ? await rRes.json() : []

        setProduct(pData)
        setReviews(rData)

        // default selections
        if (pData.colors?.length) setColor(pData.colors[0].id)
        if (pData.sizes?.length) setSize(pData.sizes[0])
      } catch (e) {
        console.error(e)
        setError('Unable to load this product right now.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug])

  if (loading) return <AppShell><div className="text-center">Loading…</div></AppShell>
  if (error || !product) return <AppShell><div>{error}</div></AppShell>

  // 🔥 image logic by color
  const selectedColorObj = product.colors?.find(c => c.id === color)
  const images = selectedColorObj?.images?.length
    ? selectedColorObj.images
    : product.images || []

  const mainImage = images[activeImage] || images[0]

  // 🔥 stock logic
  const stockForSelection =
    product.stock?.[color]?.[size] ?? 0

  const handleAddToCart = async () => {
    if (!user) {
      alert('Please login first')
      return
    }

    if (!color || !size) {
      alert('Please select color and size')
      return
    }

    if (stockForSelection < quantity) {
      alert('Not enough stock available')
      return
    }

    setAdding(true)
    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productSlug: product.slug,
          quantity,
          color,
          size,
        }),
      })

      if (!res.ok) throw new Error('Add to cart failed')

      setShowAdded(true)
      setTimeout(() => setShowAdded(false), 2000)
    } catch (e) {
      console.error(e)
      alert('Could not add to cart')
    } finally {
      setAdding(false)
    }
  }

  return (
    <AppShell>
      <div className="grid gap-10 lg:grid-cols-2">

        {/* GALLERY */}
        <section>
          <div className="relative h-96 w-full">
            {mainImage && (
              <Image src={mainImage} alt={product.title} fill className="object-cover" />
            )}
          </div>

          <div className="flex gap-2 mt-2">
            {images.map((img, i) => (
              <button key={i} onClick={() => setActiveImage(i)}>
                <Image src={img} alt="" width={60} height={60} />
              </button>
            ))}
          </div>
        </section>

        {/* DETAILS */}
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <p>{product.description}</p>
          <p className="text-xl font-semibold">₹{product.price}</p>

          {/* SIZE */}
          <div>
            <p className="text-sm">Size</p>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {product.sizes?.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* COLOR */}
          <div>
            <p className="text-sm">Color</p>
            <Select value={color} onValueChange={(v)=>{
              setColor(v)
              setActiveImage(0)
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                {product.colors?.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* STOCK */}
          <p className="text-sm">
            Stock: <b>{stockForSelection}</b>
          </p>

          {/* QTY */}
          <div className="flex items-center gap-3">
            <button onClick={()=>setQuantity(q=>Math.max(1,q-1))}>-</button>
            <span>{quantity}</span>
            <button onClick={()=>setQuantity(q=>q+1)}>+</button>
          </div>

          <Button onClick={handleAddToCart} disabled={adding}>
            {adding ? 'Adding…' : 'Add to Cart'}
          </Button>

          {showAdded && <p className="text-green-500">Added to cart!</p>}
        </section>
      </div>
    </AppShell>
  )
}

export default ProductPage
