'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, MapPin, Package, Heart, Settings, Trash2, XCircle } from 'lucide-react'
import AppShell from '../AppShell'

const emptyForm = {
  label: '', name: '', phone: '', line1: '', line2: '',
  city: '', state: '', postalCode: '', country: '', isDefault: false,
}

const ProfilePage = () => {
  const { user, logout, status } = useAuth()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState('account')
  const [addresses, setAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [orders, setOrders] = useState([])
  const [cancellingOrderId, setCancellingOrderId] = useState(null)
  const [wishlist, setWishlist] = useState([])
  const [loadingWishlist, setLoadingWishlist] = useState(false)
  const [preferences, setPreferences] = useState({
    emailNotifications: true, orderUpdates: true, newsletter: false,
    currency: 'USD', language: 'en',
  })

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
  }, [status, router])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoadingAddresses(true); setError('')
      try {
        const [addrRes, ordersRes] = await Promise.all([fetch('/api/addresses'), fetch('/api/orders')])
        if (addrRes.ok) setAddresses(Array.isArray(await addrRes.json()) ? await addrRes.json() : [])
        if (ordersRes.ok) setOrders(Array.isArray(await ordersRes.json()) ? await ordersRes.json() : [])
      } catch (e) {
        console.error(e); setError('Unable to load profile data right now.')
      } finally { setLoadingAddresses(false) }
    }
    load()
    const loadWishlist = async () => {
      setLoadingWishlist(true)
      try { const res = await fetch('/api/wishlist'); if (res.ok) setWishlist(await res.json()) }
      catch {} finally { setLoadingWishlist(false) }
    }
    loadWishlist()
  }, [user])

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))
  const handleCancelOrder = async (orderId) => {
    if (!confirm('Cancel this order? This cannot be undone.')) return
    setCancellingOrderId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: 'PATCH' })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Could not cancel order'); return }
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
    } catch { alert('Something went wrong. Please try again.') }
    finally { setCancellingOrderId(null) }
  }
  const resetForm = () => { setForm(emptyForm); setEditingId(null) }

  const handleEdit = (addr) => {
    setEditingId(addr.id)
    setForm({
      label: addr.label || '', name: addr.name || '', phone: addr.phone || '',
      line1: addr.line1 || '', line2: addr.line2 || '', city: addr.city || '',
      state: addr.state || '', postalCode: addr.postalCode || '',
      country: addr.country || '', isDefault: Boolean(addr.isDefault),
    })
  }

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/addresses/${id}`, { method: 'DELETE' })
      setAddresses((prev) => prev.filter((a) => a.id !== id))
    } catch (e) { console.error('Failed to delete address', e) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.line1 || !form.city || !form.postalCode) { alert('Please fill at least address line 1, city and pincode.'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch(
        editingId ? `/api/addresses/${editingId}` : '/api/addresses',
        { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) },
      )
      if (!res.ok) throw new Error('Failed to save address')
      const saved = await res.json()
      if (editingId) setAddresses((prev) => prev.map((a) => (a.id === saved.id ? saved : a)))
      else setAddresses((prev) => [saved, ...prev])
      resetForm()
    } catch (e) { console.error(e); setError('Unable to save this address right now.') }
    finally { setSaving(false) }
  }

  if (!user) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
          Loading profile...
        </div>
      </AppShell>
    )
  }

  const tabs = [
    { id: 'account', label: 'Account Info', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'preferences', label: 'Preferences', icon: Settings },
  ]

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-500/80">Dashboard</p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your Dracnoir account, addresses, orders, wishlist and preferences.
            </p>
          </div>
          <Button
            variant="outline" size="sm"
            className="rounded-full border-border text-xs hover:bg-muted"
            onClick={() => logout()}
          >
            Logout
          </Button>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-violet-500 text-white'
                    : 'border border-border bg-card/80 text-muted-foreground hover:border-violet-500/50 hover:bg-card'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Account Info */}
          {activeTab === 'account' && (
            <Card className="border border-border bg-card">
              <CardContent className="space-y-4 p-6">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Basic info</p>
                <div className="space-y-3">
                  {[['Name', user.name || 'Otaku'], ['Email', user.email], ['Member Since', new Date().toLocaleDateString()]].map(([label, val]) => (
                    <div key={label}>
                      <Label className="text-xs text-muted-foreground">{label}</Label>
                      <p className="mt-1 text-sm">{val}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Addresses */}
          {activeTab === 'addresses' && (
            <Card className="border border-border bg-card">
              <CardContent className="space-y-3 p-4 text-sm">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Saved addresses</p>
                {loadingAddresses ? (
                  <p className="text-xs text-muted-foreground">Loading addresses...</p>
                ) : addresses.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No addresses yet. Add one below to speed up checkout.</p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="flex items-start justify-between rounded-xl border border-border bg-card/80 px-3 py-2">
                        <div>
                          <p className="font-medium">
                            {addr.label || 'Address'}
                            {addr.isDefault && (
                              <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-300">Default</span>
                            )}
                          </p>
                          <p className="text-muted-foreground">{addr.name} {addr.phone && `• ${addr.phone}`}</p>
                          <p className="text-muted-foreground">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                          <p className="text-muted-foreground">{addr.city}, {addr.state} {addr.postalCode}</p>
                          <p className="text-muted-foreground/60">{addr.country}</p>
                        </div>
                        <div className="ml-3 flex flex-col items-end gap-1">
                          <button type="button" className="text-[11px] text-violet-500 hover:text-violet-400" onClick={() => handleEdit(addr)}>Edit</button>
                          <button type="button" className="text-[11px] text-muted-foreground hover:text-red-500" onClick={() => handleDelete(addr.id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="mt-3 space-y-2 rounded-xl border border-border bg-card/80 p-3 text-xs">
                  <p className="text-[11px] font-medium">{editingId ? 'Edit address' : 'Add new address'}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[['label','Label (Home, Work)'],['name','Name'],['phone','Phone'],['country','Country']].map(([field, ph]) => (
                      <Input key={field} placeholder={ph} value={form[field]} onChange={(e) => handleChange(field, e.target.value)} className="h-8 text-[11px]" />
                    ))}
                    <Input placeholder="Address line 1" value={form.line1} onChange={(e) => handleChange('line1', e.target.value)} className="col-span-2 h-8 text-[11px]" />
                    <Input placeholder="Address line 2 (optional)" value={form.line2} onChange={(e) => handleChange('line2', e.target.value)} className="col-span-2 h-8 text-[11px]" />
                    <Input placeholder="City" value={form.city} onChange={(e) => handleChange('city', e.target.value)} className="h-8 text-[11px]" />
                    <Input placeholder="State" value={form.state} onChange={(e) => handleChange('state', e.target.value)} className="h-8 text-[11px]" />
                    <Input placeholder="Pincode" value={form.postalCode} onChange={(e) => handleChange('postalCode', e.target.value)} className="h-8 text-[11px]" />
                    <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <input type="checkbox" checked={form.isDefault} onChange={handleToggleDefault} className="h-3 w-3 rounded border-border" />
                      Set as default
                    </label>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button type="submit" size="sm" disabled={saving} className="h-7 rounded-full bg-violet-500 text-[11px] font-semibold text-white hover:bg-violet-400">
                      {saving ? 'Saving...' : editingId ? 'Update' : 'Save'}
                    </Button>
                    {editingId && (
                      <button type="button" className="text-[11px] text-muted-foreground hover:text-foreground" onClick={resetForm}>Cancel</button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Orders */}
          {activeTab === 'orders' && (
            <Card className="border border-border bg-card">
              <CardContent className="space-y-3 p-4 text-sm">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Recent orders</p>
                {orders.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No orders yet. They will show up here after you place one.</p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {orders.map((order) => {
                      const cancellable = !['delivered', 'cancelled', 'shipped'].includes(order.status?.toLowerCase())
                      return (
                        <div key={order.id} className="rounded-xl border border-border bg-card/80 px-3 py-2">
                          <div className="flex w-full items-center justify-between">
                            <button
                              type="button"
                              className="flex flex-1 items-center justify-between text-left hover:text-violet-400 transition-colors"
                              onClick={() => router.push(`/orders/${order.id}`)}
                            >
                              <div>
                                <p className="font-medium">#{order.id?.slice?.(-6) || order.id}</p>
                                <p className="text-muted-foreground">{new Date(order.createdAt).toLocaleString()} • {order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'}</p>
                              </div>
                              <p className={`ml-3 font-medium ${order.status === 'cancelled' ? 'text-red-400' : 'text-emerald-500'}`}>
                                {order.status}
                              </p>
                            </button>
                            {cancellable && (
                              <button
                                type="button"
                                disabled={cancellingOrderId === order.id}
                                onClick={() => handleCancelOrder(order.id)}
                                className="ml-3 flex items-center gap-1 rounded-full border border-red-500/40 px-2.5 py-1 text-[10px] font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors flex-shrink-0"
                              >
                                <XCircle className="h-3 w-3" />
                                {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Wishlist */}
          {activeTab === 'wishlist' && (
            <Card className="border border-border bg-card">
              <CardContent className="space-y-3 p-4 text-sm">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Your wishlist</p>
                {loadingWishlist ? (
                  <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                    Loading wishlist...
                  </div>
                ) : wishlist.length === 0 ? (
                  <div className="space-y-2 py-8 text-center">
                    <Heart className="mx-auto h-12 w-12 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">Your wishlist is empty. Browse products and add items you love!</p>
                    <Button size="sm" className="mt-3 rounded-full bg-violet-500 text-xs hover:bg-violet-400" onClick={() => router.push('/products')}>Browse Products</Button>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {wishlist.map((item) => (
                      <div key={item.productId} className="flex gap-3 rounded-xl border border-border bg-card/80 p-3">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="h-20 w-20 rounded-lg object-cover" />
                        ) : (
                          <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                            <Heart className="h-6 w-6 text-muted-foreground/50" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium line-clamp-2">{item.title}</p>
                          <p className="mt-1 text-xs text-violet-500">₹{item.price?.toFixed(0)}</p>
                          <div className="mt-2 flex gap-2">
                            <Button size="sm" className="h-6 rounded-full bg-violet-500 text-[10px] hover:bg-violet-400" onClick={() => router.push(`/product/${item.slug}`)}>View</Button>
                            <button
                              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-red-500"
                              onClick={async () => {
                                try {
                                  await fetch(`/api/wishlist/${item.productId}`, { method: 'DELETE' })
                                  setWishlist((prev) => prev.filter((w) => w.productId !== item.productId))
                                } catch {}
                              }}
                            >
                              <Trash2 className="h-3 w-3" /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Preferences */}
          {activeTab === 'preferences' && (
            <Card className="border border-border bg-card">
              <CardContent className="space-y-4 p-6">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Account preferences</p>
                <div className="space-y-3">
                  <Label className="text-xs font-medium">Notifications</Label>
                  <div className="space-y-2">
                    {[['emailNotifications','Email Notifications'],['orderUpdates','Order Updates'],['newsletter','Newsletter']].map(([field, label]) => (
                      <div key={field} className="flex items-center justify-between">
                        <label className="text-xs text-muted-foreground">{label}</label>
                        <input
                          type="checkbox"
                          checked={preferences[field]}
                          onChange={(e) => setPreferences({ ...preferences, [field]: e.target.checked })}
                          className="h-4 w-4 rounded border-border accent-violet-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-medium">Regional Settings</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Currency</Label>
                      <select
                        value={preferences.currency}
                        onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground"
                      >
                        <option value="INR">INR ₹ - Indian Rupee</option>
                        <option value="USD">USD $ - US Dollar</option>
                        <option value="EUR">EUR € - Euro</option>
                        <option value="GBP">GBP £ - British Pound</option>
                        <option value="JPY">JPY ¥ - Japanese Yen</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Language</Label>
                      <select
                        value={preferences.language}
                        onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground"
                      >
                        <option value="en">English</option>
                        <option value="ja">日本語 (Japanese)</option>
                        <option value="es">Español (Spanish)</option>
                        <option value="fr">Français (French)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <Button className="mt-4 rounded-full bg-violet-500 text-xs hover:bg-violet-400" onClick={() => alert('Preferences saved!')}>
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}

export default ProfilePage
