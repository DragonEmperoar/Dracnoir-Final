'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Trash2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '../context/AuthContext'
import AppShell from '../AppShell'

const CartPage = () => {
  const { user } = useAuth()
  const router = useRouter()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadCart = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/cart', { cache: 'no-store' })
      if (res.status === 401) {
        setError('Please log in to view your cart.')
        setCart(null)
        return
      }
      const data = await res.json()
      setCart(data)
    } catch (e) {
      console.error(e)
      setError('Unable to load cart right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCart() }, [])

  const handleRemoveItem = async (itemId) => {
    try {
      const res = await fetch('/api/cart/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      })
      if (!res.ok) return
      const data = await res.json()
      setCart(data)
    } catch (e) {
      console.error('Failed to remove item', e)
    }
  }

  const items = cart?.items || []
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)

  return (
    <AppShell>
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <button
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="h-3 w-3" /> Back to home
            </button>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Your cart
            </h1>
            <p className="text-sm text-muted-foreground">
              Review your picks before heading to checkout. Cart is tied to your Dracnoir account.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-600 dark:text-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading cart...</div>
        ) : !user && !cart ? (
          <div className="text-sm text-muted-foreground">
            Please log in with Google to start a cart.
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/80 p-6 text-sm text-muted-foreground">
            Your cart is empty. Start exploring products and add something to your hoard.
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,_2fr)_minmax(0,_1fr)]">
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id} className="border border-border bg-card">
                  <CardContent className="flex gap-4 p-4">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover object-center"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between gap-1 text-xs">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-violet-500">
                          {item.variantId ? 'Variant' : 'Item'}
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {item.title}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground">
                          Qty: <span className="font-semibold">{item.quantity}</span>
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          ₹{(item.price || 0).toFixed(0)}
                        </p>
                      </div>
                    </div>
                    <button
                      className="ml-2 text-muted-foreground hover:text-red-500"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="h-fit border border-border bg-card">
              <CardContent className="space-y-4 p-5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-base font-semibold text-foreground">
                    ₹{subtotal.toFixed(0)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Taxes and shipping will be calculated at checkout.
                </p>
                <Button
                  className="w-full rounded-full bg-violet-500 text-xs font-semibold text-white hover:bg-violet-400"
                  onClick={() => router.push('/checkout')}
                >
                  Checkout
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  )
}

export default CartPage
