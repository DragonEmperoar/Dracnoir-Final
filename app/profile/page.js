'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, MapPin, Package, Heart, Settings, Trash2 } from 'lucide-react'
import AppShell from '../AppShell'

const emptyForm = {
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
  const [wishlist, setWishlist] = useState([])
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    orderUpdates: true,
    newsletter: false,
    currency: 'USD',
    language: 'en',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoadingAddresses(true)
      setError('')
      try {
        const [addrRes, ordersRes] = await Promise.all([
          fetch('/api/addresses'),
          fetch('/api/orders'),
        ])
        if (addrRes.ok) {
          const addrData = await addrRes.json()
          setAddresses(Array.isArray(addrData) ? addrData : [])
        }
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json()
          setOrders(Array.isArray(ordersData) ? ordersData : [])
        }
      } catch (e) {
        console.error(e)
        setError('Unable to load profile data right now.')
      } finally {
        setLoadingAddresses(false)
      }
    }
    load()
  }, [user])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleToggleDefault = () => {
    setForm((prev) => ({ ...prev, isDefault: !prev.isDefault }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleEdit = (addr) => {
    setEditingId(addr.id)
    setForm({
      label: addr.label || '',
      name: addr.name || '',
      phone: addr.phone || '',
      line1: addr.line1 || '',
      line2: addr.line2 || '',
      city: addr.city || '',
      state: addr.state || '',
      postalCode: addr.postalCode || '',
      country: addr.country || '',
      isDefault: Boolean(addr.isDefault),
    })
  }

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
      })
      setAddresses((prev) => prev.filter((a) => a.id !== id))
    } catch (e) {
      console.error('Failed to delete address', e)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.line1 || !form.city || !form.postalCode) {
      alert('Please fill at least address line 1, city and pincode.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
      }
      const res = await fetch(
        editingId ? `/api/addresses/${editingId}` : '/api/addresses',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )
      if (!res.ok) {
        throw new Error('Failed to save address')
      }
      const saved = await res.json()
      if (editingId) {
        setAddresses((prev) =>
          prev.map((a) => (a.id === saved.id ? saved : a)),
        )
      } else {
        setAddresses((prev) => [saved, ...prev])
      }
      resetForm()
    } catch (e) {
      console.error(e)
      setError('Unable to save this address right now.')
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center text-slate-200">
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
            <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80">Dashboard</p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Profile</h1>
            <p className="mt-1 text-sm text-slate-300">
              Manage your Dracnoir account, addresses, orders, wishlist and preferences.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-slate-700 bg-slate-900/80 text-xs text-slate-100 hover:bg-slate-800"
            onClick={() => logout()}
          >
            Logout
          </Button>
        </div>

        {error && (
          <p className="text-xs text-red-300">{error}</p>
        )}

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
                    : 'border border-slate-800 bg-slate-950/80 text-slate-300 hover:border-violet-500/50 hover:bg-slate-900'
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
          {/* Account Info Tab */}
          {activeTab === 'account' && (
            <Card className="border border-slate-800 bg-slate-950/80">
              <CardContent className="space-y-4 p-6">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  Basic info
                </p>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-slate-400">Name</Label>
                    <p className="mt-1 text-sm text-slate-100">{user.name || 'Otaku'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Email</Label>
                    <p className="mt-1 text-sm text-slate-100">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Member Since</Label>
                    <p className="mt-1 text-sm text-slate-100">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <Card className="border border-slate-800 bg-slate-950/80">
              <CardContent className="space-y-3 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    Saved addresses
                  </p>
                </div>
              {loadingAddresses ? (
                <p className="text-xs text-slate-400">Loading addresses...</p>
              ) : addresses.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No addresses yet. Add one below to speed up checkout.
                </p>
              ) : (
                <div className="space-y-2 text-xs text-slate-200">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="flex items-start justify-between rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-slate-100">
                          {addr.label || 'Address'}
                          {addr.isDefault && (
                            <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                              Default
                            </span>
                          )}
                        </p>
                        <p className="text-slate-300">
                          {addr.name} {addr.phone && `• ${addr.phone}`}
                        </p>
                        <p className="text-slate-400">
                          {addr.line1}
                          {addr.line2 ? `, ${addr.line2}` : ''}
                        </p>
                        <p className="text-slate-400">
                          {addr.city}, {addr.state} {addr.postalCode}
                        </p>
                        <p className="text-slate-500">{addr.country}</p>
                      </div>
                      <div className="ml-3 flex flex-col items-end gap-1">
                        <button
                          type="button"
                          className="text-[11px] text-violet-300 hover:text-violet-200"
                          onClick={() => handleEdit(addr)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-[11px] text-slate-400 hover:text-red-300"
                          onClick={() => handleDelete(addr.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Address form */}
              <form
                onSubmit={handleSubmit}
                className="mt-3 space-y-2 rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs"
              >
                <p className="text-[11px] font-medium text-slate-200">
                  {editingId ? 'Edit address' : 'Add new address'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Label (Home, Work)"
                    value={form.label}
                    onChange={(e) => handleChange('label', e.target.value)}
                    className="h-8 border-slate-700 bg-slate-900/80 text-[11px]"
                  />
                  <Input
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="h-8 border-slate-700 bg-slate-900/80 text-[11px]"
                  />
                  <Input
                    placeholder="Phone"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="h-8 border-slate-700 bg-slate-900/80 text-[11px]"
                  />
                  <Input
                    placeholder="Country"
                    value={form.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    className="h-8 border-slate-700 bg-slate-900/80 text-[11px]"
                  />
                  <Input
                    placeholder="Address line 1"
                    value={form.line1}
                    onChange={(e) => handleChange('line1', e.target.value)}
                    className="col-span-2 h-8 border-slate-700 bg-slate-900/80 text-[11px]"
                  />
                  <Input
                    placeholder="Address line 2 (optional)"
                    value={form.line2}
                    onChange={(e) => handleChange('line2', e.target.value)}
                    className="col-span-2 h-8 border-slate-700 bg-slate-900/80 text-[11px]"
                  />
                  <Input
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="h-8 border-slate-700 bg-slate-900/80 text-[11px]"
                  />
                  <Input
                    placeholder="State"
                    value={form.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="h-8 border-slate-700 bg-slate-900/80 text-[11px]"
                  />
                  <Input
                    placeholder="Pincode"
                    value={form.postalCode}
                    onChange={(e) => handleChange('postalCode', e.target.value)}
                    className="h-8 border-slate-700 bg-slate-900/80 text-[11px]"
                  />
                  <label className="flex items-center gap-2 text-[11px] text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.isDefault}
                      onChange={handleToggleDefault}
                      className="h-3 w-3 rounded border-slate-700 bg-slate-900"
                    />
                    Set as default
                  </label>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={saving}
                    className="h-7 rounded-full bg-violet-500 text-[11px] font-semibold text-white hover:bg-violet-400"
                  >
                    {saving ? 'Saving...' : editingId ? 'Update' : 'Save'}
                  </Button>
                  {editingId && (
                    <button
                      type="button"
                      className="text-[11px] text-slate-400 hover:text-slate-200"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </CardContent>
            </Card>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <Card className="border border-slate-800 bg-slate-950/80">
              <CardContent className="space-y-3 p-4 text-sm">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  Recent orders
                </p>
                {orders.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No orders yet. They will show up here after you place one.
                  </p>
                ) : (
                  <div className="space-y-2 text-xs text-slate-200">
                    {orders.map((order) => (
                      <button
                        key={order.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-left hover:border-violet-500/70"
                        onClick={() => router.push(`/orders/${order.id}`)}
                      >
                        <div>
                          <p className="font-medium text-slate-100">
                            #{order.id?.slice?.(-6) || order.id}
                          </p>
                          <p className="text-slate-400">
                            {new Date(order.createdAt).toLocaleString()} •{' '}
                            {order.items?.length || 0} item
                            {order.items?.length === 1 ? '' : 's'}
                          </p>
                        </div>
                        <p className="text-emerald-300">{order.status}</p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <Card className="border border-slate-800 bg-slate-950/80">
              <CardContent className="space-y-3 p-4 text-sm">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  Your wishlist
                </p>
                {wishlist.length === 0 ? (
                  <div className="space-y-2 py-8 text-center">
                    <Heart className="mx-auto h-12 w-12 text-slate-700" />
                    <p className="text-xs text-slate-400">
                      Your wishlist is empty. Browse products and add items you love!
                    </p>
                    <Button
                      size="sm"
                      className="mt-3 rounded-full bg-violet-500 text-xs hover:bg-violet-400"
                      onClick={() => router.push('/products')}
                    >
                      Browse Products
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {wishlist.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3"
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-100">{item.title}</p>
                          <p className="mt-1 text-xs text-violet-300">${item.price}</p>
                          <div className="mt-2 flex gap-2">
                            <Button
                              size="sm"
                              className="h-6 rounded-full bg-violet-500 text-[10px] hover:bg-violet-400"
                              onClick={() => router.push(`/product/${item.slug}`)}
                            >
                              View
                            </Button>
                            <button
                              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-300"
                              onClick={() => setWishlist((prev) => prev.filter((w) => w.id !== item.id))}
                            >
                              <Trash2 className="h-3 w-3" />
                              Remove
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

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <Card className="border border-slate-800 bg-slate-950/80">
              <CardContent className="space-y-4 p-6">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  Account preferences
                </p>

                {/* Notification Settings */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-slate-300">Notifications</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-400">Email Notifications</label>
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications}
                        onChange={(e) =>
                          setPreferences({ ...preferences, emailNotifications: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-violet-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-400">Order Updates</label>
                      <input
                        type="checkbox"
                        checked={preferences.orderUpdates}
                        onChange={(e) =>
                          setPreferences({ ...preferences, orderUpdates: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-violet-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-400">Newsletter</label>
                      <input
                        type="checkbox"
                        checked={preferences.newsletter}
                        onChange={(e) =>
                          setPreferences({ ...preferences, newsletter: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-violet-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Regional Settings */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-slate-300">Regional Settings</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">Currency</Label>
                      <select
                        value={preferences.currency}
                        onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="JPY">JPY - Japanese Yen</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">Language</Label>
                      <select
                        value={preferences.language}
                        onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100"
                      >
                        <option value="en">English</option>
                        <option value="ja">日本語 (Japanese)</option>
                        <option value="es">Español (Spanish)</option>
                        <option value="fr">Français (French)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <Button
                  className="mt-4 rounded-full bg-violet-500 text-xs hover:bg-violet-400"
                  onClick={() => alert('Preferences saved! (This is a demo - actual backend saving will be implemented later)')}
                >
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
