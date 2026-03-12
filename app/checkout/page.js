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
    label: '', name: '', phone: '', line1: '', line2: '',
    city: '', state: '', postalCode: '', country: '', isDefault: false,
  })
  const [savingAddress, setSavingAddress] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/'); return }
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [cartRes, addrRes] = await Promise.all([
          fetch('/api/cart', { cache: 'no-store' }),
          fetch('/api/addresses', { cache: 'no-store' }),
        ])
        if (!cartRes.ok) { setError('Unable to load cart for checkout.'); return }
        const cartData = await cartRes.json()
        setCart(cartData)
        if (addrRes.ok) {
          const addrData = await addrRes.json()
          const list = Array.isArray(addrData) ? addrData : []
          setAddresses(list)
          const def = list.find((a) => a.isDefault)
          setSelectedAddressId(def?.id || list[0]?.id || '')
        }
      } catch (e) {
        console.error(e)
        setError('Unable to load checkout data right now.')
      } finally { setLoading(false) }
    }
    load()
  }, [user, router])

  const items = cart?.items || []
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)
  const discount = appliedCoupon
    ? appliedCoupon.type === 'flat'
      ? Math.min(appliedCoupon.value, subtotal)
      : Math.round(subtotal * (appliedCoupon.value || appliedCoupon.discount || 0) / 100)
    : 0
  const total = subtotal - discount
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) { setCouponError('Please enter a coupon code'); return }
    setApplyingCoupon(true); setCouponError('')
    try {
      const res = await fetch(`/api/coupons/validate?code=${couponCode.trim()}`)
      const data = await res.json()
      if (!res.ok) { setCouponError(data.error || 'Invalid coupon code'); setAppliedCoupon(null); return }
      setAppliedCoupon(data); setCouponError('')
    } catch (e) {
      console.error(e); setCouponError('Unable to apply coupon right now')
    } finally { setApplyingCoupon(false) }
  }

  const handleRemoveCoupon = () => { setAppliedCoupon(null); setCouponCode(''); setCouponError('') }

  const handleSaveAddress = async () => {
    setSavingAddress(true)
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress),
      })
      if (!res.ok) { const data = await res.json(); alert(data?.error || 'Unable to save address.'); return }
      const savedAddress = await res.json()
      const addrRes = await fetch('/api/addresses', { cache: 'no-store' })
      if (addrRes.ok) {
        const addrData = await addrRes.json()
        const list = Array.isArray(addrData) ? addrData : []
        setAddresses(list)
        setSelectedAddressId(savedAddress.id)
      }
      setNewAddress({ label: '', name: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: '', isDefault: false })
      setShowAddressDialog(false)
    } catch (e) {
      console.error(e); alert('Unable to save address right now.')
    } finally { setSavingAddress(false) }
  }

  const loadRazorpayScript = () => new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const handlePlaceOrder = async () => {
    if (!items.length) { alert('Your cart is empty.'); return }
    if (!selectedAddress) { alert('Please add and select a shipping address before placing an order.'); return }
    setLoading(true)
    try {
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId: selectedAddress.id }),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) { alert(orderData?.error || 'Unable to create order.'); setLoading(false); return }
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) { alert('Payment gateway failed to load.'); setLoading(false); return }
      const paymentOrderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, currency: 'INR', orderId: orderData.id, notes: { orderId: orderData.id, userId: user.id } }),
      })
      const razorpayOrder = await paymentOrderRes.json()
      if (!paymentOrderRes.ok) { alert('Unable to initialize payment.'); setLoading(false); return }
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount, currency: razorpayOrder.currency,
        name: 'Dracnoir', description: `Order #${orderData.id.slice(-6)}`,
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, orderId: orderData.id }),
            })
            if (verifyRes.ok) router.push(`/orders/${orderData.id}`)
            else alert('Payment verification failed. Please contact support.')
          } catch (error) { console.error(error); alert('Payment verification failed.') }
        },
        prefill: { name: user.name || selectedAddress.name, email: user.email, contact: selectedAddress.phone || '' },
        theme: { color: '#8b5cf6' },
        modal: { ondismiss: () => setLoading(false) },
      }
      const razorpay = new window.Razorpay(options)
      razorpay.open()
      razorpay.on('payment.failed', () => { alert('Payment failed. Please try again.'); setLoading(false) })
    } catch (e) {
      console.error(e); alert('Unable to process payment right now.'); setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-500/80">Checkout</p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Review and place your order</h1>
            <p className="mt-1 text-sm text-muted-foreground">A simple one-page checkout for your Dracnoir haul.</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-600 dark:text-red-100">
            {error}
          </div>
        )}

        {loading || !cart ? (
          <div className="text-sm text-muted-foreground">Loading checkout...</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/80 p-6 text-sm text-muted-foreground">
            Your cart is empty. Add items before checking out.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Items */}
            <Card className="border border-border bg-card">
              <CardContent className="space-y-4 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Items in your cart
                </p>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 border-b border-border/60 pb-3 last:border-0"
                    >
                      <div className="flex items-start gap-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
                          />
                        )}
                        <div className="space-y-0.5">
                          <p className="text-sm text-foreground">{item.title}</p>
                          {item.color && <p className="text-xs text-muted-foreground">Color: {item.color}</p>}
                          {item.size && <p className="text-xs text-muted-foreground">Size: {item.size}</p>}
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="flex-shrink-0 text-sm font-semibold">₹{(item.price || 0).toFixed(0)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary + address */}
            <Card className="border border-border bg-card">
              <CardContent className="space-y-4 p-5 text-sm">
                <div className="space-y-2 text-muted-foreground">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Shipping address</p>
                  {addresses.length === 0 ? (
                    <div className="space-y-1">
                      <p className="text-sm">No saved addresses found.</p>
                      <button type="button" className="text-xs text-violet-500 hover:text-violet-400" onClick={() => router.push('/profile')}>
                        Add an address in your profile
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {addresses.map((addr) => (
                        <button
                          key={addr.id} type="button"
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                            addr.id === selectedAddressId
                              ? 'border-violet-500 bg-violet-500/10 text-foreground'
                              : 'border-border bg-card/80 text-muted-foreground hover:border-violet-400'
                          }`}
                        >
                          <p className="font-medium text-foreground">
                            {addr.label || 'Address'}
                            {addr.isDefault && (
                              <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-300">
                                Default
                              </span>
                            )}
                          </p>
                          <p className="text-sm">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                          <p className="text-sm">{addr.city}, {addr.state} {addr.postalCode}</p>
                          <p className="text-xs text-muted-foreground">{addr.country}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Add New Address */}
                  <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="mt-2 w-full border-dashed border-violet-500/40 bg-card/60 text-xs text-violet-500 hover:border-violet-400 hover:bg-violet-500/10">
                        <Plus className="mr-1 h-3 w-3" /> Add New Address
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] max-w-[95vw] sm:max-w-lg overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Shipping Address</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {[['label','Label *','Home, Work, etc.'],['name','Full Name','John Doe'],['phone','Phone','+1 234 567 8900'],['line1','Address Line 1 *','Street address'],['line2','Address Line 2','Apartment, suite, etc.']].map(([field, label, ph]) => (
                          <div key={field} className="space-y-2">
                            <Label htmlFor={field} className="text-xs text-muted-foreground">{label}</Label>
                            <Input id={field} placeholder={ph} value={newAddress[field]} onChange={(e) => setNewAddress({ ...newAddress, [field]: e.target.value })} />
                          </div>
                        ))}
                        <div className="grid grid-cols-2 gap-4">
                          {[['city','City *','City'],['state','State *','State']].map(([field, label, ph]) => (
                            <div key={field} className="space-y-2">
                              <Label htmlFor={field} className="text-xs text-muted-foreground">{label}</Label>
                              <Input id={field} placeholder={ph} value={newAddress[field]} onChange={(e) => setNewAddress({ ...newAddress, [field]: e.target.value })} />
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {[['postalCode','Postal Code *','ZIP / Postal'],['country','Country *','Country']].map(([field, label, ph]) => (
                            <div key={field} className="space-y-2">
                              <Label htmlFor={field} className="text-xs text-muted-foreground">{label}</Label>
                              <Input id={field} placeholder={ph} value={newAddress[field]} onChange={(e) => setNewAddress({ ...newAddress, [field]: e.target.value })} />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="isDefault" checked={newAddress.isDefault} onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })} className="h-4 w-4 rounded border-border" />
                          <Label htmlFor="isDefault" className="text-xs text-muted-foreground">Set as default address</Label>
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                          <Button variant="outline" onClick={() => setShowAddressDialog(false)}>Cancel</Button>
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

                {/* Coupon Code */}
                <div className="space-y-2 border-t border-border pt-3">
                  <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Coupon Code</Label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2">
                      <div>
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-300">{appliedCoupon.code} Applied</p>
                        <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400">
                          {appliedCoupon.type === 'flat' ? `₹${appliedCoupon.value} flat discount` : `${appliedCoupon.value || appliedCoupon.discount}% discount`}
                        </p>
                      </div>
                      <button onClick={handleRemoveCoupon} className="text-xs text-emerald-600 dark:text-emerald-300 hover:text-emerald-500">Remove</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input placeholder="Enter code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="h-8 text-xs" />
                      <Button size="sm" onClick={handleApplyCoupon} disabled={applyingCoupon} className="h-8 rounded-lg bg-violet-500 text-xs hover:bg-violet-400">
                        {applyingCoupon ? 'Applying...' : 'Apply'}
                      </Button>
                    </div>
                  )}
                  {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                </div>

                {/* Order Summary */}
                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toFixed(0)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-emerald-600 dark:text-emerald-300">
                        Discount ({appliedCoupon.type === 'flat' ? `₹${appliedCoupon.value} off` : `${appliedCoupon.value || appliedCoupon.discount}%`})
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-300">-₹{discount.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-lg font-semibold">₹{total.toFixed(0)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Taxes and shipping calculated at final checkout.</p>
                  <Button
                    className="mt-3 w-full rounded-full bg-violet-500 text-xs font-semibold text-white hover:bg-violet-400"
                    onClick={handlePlaceOrder} disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Proceed to Payment'}
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
