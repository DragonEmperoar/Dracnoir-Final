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
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)

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
  
  const discount = appliedCoupon ? (subtotal * appliedCoupon.discount / 100) : 0
  const total = subtotal - discount

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId)
  
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code')
      return
    }
    
    setApplyingCoupon(true)
    setCouponError('')
    
    try {
      const res = await fetch(`/api/coupons/validate?code=${couponCode.trim()}`)
      const data = await res.json()
      
      if (!res.ok) {
        setCouponError(data.error || 'Invalid coupon code')
        setAppliedCoupon(null)
        return
      }
      
      setAppliedCoupon(data)
      setCouponError('')
    } catch (e) {
      console.error(e)
      setCouponError('Unable to apply coupon right now')
    } finally {
      setApplyingCoupon(false)
    }
  }
  
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  const handleSaveAddress = async () => {
    setSavingAddress(true)
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data?.error || 'Unable to save address.')
        return
      }
      const savedAddress = await res.json()
      
      // Refresh addresses list
      const addrRes = await fetch('/api/addresses', { cache: 'no-store' })
      if (addrRes.ok) {
        const addrData = await addrRes.json()
        const list = Array.isArray(addrData) ? addrData : []
        setAddresses(list)
        // Auto-select the newly created address
        setSelectedAddressId(savedAddress.id)
      }
      
      // Reset form and close dialog
      setNewAddress({
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
      setShowAddressDialog(false)
    } catch (e) {
      console.error(e)
      alert('Unable to save address right now.')
    } finally {
      setSavingAddress(false)
    }
  }

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
                        ₹{(item.price || 0).toFixed(0)}
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
                  
                  {/* Add New Address Button */}
                  <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="mt-2 w-full border-dashed border-violet-500/40 bg-slate-950/60 text-xs text-violet-300 hover:border-violet-400 hover:bg-violet-500/10 hover:text-violet-200"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add New Address
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-800 bg-slate-950">
                      <DialogHeader>
                        <DialogTitle className="text-slate-100">Add New Shipping Address</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="label" className="text-xs text-slate-300">Label *</Label>
                          <Input
                            id="label"
                            placeholder="Home, Work, etc."
                            value={newAddress.label}
                            onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                            className="border-slate-800 bg-slate-900 text-slate-100"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-xs text-slate-300">Full Name</Label>
                          <Input
                            id="name"
                            placeholder="John Doe"
                            value={newAddress.name}
                            onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                            className="border-slate-800 bg-slate-900 text-slate-100"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-xs text-slate-300">Phone</Label>
                          <Input
                            id="phone"
                            placeholder="+1 234 567 8900"
                            value={newAddress.phone}
                            onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                            className="border-slate-800 bg-slate-900 text-slate-100"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="line1" className="text-xs text-slate-300">Address Line 1 *</Label>
                          <Input
                            id="line1"
                            placeholder="Street address"
                            value={newAddress.line1}
                            onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                            className="border-slate-800 bg-slate-900 text-slate-100"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="line2" className="text-xs text-slate-300">Address Line 2</Label>
                          <Input
                            id="line2"
                            placeholder="Apartment, suite, etc."
                            value={newAddress.line2}
                            onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                            className="border-slate-800 bg-slate-900 text-slate-100"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city" className="text-xs text-slate-300">City *</Label>
                            <Input
                              id="city"
                              placeholder="City"
                              value={newAddress.city}
                              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                              className="border-slate-800 bg-slate-900 text-slate-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state" className="text-xs text-slate-300">State *</Label>
                            <Input
                              id="state"
                              placeholder="State"
                              value={newAddress.state}
                              onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                              className="border-slate-800 bg-slate-900 text-slate-100"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="postalCode" className="text-xs text-slate-300">Postal Code *</Label>
                            <Input
                              id="postalCode"
                              placeholder="ZIP / Postal"
                              value={newAddress.postalCode}
                              onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                              className="border-slate-800 bg-slate-900 text-slate-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="country" className="text-xs text-slate-300">Country *</Label>
                            <Input
                              id="country"
                              placeholder="Country"
                              value={newAddress.country}
                              onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                              className="border-slate-800 bg-slate-900 text-slate-100"
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="isDefault"
                            checked={newAddress.isDefault}
                            onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                            className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-violet-500"
                          />
                          <Label htmlFor="isDefault" className="text-xs text-slate-300">
                            Set as default address
                          </Label>
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setShowAddressDialog(false)}
                            className="border-slate-700 text-slate-300 hover:bg-slate-900"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveAddress}
                            disabled={savingAddress || !newAddress.label || !newAddress.line1 || !newAddress.city || !newAddress.state || !newAddress.postalCode || !newAddress.country}
                            className="bg-violet-500 text-white hover:bg-violet-400"
                          >
                            {savingAddress ? 'Saving...' : 'Save Address'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Coupon Code Section */}
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Coupon Code
                  </Label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2">
                      <div>
                        <p className="text-xs font-medium text-emerald-300">
                          {appliedCoupon.code} Applied
                        </p>
                        <p className="text-[10px] text-emerald-400/80">
                          {appliedCoupon.discount}% discount
                        </p>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-xs text-emerald-300 hover:text-emerald-200"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="h-8 border-slate-800 bg-slate-900 text-xs text-slate-100"
                      />
                      <Button
                        size="sm"
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon}
                        className="h-8 rounded-lg bg-violet-500 text-xs hover:bg-violet-400"
                      >
                        {applyingCoupon ? 'Applying...' : 'Apply'}
                      </Button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-xs text-red-300">{couponError}</p>
                  )}
                </div>

                {/* Order Summary */}
                <div className="border-t border-slate-800 pt-3 text-slate-300">
                  <div className="flex items-center justify-between text-sm">
                    <span>Subtotal</span>
                    <span className="text-slate-50">₹{subtotal.toFixed(0)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-emerald-300">Discount ({appliedCoupon.discount}%)</span>
                      <span className="text-emerald-300">-₹{discount.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-2">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-lg font-semibold text-slate-50">
                      ₹{total.toFixed(0)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Taxes and shipping calculated at final checkout.
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
