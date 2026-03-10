'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Package, ShoppingCart, Users, TrendingUp, Plus, Edit, Trash2, Eye,
  Tag, X, Check, ToggleLeft, ToggleRight, ChevronDown,
} from 'lucide-react'
import AppShell from '../AppShell'

const ORDER_STATUSES = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_COLORS = {
  placed: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  confirmed: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
  processing: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  shipped: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  delivered: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  cancelled: 'bg-red-500/10 text-red-300 border-red-500/30',
}

const emptyProduct = {
  title: '', description: '', price: '', categorySlug: 't-shirts',
  type: 'tshirt', material: '', dimensions: '', series: '', images: '', stock: '',
}

const emptyCoupon = {
  code: '', type: 'percentage', value: '', minOrder: '', description: '', expiryDate: '',
}

const AdminDashboard = () => {
  const { user, status } = useAuth()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, totalUsers: 0 })
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCheckDone, setAdminCheckDone] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)

  // Products state
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productForm, setProductForm] = useState(emptyProduct)
  const [productColors, setProductColors] = useState([])
  const [savingProduct, setSavingProduct] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [deletingProductId, setDeletingProductId] = useState(null)

  // Orders state
  const [orderStatusFilter, setOrderStatusFilter] = useState('')
  const [updatingOrderId, setUpdatingOrderId] = useState(null)
  const [expandedOrderId, setExpandedOrderId] = useState(null)

  // Coupons state
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [couponForm, setCouponForm] = useState(emptyCoupon)
  const [savingCoupon, setSavingCoupon] = useState(false)
  const [deletingCouponId, setDeletingCouponId] = useState(null)

  useEffect(() => {
    if (status === 'loading') return
    // Always check admin access - handles both NextAuth sessions AND
    // the cookie-based admin_session from username/password login
    checkAdminAccess()
  }, [status])

  const checkAdminAccess = async () => {
    try {
      const res = await fetch('/api/admin/check')
      const data = await res.json()
      if (data.isAdmin) { setIsAdmin(true); setAdminCheckDone(true); loadData() }
      else { setAccessDenied(true); setAdminCheckDone(true) }
    } catch { setAccessDenied(true); setAdminCheckDone(true) }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [productsRes, ordersRes, usersRes, couponsRes] = await Promise.all([
        fetch('/api/products?limit=200'),
        fetch('/api/admin/orders'),
        fetch('/api/users'),
        fetch('/api/coupons'),
      ])
      if (productsRes.ok) {
        const d = await productsRes.json()
        setProducts(d.items || [])
        setStats(p => ({ ...p, totalProducts: d.total || 0 }))
      }
      if (ordersRes.ok) {
        const d = await ordersRes.json()
        setOrders(d || [])
        const revenue = d.reduce((s, o) => s + (o.subtotal || 0), 0)
        setStats(p => ({ ...p, totalOrders: d.length, totalRevenue: revenue }))
      }
      if (usersRes.ok) {
        const d = await usersRes.json()
        setUsers(d || [])
        setStats(p => ({ ...p, totalUsers: d.length }))
      }
      if (couponsRes.ok) {
        const d = await couponsRes.json()
        setCoupons(d || [])
      }
    } catch (e) { console.error('Failed to load admin data:', e) }
    finally { setLoading(false) }
  }

  const loadOrders = async (statusFilter) => {
    const url = statusFilter ? `/api/admin/orders?status=${statusFilter}` : '/api/admin/orders'
    const res = await fetch(url)
    if (res.ok) setOrders(await res.json())
  }

  // ── Product CRUD ──────────────────────────────────────────────────────────
  const openAddProduct = () => { setProductForm(emptyProduct); setProductColors([]); setEditingProduct(null); setShowProductModal(true) }
  const openEditProduct = (p) => {
    setProductForm({
      title: p.title || '', description: p.description || '',
      price: p.price || '', categorySlug: p.categorySlug || 't-shirts',
      type: p.type || 'tshirt', material: p.material || '',
      dimensions: p.dimensions || '', series: p.series || '',
      images: (p.images || []).join(', '), stock: p.stock || '',
    })
    setProductColors(Array.isArray(p.colors) ? p.colors.map(c => ({
      id: c.id || '',
      name: c.name || '',
      hex: c.hex || '#000000',
      images: Array.isArray(c.images) ? c.images.join(', ') : (c.images || ''),
    })) : [])
    setEditingProduct(p)
    setShowProductModal(true)
  }

  const handleSaveProduct = async () => {
    if (!productForm.title || !productForm.price || !productForm.categorySlug) {
      alert('Title, price, and category are required.')
      return
    }
    setSavingProduct(true)
    try {
      // Serialize colors — convert images string back to array
      const serializedColors = productColors.map(c => ({
        id: c.id || c.name.toLowerCase().replace(/\s+/g, '-'),
        name: c.name,
        hex: c.hex || '#000000',
        images: typeof c.images === 'string'
          ? c.images.split(',').map(s => s.trim()).filter(Boolean)
          : (Array.isArray(c.images) ? c.images : []),
      }))
      const body = {
        ...productForm,
        price: Number(productForm.price),
        stock: Number(productForm.stock) || 0,
        images: productForm.images ? productForm.images.split(',').map(s => s.trim()).filter(Boolean) : [],
        colors: serializedColors,
      }
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products'
      const method = editingProduct ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to save') }
      const saved = await res.json()
      if (editingProduct) setProducts(prev => prev.map(p => p.id === saved.id ? saved : p))
      else setProducts(prev => [saved, ...prev])
      setShowProductModal(false)
      setStats(p => ({ ...p, totalProducts: editingProduct ? p.totalProducts : p.totalProducts + 1 }))
    } catch (e) { alert(e.message || 'Failed to save product') }
    finally { setSavingProduct(false) }
  }

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    setDeletingProductId(productId)
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setProducts(prev => prev.filter(p => p.id !== productId))
      setStats(p => ({ ...p, totalProducts: p.totalProducts - 1 }))
    } catch (e) { alert('Failed to delete product') }
    finally { setDeletingProductId(null) }
  }

  // ── Order management ──────────────────────────────────────────────────────
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed')
      const updated = await res.json()
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: updated.status } : o))
    } catch { alert('Failed to update order status') }
    finally { setUpdatingOrderId(null) }
  }

  // ── Coupon CRUD ───────────────────────────────────────────────────────────
  const handleSaveCoupon = async () => {
    if (!couponForm.code || !couponForm.value) { alert('Code and value are required.'); return }
    setSavingCoupon(true)
    try {
      const body = { ...couponForm, value: Number(couponForm.value), minOrder: Number(couponForm.minOrder) || 0 }
      const res = await fetch('/api/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      const saved = await res.json()
      setCoupons(prev => [saved, ...prev])
      setCouponForm(emptyCoupon)
      setShowCouponModal(false)
    } catch (e) { alert(e.message || 'Failed to create coupon') }
    finally { setSavingCoupon(false) }
  }

  const handleToggleCoupon = async (coupon) => {
    const res = await fetch(`/api/coupons/${coupon.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !coupon.isActive }),
    })
    if (res.ok) {
      const updated = await res.json()
      setCoupons(prev => prev.map(c => c.id === coupon.id ? updated : c))
    }
  }

  const handleDeleteCoupon = async (couponId) => {
    if (!confirm('Delete this coupon?')) return
    setDeletingCouponId(couponId)
    try {
      await fetch(`/api/coupons/${couponId}`, { method: 'DELETE' })
      setCoupons(prev => prev.filter(c => c.id !== couponId))
    } catch { alert('Failed to delete') }
    finally { setDeletingCouponId(null) }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'coupons', label: 'Coupons', icon: Tag },
    { id: 'users', label: 'Users', icon: Users },
  ]

  const filteredProducts = products.filter(p =>
    !productSearch || p.title?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.series?.toLowerCase().includes(productSearch.toLowerCase())
  )

  // ── Guard states ──────────────────────────────────────────────────────────
  if (!adminCheckDone || (status === 'authenticated' && !isAdmin && !accessDenied)) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
            <p className="text-slate-300">Verifying admin access...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  if (accessDenied) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card className="border-red-800/50 bg-red-950/20 p-8 text-center">
            <CardContent>
              <h2 className="mb-2 text-xl font-bold text-red-300">Access Denied</h2>
              <p className="mb-4 text-sm text-slate-300">You don't have permission to access the admin dashboard.</p>
              <Button className="bg-violet-500 hover:bg-violet-400" onClick={() => router.push('/')}>Go to Homepage</Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80">Admin</p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-300">Manage your Dracnoir store</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1 sm:gap-2 rounded-full px-3 sm:px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === id ? 'bg-violet-500 text-white' : 'border border-slate-800 bg-slate-950/80 text-slate-300 hover:border-violet-500/50 hover:bg-slate-900'
              }`}
            >
              <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            Loading...
          </div>
        ) : (
          <>
            {/* ── OVERVIEW ─────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'violet' },
                  { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'emerald' },
                  { label: 'Total Revenue', value: `₹${stats.totalRevenue.toFixed(0)}`, icon: TrendingUp, color: 'amber' },
                  { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <Card key={label} className={`relative overflow-hidden border border-${color}-500/30 bg-gradient-to-br from-${color}-500/20 to-${color === 'violet' ? 'purple' : color === 'emerald' ? 'teal' : color === 'amber' ? 'orange' : 'cyan'}-500/20 backdrop-blur-xl`}>
                    <CardContent className="relative p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-xs text-${color}-200/70`}>{label}</p>
                          <p className={`mt-1 text-2xl font-bold text-${color}-100`}>{value}</p>
                        </div>
                        <div className={`rounded-full bg-${color}-500/20 p-3`}>
                          <Icon className={`h-8 w-8 text-${color}-300`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Card className="border border-slate-800 bg-slate-950/80 sm:col-span-2 lg:col-span-4">
                  <CardContent className="p-6">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Recent Orders</h3>
                    <div className="space-y-2">
                      {orders.slice(0, 5).map(order => (
                        <div key={order.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                          <div>
                            <p className="text-xs font-medium text-slate-100">Order #{order.id?.slice(-6)}</p>
                            <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()} • {order.user?.name || order.user?.email || 'User'}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-semibold text-violet-300">₹{order.subtotal?.toFixed(0)}</p>
                            <span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_COLORS[order.status] || 'bg-slate-500/10 text-slate-300 border-slate-500/30'}`}>{order.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── PRODUCTS ────────────────────────────────────────────── */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="h-8 max-w-xs border-slate-700 bg-slate-900/80 text-xs text-slate-100"
                  />
                  <p className="text-sm text-slate-400">{filteredProducts.length} products</p>
                  <Button size="sm" onClick={openAddProduct}
                    className="ml-auto gap-2 rounded-full bg-violet-500 text-xs hover:bg-violet-400">
                    <Plus className="h-3 w-3" /> Add Product
                  </Button>
                </div>

                <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {filteredProducts.map(product => (
                    <Card key={product.id} className="border border-slate-800 bg-slate-950/80">
                      <CardContent className="p-3">
                        <div className="overflow-hidden rounded-lg bg-slate-900" style={{ aspectRatio: '4/3' }}>
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-slate-600 text-xs">No image</div>
                          )}
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium text-slate-100 line-clamp-1">{product.title}</p>
                          <p className="text-[10px] text-slate-500">{product.series || product.categorySlug}</p>
                          <div className="flex items-center justify-between pt-1">
                            <p className="text-xs font-semibold text-violet-300">₹{product.price?.toFixed(0)}</p>
                            <div className="flex gap-1">
                              <button onClick={() => openEditProduct(product)}
                                className="rounded border border-slate-700 bg-slate-900 p-1 hover:bg-slate-800">
                                <Edit className="h-2.5 w-2.5 text-slate-400" />
                              </button>
                              <button onClick={() => handleDeleteProduct(product.id)} disabled={deletingProductId === product.id}
                                className="rounded border border-slate-700 bg-slate-900 p-1 hover:bg-red-950">
                                <Trash2 className={`h-2.5 w-2.5 ${deletingProductId === product.id ? 'text-slate-600' : 'text-red-400'}`} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ── ORDERS ──────────────────────────────────────────────── */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm text-slate-400">{orders.length} orders</p>
                  <div className="flex flex-wrap gap-2 ml-auto">
                    {['', ...ORDER_STATUSES].map(s => (
                      <button key={s || 'all'} onClick={() => { setOrderStatusFilter(s); loadOrders(s) }}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          orderStatusFilter === s ? 'bg-violet-500 text-white' : 'border border-slate-700 text-slate-400 hover:border-violet-500/50'
                        }`}
                      >
                        {s || 'All'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {orders.map(order => (
                    <Card key={order.id} className="border border-slate-800 bg-slate-950/80">
                      <CardContent className="p-4">
                        <div className="flex flex-wrap items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs font-mono text-slate-300">#{order.id?.slice(-8)}</p>
                              <span className={`rounded-full border px-2 py-0.5 text-[11px] ${STATUS_COLORS[order.status] || 'bg-slate-500/10 text-slate-300 border-slate-500/30'}`}>{order.status}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-400">
                              {new Date(order.createdAt).toLocaleString()} • {order.user?.name || order.user?.email || 'Unknown user'}
                            </p>
                            <p className="text-xs text-slate-500">{order.items?.length || 0} item(s)</p>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <p className="text-sm font-semibold text-slate-100">₹{order.subtotal?.toFixed(0)}</p>
                            <select
                              value={order.status}
                              onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                              disabled={updatingOrderId === order.id}
                              className="h-7 rounded-lg border border-slate-700 bg-slate-900 px-2 text-xs text-slate-200 focus:border-violet-500 focus:outline-none"
                            >
                              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                            </select>
                            <button onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                              className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 hover:bg-slate-800">
                              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expandedOrderId === order.id ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {expandedOrderId === order.id && (
                          <div className="mt-3 border-t border-slate-800 pt-3 space-y-2">
                            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Items</p>
                            {(order.items || []).map(item => (
                              <div key={item.id} className="flex items-center gap-2 text-xs text-slate-300">
                                {item.image && <img src={item.image} alt={item.title} className="h-8 w-8 rounded object-cover" />}
                                <span className="flex-1 truncate">{item.title}</span>
                                <span className="text-slate-500">×{item.quantity}</span>
                                <span className="text-violet-300">₹{item.price?.toFixed(0)}</span>
                              </div>
                            ))}
                            {order.addressSnapshot && (
                              <div className="mt-2 text-[11px] text-slate-400">
                                <p className="font-medium text-slate-300">Shipping to: {order.addressSnapshot.name}</p>
                                <p>{order.addressSnapshot.line1}{order.addressSnapshot.line2 ? `, ${order.addressSnapshot.line2}` : ''}</p>
                                <p>{order.addressSnapshot.city}, {order.addressSnapshot.state} {order.addressSnapshot.postalCode}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {orders.length === 0 && <p className="text-sm text-slate-400">No orders found.</p>}
                </div>
              </div>
            )}

            {/* ── COUPONS ─────────────────────────────────────────────── */}
            {activeTab === 'coupons' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">{coupons.length} coupons</p>
                  <Button size="sm" onClick={() => setShowCouponModal(true)}
                    className="gap-2 rounded-full bg-violet-500 text-xs hover:bg-violet-400">
                    <Plus className="h-3 w-3" /> New Coupon
                  </Button>
                </div>

                <div className="space-y-2">
                  {coupons.map(coupon => (
                    <Card key={coupon.id} className="border border-slate-800 bg-slate-950/80">
                      <CardContent className="p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-bold text-slate-50">{coupon.code}</span>
                              <span className={`rounded-full border px-2 py-0.5 text-[11px] ${coupon.isActive ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-slate-700/40 text-slate-500 border-slate-700'}`}>
                                {coupon.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-300 border border-violet-500/20">
                                {coupon.type === 'percentage' ? `${coupon.value}% off` : `₹${coupon.value} off`}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-400">{coupon.description}</p>
                            <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-500">
                              {coupon.minOrder > 0 && <span>Min order: ₹{coupon.minOrder}</span>}
                              {coupon.expiryDate && <span>Expires: {new Date(coupon.expiryDate).toLocaleDateString()}</span>}
                              <span>Used {coupon.usageCount || 0} times</span>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => handleToggleCoupon(coupon)}
                              className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 hover:bg-slate-800"
                              title={coupon.isActive ? 'Deactivate' : 'Activate'}>
                              {coupon.isActive
                                ? <ToggleRight className="h-4 w-4 text-emerald-400" />
                                : <ToggleLeft className="h-4 w-4 text-slate-500" />
                              }
                            </button>
                            <button onClick={() => handleDeleteCoupon(coupon.id)} disabled={deletingCouponId === coupon.id}
                              className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 hover:bg-red-950">
                              <Trash2 className={`h-3.5 w-3.5 ${deletingCouponId === coupon.id ? 'text-slate-600' : 'text-red-400'}`} />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {coupons.length === 0 && <p className="text-sm text-slate-400">No coupons yet. Create one!</p>}
                </div>
              </div>
            )}

            {/* ── USERS ───────────────────────────────────────────────── */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">{users.length} registered users</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {users.map(u => (
                    <Card key={u.id || u.email} className="border border-slate-800 bg-slate-950/80">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {u.image ? (
                            <img src={u.image} alt={u.name} className="h-12 w-12 rounded-full border border-slate-700" />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-sm font-semibold text-slate-400">
                              {u.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-100 truncate">{u.name || 'Anonymous'}</p>
                            <p className="text-xs text-slate-400 truncate">{u.email}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-violet-300">{u.orderCount || 0} orders</span>
                              {u.totalSpent > 0 && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-300">₹{u.totalSpent.toFixed(0)}</span>}
                            </div>
                            <p className="mt-2 text-[11px] text-slate-500">Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── PRODUCT MODAL ───────────────────────────────────────────────────── */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h2 className="text-sm font-semibold text-slate-100">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label className="text-xs text-slate-400">Title *</Label>
                  <Input value={productForm.title} onChange={e => setProductForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Dragon Ball Goku Figure" className="mt-1 h-9 border-slate-700 bg-slate-900 text-xs text-slate-100" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs text-slate-400">Description</Label>
                  <textarea value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Product description..." rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none" />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Price (₹) *</Label>
                  <Input type="number" value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))}
                    placeholder="2999" className="mt-1 h-9 border-slate-700 bg-slate-900 text-xs text-slate-100" />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Stock</Label>
                  <Input type="number" value={productForm.stock} onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))}
                    placeholder="50" className="mt-1 h-9 border-slate-700 bg-slate-900 text-xs text-slate-100" />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Category *</Label>
                  <select value={productForm.categorySlug} onChange={e => setProductForm(p => ({ ...p, categorySlug: e.target.value }))}
                    className="mt-1 w-full h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs text-slate-100 focus:border-violet-500 focus:outline-none">
                    <option value="t-shirts">T-Shirts</option>
                    <option value="plushes">Plushes</option>
                    <option value="action-figures">Action Figures</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Type</Label>
                  <select value={productForm.type} onChange={e => setProductForm(p => ({ ...p, type: e.target.value }))}
                    className="mt-1 w-full h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs text-slate-100 focus:border-violet-500 focus:outline-none">
                    <option value="tshirt">T-Shirt</option>
                    <option value="plush">Plush</option>
                    <option value="action-figure">Action Figure</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Series / Anime</Label>
                  <Input value={productForm.series} onChange={e => setProductForm(p => ({ ...p, series: e.target.value }))}
                    placeholder="e.g. Dragon Ball Z" className="mt-1 h-9 border-slate-700 bg-slate-900 text-xs text-slate-100" />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Material</Label>
                  <Input value={productForm.material} onChange={e => setProductForm(p => ({ ...p, material: e.target.value }))}
                    placeholder="e.g. 100% Cotton" className="mt-1 h-9 border-slate-700 bg-slate-900 text-xs text-slate-100" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs text-slate-400">Image URLs (comma-separated)</Label>
                  <Input value={productForm.images} onChange={e => setProductForm(p => ({ ...p, images: e.target.value }))}
                    placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                    className="mt-1 h-9 border-slate-700 bg-slate-900 text-xs text-slate-100" />
                  <p className="mt-1 text-[11px] text-slate-500">Paste image URLs. Multiple URLs separated by commas.</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Dimensions</Label>
                  <Input value={productForm.dimensions} onChange={e => setProductForm(p => ({ ...p, dimensions: e.target.value }))}
                    placeholder="e.g. 25cm x 15cm" className="mt-1 h-9 border-slate-700 bg-slate-900 text-xs text-slate-100" />
                </div>
              </div>

              {/* ── COLORS SECTION (T-Shirts only) ─────────────────────── */}
              {productForm.type === 'tshirt' && (
                <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Colors
                    </Label>
                    <button
                      type="button"
                      onClick={() => setProductColors(prev => [...prev, { id: '', name: '', hex: '#000000', images: '' }])}
                      className="flex items-center gap-1 rounded-full border border-violet-500/50 bg-violet-500/10 px-2.5 py-1 text-[11px] text-violet-300 hover:bg-violet-500/20"
                    >
                      <Plus className="h-3 w-3" /> Add Color
                    </button>
                  </div>

                  {productColors.length === 0 && (
                    <p className="text-[11px] text-slate-500">No colors added. Click "Add Color" to define colors for this T-shirt.</p>
                  )}

                  <div className="space-y-3">
                    {productColors.map((c, idx) => (
                      <div key={idx} className="relative rounded-lg border border-slate-700 bg-slate-900 p-3">
                        <button
                          type="button"
                          onClick={() => setProductColors(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute right-2 top-2 text-slate-500 hover:text-red-400"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>

                        <div className="grid gap-2 sm:grid-cols-3 pr-5">
                          <div>
                            <Label className="text-[10px] text-slate-500">Color Name *</Label>
                            <Input
                              value={c.name}
                              onChange={e => {
                                const name = e.target.value
                                setProductColors(prev => prev.map((item, i) => i === idx ? {
                                  ...item,
                                  name,
                                  id: name.toLowerCase().replace(/\s+/g, '-'),
                                } : item))
                              }}
                              placeholder="e.g. Black"
                              className="mt-1 h-8 border-slate-700 bg-slate-950 text-xs text-slate-100"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-slate-500">Hex Color</Label>
                            <div className="mt-1 flex gap-1.5">
                              <input
                                type="color"
                                value={c.hex || '#000000'}
                                onChange={e => setProductColors(prev => prev.map((item, i) => i === idx ? { ...item, hex: e.target.value } : item))}
                                className="h-8 w-8 cursor-pointer rounded border border-slate-700 bg-slate-950 p-0.5"
                              />
                              <Input
                                value={c.hex || '#000000'}
                                onChange={e => setProductColors(prev => prev.map((item, i) => i === idx ? { ...item, hex: e.target.value } : item))}
                                placeholder="#000000"
                                className="h-8 flex-1 border-slate-700 bg-slate-950 font-mono text-[11px] text-slate-100"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-[10px] text-slate-500">ID (auto)</Label>
                            <Input
                              value={c.id}
                              onChange={e => setProductColors(prev => prev.map((item, i) => i === idx ? { ...item, id: e.target.value } : item))}
                              placeholder="e.g. black"
                              className="mt-1 h-8 border-slate-700 bg-slate-950 font-mono text-[11px] text-slate-500"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <Label className="text-[10px] text-slate-500">Image URLs for this color (comma-separated)</Label>
                            <Input
                              value={c.images}
                              onChange={e => setProductColors(prev => prev.map((item, i) => i === idx ? { ...item, images: e.target.value } : item))}
                              placeholder="https://res.cloudinary.com/.../black-front.jpg, https://..."
                              className="mt-1 h-8 border-slate-700 bg-slate-950 text-[11px] text-slate-100"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 border-t border-slate-800 px-6 py-4">
              <Button onClick={handleSaveProduct} disabled={savingProduct}
                className="flex-1 rounded-full bg-violet-500 text-xs hover:bg-violet-400">
                {savingProduct ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
              </Button>
              <Button variant="outline" onClick={() => setShowProductModal(false)}
                className="rounded-full border-slate-700 text-xs text-slate-300">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── COUPON MODAL ────────────────────────────────────────────────────── */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h2 className="text-sm font-semibold text-slate-100">Create Coupon</h2>
              <button onClick={() => setShowCouponModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label className="text-xs text-slate-400">Coupon Code *</Label>
                  <Input value={couponForm.code} onChange={e => setCouponForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. SAVE100" className="mt-1 h-9 border-slate-700 bg-slate-900 font-mono text-xs uppercase text-slate-100" />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Discount Type *</Label>
                  <select value={couponForm.type} onChange={e => setCouponForm(p => ({ ...p, type: e.target.value }))}
                    className="mt-1 w-full h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs text-slate-100 focus:border-violet-500 focus:outline-none">
                    <option value="percentage">Percentage (% off)</option>
                    <option value="flat">Flat Amount (₹ off)</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-slate-400">{couponForm.type === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'} *</Label>
                  <Input type="number" value={couponForm.value} onChange={e => setCouponForm(p => ({ ...p, value: e.target.value }))}
                    placeholder={couponForm.type === 'percentage' ? '10' : '200'}
                    className="mt-1 h-9 border-slate-700 bg-slate-900 text-xs text-slate-100" />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Min Order Amount (₹)</Label>
                  <Input type="number" value={couponForm.minOrder} onChange={e => setCouponForm(p => ({ ...p, minOrder: e.target.value }))}
                    placeholder="0" className="mt-1 h-9 border-slate-700 bg-slate-900 text-xs text-slate-100" />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Expiry Date (optional)</Label>
                  <Input type="date" value={couponForm.expiryDate} onChange={e => setCouponForm(p => ({ ...p, expiryDate: e.target.value }))}
                    className="mt-1 h-9 border-slate-700 bg-slate-900 text-xs text-slate-100" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs text-slate-400">Description</Label>
                  <Input value={couponForm.description} onChange={e => setCouponForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="e.g. 10% off sitewide" className="mt-1 h-9 border-slate-700 bg-slate-900 text-xs text-slate-100" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 border-t border-slate-800 px-6 py-4">
              <Button onClick={handleSaveCoupon} disabled={savingCoupon}
                className="flex-1 rounded-full bg-violet-500 text-xs hover:bg-violet-400">
                {savingCoupon ? 'Creating...' : 'Create Coupon'}
              </Button>
              <Button variant="outline" onClick={() => setShowCouponModal(false)}
                className="rounded-full border-slate-700 text-xs text-slate-300">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

export default AdminDashboard
