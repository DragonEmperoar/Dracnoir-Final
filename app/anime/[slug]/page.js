'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Star, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AppShell from '../../AppShell'

const ANIME_INFO = {
  naruto: { name: 'Naruto', tagline: 'Believe it! — From Konoha to your shelf.', banner: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1775379428/Naruto_Banner_kqlyzx.webp' },
  'jujutsu-kaisen': { name: 'Jujutsu Kaisen', tagline: 'Throughout heaven and earth, I alone am the honored one.', banner: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1775379426/Jujutsu_Kaisen_Banner_knqsss.webp' },
  'attack-on-titan': { name: 'Attack on Titan', tagline: 'Fight for freedom. Collect the legacy.', banner: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1775379479/Attack_On_Titan_Banner_2_ncbtzt.webp' },
  'demon-slayer': { name: 'Demon Slayer', tagline: 'Protect your loved ones. Own the story.', banner: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1775379482/Demon_Slayer_Banner_pg3879.webp' },
  'dragon-ball': { name: 'Dragon Ball', tagline: "It's over 9000! — Power up your collection.", banner: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1775379425/Dragon_Ball_Banner_ypnotu.webp' },
  'one-piece': { name: 'One Piece', tagline: 'The adventure never ends. Neither does the merch.', banner: 'https://res.cloudinary.com/dgklaf4bk/image/upload/v1775379372/One_Piece_Banner_i6oui9.webp' },
}

function toDisplayName(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
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
            alt={`${product.title} anime merchandise`}
            fill
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${soldOut ? 'blur-[2px] brightness-75' : ''}`}
            style={{ objectPosition: product.imagePositions?.[0] || product.imagePosition || 'center' }}
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
          {product.series && <p className="text-[10px] text-muted-foreground truncate">{product.series}</p>}
          <h3 className="line-clamp-1 text-xs font-semibold text-foreground">{product.title}</h3>
        </div>
        <div className="flex items-center justify-between pt-1 text-xs">
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="h-2.5 w-2.5" />
            <span className="text-[11px]">{product.rating?.toFixed?.(1) || '4.8'}</span>
          </div>
          <div className="text-xs font-semibold text-foreground">₹{product.price?.toFixed?.(0) ?? '0'}</div>
        </div>
      </CardContent>
    </Card>
  )
}

const AnimeUniversePage = () => {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug || ''

  const info = ANIME_INFO[slug] || {
    name: toDisplayName(slug),
    tagline: `Premium anime merchandise from ${toDisplayName(slug)}.`,
    banner: 'https://images.unsplash.com/photo-1607452386484-84a759ab2c01?w=1200&q=80',
  }

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!slug) return
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/products?series=${encodeURIComponent(info.name)}&limit=24`)
        if (res.ok) {
          const data = await res.json()
          setProducts(data?.items || [])
          setTotal(data?.total || 0)
        }
      } catch (e) { console.error('Failed to fetch anime products', e) }
      finally { setLoading(false) }
    }
    load()
  }, [slug])

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-border" style={{ aspectRatio: '5/2' }}>
          <Image
            src={info.banner}
            alt={`${info.name} anime merchandise banner`}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <button
              type="button" onClick={() => router.back()}
              className="mb-3 flex items-center gap-1 text-xs text-white/70 hover:text-white"
            >
              <ChevronLeft className="h-3 w-3" /> Back
            </button>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80">Universe</p>
            <h1 className="text-2xl font-bold text-white md:text-3xl">{info.name}</h1>
            <p className="mt-1 text-sm text-white/80">{info.tagline}</p>
          </div>
        </div>

        {/* Products */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-violet-500/80">
                Showing {total > 0 ? `${total} products` : 'products'}
              </p>
              <h2 className="text-lg font-semibold">{info.name} Merch</h2>
            </div>
            <Button size="sm" variant="outline" onClick={() => router.push('/products')} className="rounded-full border-border text-xs hover:border-violet-500/50">
              All products
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              Loading {info.name} merchandise...
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="text-muted-foreground">No products found for {info.name} yet.</p>
              <Button onClick={() => router.push('/products')} className="rounded-full bg-violet-500 text-xs hover:bg-violet-400">Browse all products</Button>
            </div>
          ) : (
            <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onClick={() => router.push(`/product/${product.slug}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

export default AnimeUniversePage
