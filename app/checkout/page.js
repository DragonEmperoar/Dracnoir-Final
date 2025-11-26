'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import AppShell from '../AppShell'

const CheckoutPage = () => {
  const { user } = useAuth()
  const router = useRouter()
  const [cart, setCart] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  const [newAddress, setNewAddress] = useState({
    label: '',
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    isDefault: false,
  })
  const [savingAddress, setSavingAddress] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [cartRes, addrRes] = await Promise.all([
          fetch('/api/cart', { cache: 'no-store' }),
          fetch('/api/addresses', { cache: 'no-store' }),
        ])

        if (!cartRes.ok) {
          setError('Unable to load cart for checkout.')
          return
        }
        const cartData = await cartRes.json()
        setCart(cartData)

        if (addrRes.ok) {
          const addrData = await addrRes.json()
          const list = Array.isArray(addrData) ? addrData : []
          setAddresses(list)
          const def = list.find((a) => a.isDefault)
          const first = list[0]
          setSelectedAddressId(def?.id || first?.id || '')
        }
      } catch (e) {
        console.error(e)
        setError('Unable to load checkout data right now.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, router])

  const items = cart?.items || []
  const subtotal = items.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0,
  )

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId)

  const handlePlaceOrder = async () => {
    if (!items.length) {
      alert('Your cart is empty.')
      return
    }
    if (!selectedAddress) {
      alert('Please add and select a shipping address in your profile before placing an order.')
      router.push('/profile')
      return
    }
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId: selectedAddress.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data?.error || 'Unable to place order right now.')
        return
      }
      router.push(`/orders/${data.id}`)
    } catch (e) {
      console.error(e)
      alert('Unable to place order right now.')
    }
  }

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
          <div className="space-y-6 text-base text-slate-200">
            {/* Items */}
            <Card className="border border-slate-800 bg-slate-950/80">
              <CardContent className="space-y-4 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Items in your cart
                </p>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b border-slate-800/60 pb-2 last:border-0"
                    >
                      <div>
                        <p className="text-slate-100">{item.title}</p>
                        <p className="text-sm text-slate-400">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-100">
                        ${(item.price || 0).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary + address vertically stacked */}
            <Card className="border border-slate-800 bg-slate-950/80">
              <CardContent className="space-y-4 p-5 text-sm">
                <div className="space-y-2 text-slate-300">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Shipping address
                  </p>
                  {addresses.length === 0 ? (
                    <div className="space-y-1">
                      <p className="text-sm">No saved addresses found.</p>
                      <button
                        type="button"
                        className="text-xs text-violet-300 hover:text-violet-200"
                        onClick={() => router.push('/profile')}
                      >
                        Add an address in your profile
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {addresses.map((addr) => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                            addr.id === selectedAddressId
                              ? 'border-violet-500 bg-violet-500/10 text-slate-50'
                              : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-violet-400'
                          }`}
                        >
                          <p className="font-medium text-slate-100">
                            {addr.label || 'Address'}
                            {addr.isDefault && (
                              <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                                Default
                              </span>
                            )}
                          </p>
                          <p className="text-sm">
                            {addr.line1}
                            {addr.line2 ? `, ${addr.line2}` : ''}
                          </p>
                          <p className="text-sm">
                            {addr.city}, {addr.state} {addr.postalCode}
                          </p>
                          <p className="text-xs text-slate-400">{addr.country}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-800 pt-3 text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Subtotal</span>
                    <span className="text-lg font-semibold text-slate-50">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Taxes, shipping and discounts will be shown here in the full checkout.
                  </p>
                  <Button
                    className="mt-3 w-full rounded-full bg-violet-500 text-xs font-semibold text-white hover:bg-violet-400"
                    onClick={handlePlaceOrder}
                  >
                    Place order
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  )
}

export default CheckoutPage
