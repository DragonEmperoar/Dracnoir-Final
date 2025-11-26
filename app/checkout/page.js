'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import AppShell from '../AppShell'

const CheckoutPage = () => {
  const { user } = useAuth()
  const router = useRouter()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    const loadCart = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/cart', { cache: 'no-store' })
        if (!res.ok) {
          setError('Unable to load cart for checkout.')
          return
        }
        const data = await res.json()
        setCart(data)
      } catch (e) {
        console.error(e)
        setError('Unable to load cart for checkout.')
      } finally {
        setLoading(false)
      }
    }
    loadCart()
  }, [user, router])

  const items = cart?.items || []
  const subtotal = items.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0,
  )

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80">Checkout</p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Review and place your order
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              A simple one-page checkout for your Dracnoir haul.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
            {error}
          </div>
        )}

        {loading || !cart ? (
          <div className="text-sm text-slate-300">Loading checkout...</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 text-sm text-slate-300">
            Your cart is empty. Add items before checking out.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,_1.4fr)_minmax(0,_1.2fr)]">
            <Card className="border border-slate-800 bg-slate-950/80">
              <CardContent className="space-y-3 p-4 text-sm">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  Items
                </p>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b border-slate-800/60 py-2 text-xs last:border-0"
                  >
                    <div>
                      <p className="text-slate-100">{item.title}</p>
                      <p className="text-slate-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-slate-100">
                      ${(item.price || 0).toFixed(2)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="h-fit border border-slate-800 bg-slate-950/80">
              <CardContent className="space-y-4 p-5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Subtotal</span>
                  <span className="text-base font-semibold text-slate-50">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Taxes, shipping and discounts will be shown here in the full checkout.
                </p>
                <Button className="w-full rounded-full bg-violet-500 text-xs font-semibold text-white hover:bg-violet-400">
                  Place order (stub)
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

export default CheckoutPage
