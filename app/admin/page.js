'use client'

import { useEffect, useRef, useState } from 'react'
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
  title: '', description: '', price: '799', categorySlug: 't-shirts',
  type: 'tshirt', material: '240 GSM French Terry Cotton', dimensions: '', series: '', images: '', stock: '', subcategory: '', imagePositions: [],
}

// Smart defaults per category
const CATEGORY_DEFAULTS = {
  't-shirts':       { type: 'tshirt',        material: '240 GSM French Terry Cotton', price: '799', dimensions: '' },
  'plushes':        { type: 'plush',          material: 'Cotton',                      price: '',    dimensions: '' },
  'action-figures': { type: 'action-figure',  material: '',                            price: '',    dimensions: '' },
}

const emptyCoupon = {
  code: '', type: 'percentage', value: '', minOrder: '', description: '', expiryDate: '',
}

const COLOR_PRESET = [
  { id: 'black',    name: 'Black',    hex: '#000000', images: '' },
  { id: 'white',    name: 'White',    hex: '#FFFFFF', images: '' },
  { id: 'peach',    name: 'Peach',    hex: '#FF9899', images: '' },
  { id: 'mustard',  name: 'Mustard',  hex: '#90760E', images: '' },
  { id: 'olive',    name: 'Olive',    hex: '#000D03', images: '' },
  { id: 'wine',     name: 'Wine',     hex: '#280101', images: '' },
  { id: 'beige',    name: 'Beige',    hex: '#9A8753', images: '' },
  { id: 'brown',    name: 'Brown',    hex: '#251700', images: '' },
  { id: 'lavender', name: 'Lavender', hex: '#A363DA', images: '' },
  { id: 'blue',     name: 'Blue',     hex: '#001849', images: '' },
]

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
  const [deduplicating, setDeduplicating] = useState(false)
  const [productCategoryFilter, setProductCategoryFilter] = useState('')
  const [pickerIndex, setPickerIndex] = useState(0)

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
        fetch('/api/products?limit=1000'),
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
  const openAddProduct = () => {
    setProductForm(emptyProduct)
    // Auto-load color preset for t-shirts (default category)
    setProductColors(COLOR_PRESET.map(c => ({ ...c })))
    setEditingProduct(null)
    setShowProductModal(true)
    setPickerIndex(0)
  }
  const openEditProduct = (p) => {
    setProductForm({
      title: p.title || '', description: p.description || '',
      price: p.price || '', categorySlug: p.categorySlug || 't-shirts',
      type: p.type || 'tshirt', material: p.material || '',
      dimensions: p.dimensions || '', series: p.series || '',
      images: (p.images || []).join(', '), stock: p.stock || '',
      subcategory: p.subcategory || '',
      imagePositions: p.imagePositions || (p.imagePosition ? [p.imagePosition] : []),
    })
    setProductColors(Array.isArray(p.colors) ? p.colors.map(c => ({
      id: c.id || '',
      name: c.name || '',
      hex: c.hex || '#000000',
      images: Array.isArray(c.images) ? c.images.join(', ') : (c.images || ''),
    })) : [])
    setEditingProduct(p)
    setShowProductModal(true)
    setPickerIndex(0)
  }

  // When category changes, auto-apply smart defaults for material, type, price
  const handleCategoryChange = (newCategorySlug) => {
    const defaults = CATEGORY_DEFAULTS[newCategorySlug] || {}
    setProductForm(prev => ({
      ...prev,
      categorySlug: newCategorySlug,
      type: defaults.type || prev.type,
      material: defaults.material !== undefined ? defaults.material : prev.material,
      price: 'price' in defaults ? defaults.price : prev.price,
      dimensions: defaults.dimensions !== undefined ? defaults.dimensions : prev.dimensions,
      subcategory: '',
    }))
    // Auto-load preset colors only for t-shirts
    if (newCategorySlug === 't-shirts' && productColors.length === 0) {
      setProductColors(COLOR_PRESET.map(c => ({ ...c })))
    } else if (newCategorySlug !== 't-shirts') {
      setProductColors([])
    }
  }

  const isSavingRef = useRef(false)

  const handleSaveProduct = async () => {
    if (isSavingRef.current) return          // immediate ref-based guard (before React state update)
    if (!productForm.title || !productForm.price || !productForm.categorySlug) {
      alert('Title, price, and category are required.')
      return
    }
    isSavingRef.current = true
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
        imagePositions: productForm.imagePositions || [],
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
    finally { isSavingRef.current = false; setSavingProduct(false) }
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

  const handleDeduplicateProducts = async () => {
    if (!confirm('This will remove duplicate products (same name + category), keeping the oldest entry. Continue?')) return
    setDeduplicating(true)
    try {
      const res = await fetch('/api/admin/products/deduplicate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      alert(data.message || `Removed ${data.removed} duplicate products`)
      // Reload products after dedup
      const productsRes = await fetch('/api/products?limit=1000')
      if (productsRes.ok) {
        const d = await productsRes.json()
        setProducts(d.items || [])
        setStats(p => ({ ...p, totalProducts: d.total || 0 }))
      }
    } catch (e) { alert(e.message || 'Deduplication failed') }
    finally { setDeduplicating(false) }
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

  const filteredProducts = products.filter(p => {
    const matchesSearch = !productSearch || p.title?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.series?.toLowerCase().includes(productSearch.toLowerCase())
    const matchesCategory = !productCategoryFilter || p.categorySlug === productCategoryFilter
    return matchesSearch && matchesCategory
  })

  // ── Guard states ──────────────────────────────────────────────────────────
  if (!adminCheckDone || (status === 'authenticated' && !isAdmin && !accessDenied)) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
            <p className="text-foreground/70">Verifying admin access...</p>
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
              <p className="mb-4 text-sm text-foreground/70">You don't have permission to access the admin dashboard.</p>
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
          <p className="text-xs uppercase tracking-[0.2em] text-violet-500/80">Admin</p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your Dracnoir store</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1 sm:gap-2 rounded-full px-3 sm:px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === id ? 'bg-violet-500 text-white' : 'border border-border bg-card/80 text-foreground/70 hover:border-violet-500/50 hover:bg-muted'
              }`}
            >
              <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                          <p className={`text-xs text-${color}-400/70`}>{label}</p>
                          <p className={`mt-1 text-2xl font-bold text-${color}-400`}>{value}</p>
                        </div>
                        <div className={`rounded-full bg-${color}-500/20 p-3`}>
                          <Icon className={`h-8 w-8 text-${color}-400`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Card className="border border-border bg-card sm:col-span-2 lg:col-span-4">
                  <CardContent className="p-6">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Recent Orders</h3>
                    <div className="space-y-2">
                      {orders.slice(0, 5).map(order => (
                        <div key={order.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
                          <div>
                            <p className="text-xs font-medium text-foreground">Order #{order.id?.slice(-6)}</p>
                            <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()} • {order.user?.name || order.user?.email || order.addressSnapshot?.name || 'User'}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-semibold text-violet-500">₹{order.subtotal?.toFixed(0)}</p>
                            <span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_COLORS[order.status] || 'bg-muted text-muted-foreground border-border'}`}>{order.status}</span>
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
                    className="h-8 max-w-xs border-border bg-card/80 text-xs text-foreground"
                  />
                  <select
                    value={productCategoryFilter}
                    onChange={e => setProductCategoryFilter(e.target.value)}
                    className="h-8 rounded-md border border-border bg-card/80 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="">All categories</option>
                    <option value="plushes">Plushes</option>
                    <option value="t-shirts">T-Shirts</option>
                    <option value="action-figures">Action Figures</option>
                  </select>
                  <p className="text-sm text-muted-foreground">{filteredProducts.length} / {products.length} products</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDeduplicateProducts}
                    disabled={deduplicating}
                    className="gap-2 rounded-full border-amber-500/50 text-xs text-amber-500 hover:bg-amber-500/10"
                  >
                    {deduplicating ? 'Removing...' : 'Remove Duplicates'}
                  </Button>
                  <Button size="sm" onClick={openAddProduct}
                    className="ml-auto gap-2 rounded-full bg-violet-500 text-xs hover:bg-violet-400">
                    <Plus className="h-3 w-3" /> Add Product
                  </Button>
                </div>

                <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {filteredProducts.map(product => (
                    <Card key={product.id} className="border border-border bg-card">
                      <CardContent className="p-3">
                        <div className="overflow-hidden rounded-lg bg-muted" style={{ aspectRatio: '4/3' }}>
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground text-xs">No image</div>
                          )}
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium text-foreground line-clamp-1">{product.title}</p>
                          <p className="text-[10px] text-muted-foreground">{product.series || product.categorySlug}</p>
                          <div className="flex items-center justify-between pt-1">
                            <div>
                              <p className="text-xs font-semibold text-violet-500">₹{product.price?.toFixed(0)}</p>
                              <p className={`text-[10px] font-medium ${product.stock === 0 ? 'text-red-400' : product.stock <= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {product.stock === 0 ? 'Out of stock' : product.stock <= 5 ? `Only ${product.stock} left` : `Stock: ${product.stock}`}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => openEditProduct(product)}
                                className="rounded border border-border bg-muted p-1 hover:bg-muted/80">
                                <Edit className="h-2.5 w-2.5 text-muted-foreground" />
                              </button>
                              <button onClick={() => handleDeleteProduct(product.id)} disabled={deletingProductId === product.id}
                                className="rounded border border-border bg-muted p-1 hover:bg-red-950/40">
                                <Trash2 className={`h-2.5 w-2.5 ${deletingProductId === product.id ? 'text-muted-foreground' : 'text-red-400'}`} />
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
                  <p className="text-sm text-muted-foreground">{orders.length} orders</p>
                  <div className="flex flex-wrap gap-2 ml-auto">
                    {['', ...ORDER_STATUSES].map(s => (
                      <button key={s || 'all'} onClick={() => { setOrderStatusFilter(s); loadOrders(s) }}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          orderStatusFilter === s ? 'bg-violet-500 text-white' : 'border border-border text-muted-foreground hover:border-violet-500/50'
                        }`}
                      >
                        {s || 'All'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {orders.map(order => (
                    <Card key={order.id} className="border border-border bg-card">
                      <CardContent className="p-4">
                        <div className="flex flex-wrap items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs font-mono text-foreground/80">#{order.id?.slice(-8)}</p>
                              <span className={`rounded-full border px-2 py-0.5 text-[11px] ${STATUS_COLORS[order.status] || 'bg-muted text-muted-foreground border-border'}`}>{order.status}</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleString()} • {order.user?.name || order.user?.email || order.addressSnapshot?.name || 'Unknown user'}
                            </p>
                            <p className="text-xs text-muted-foreground/70">{order.items?.length || 0} item(s)</p>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <p className="text-sm font-semibold text-foreground">₹{order.subtotal?.toFixed(0)}</p>
                            <select
                              value={order.status}
                              onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                              disabled={updatingOrderId === order.id}
                              className="h-7 rounded-lg border border-border bg-card px-2 text-xs text-foreground focus:border-violet-500 focus:outline-none"
                            >
                              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                            </select>
                            <button onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                              className="rounded-lg border border-border bg-muted p-1.5 hover:bg-muted/80">
                              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedOrderId === order.id ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {expandedOrderId === order.id && (
                          <div className="mt-3 border-t border-border pt-3 space-y-2">
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Items</p>
                            {(order.items || []).map(item => (
                              <div key={item.id} className="flex items-center gap-2 text-xs text-foreground/80">
                                {item.image && <img src={item.image} alt={item.title} className="h-8 w-8 rounded object-cover" />}
                                <span className="flex-1 truncate">{item.title}</span>
                                <span className="text-muted-foreground">×{item.quantity}</span>
                                <span className="text-violet-500">₹{item.price?.toFixed(0)}</span>
                              </div>
                            ))}
                            {order.addressSnapshot && (
                              <div className="mt-2 text-[11px] text-muted-foreground">
                                <p className="font-medium text-foreground/80">Shipping to: {order.addressSnapshot.name}</p>
                                <p>{order.addressSnapshot.line1}{order.addressSnapshot.line2 ? `, ${order.addressSnapshot.line2}` : ''}</p>
                                <p>{order.addressSnapshot.city}, {order.addressSnapshot.state} {order.addressSnapshot.postalCode}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {orders.length === 0 && <p className="text-sm text-muted-foreground">No orders found.</p>}
                </div>
              </div>
            )}

            {/* ── COUPONS ─────────────────────────────────────────────── */}
            {activeTab === 'coupons' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{coupons.length} coupons</p>
                  <Button size="sm" onClick={() => setShowCouponModal(true)}
                    className="gap-2 rounded-full bg-violet-500 text-xs hover:bg-violet-400">
                    <Plus className="h-3 w-3" /> New Coupon
                  </Button>
                </div>

                <div className="space-y-2">
                  {coupons.map(coupon => (
                    <Card key={coupon.id} className="border border-border bg-card">
                      <CardContent className="p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-bold text-foreground">{coupon.code}</span>
                              <span className={`rounded-full border px-2 py-0.5 text-[11px] ${coupon.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-muted text-muted-foreground border-border'}`}>
                                {coupon.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-500 border border-violet-500/20">
                                {coupon.type === 'percentage' ? `${coupon.value}% off` : `₹${coupon.value} off`}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{coupon.description}</p>
                            <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground/70">
                              {coupon.minOrder > 0 && <span>Min order: ₹{coupon.minOrder}</span>}
                              {coupon.expiryDate && <span>Expires: {new Date(coupon.expiryDate).toLocaleDateString()}</span>}
                              <span>Used {coupon.usageCount || 0} times</span>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => handleToggleCoupon(coupon)}
                              className="rounded-lg border border-border bg-muted p-1.5 hover:bg-muted/80"
                              title={coupon.isActive ? 'Deactivate' : 'Activate'}>
                              {coupon.isActive
                                ? <ToggleRight className="h-4 w-4 text-emerald-400" />
                                : <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                              }
                            </button>
                            <button onClick={() => handleDeleteCoupon(coupon.id)} disabled={deletingCouponId === coupon.id}
                              className="rounded-lg border border-border bg-muted p-1.5 hover:bg-red-950/40">
                              <Trash2 className={`h-3.5 w-3.5 ${deletingCouponId === coupon.id ? 'text-muted-foreground' : 'text-red-400'}`} />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {coupons.length === 0 && <p className="text-sm text-muted-foreground">No coupons yet. Create one!</p>}
                </div>
              </div>
            )}

            {/* ── USERS ───────────────────────────────────────────────── */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{users.length} registered users</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {users.map(u => (
                    <Card key={u.id || u.email} className="border border-border bg-card">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {u.image ? (
                            <img src={u.image} alt={u.name} className="h-12 w-12 rounded-full border border-border" />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-muted-foreground">
                              {u.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{u.name || 'Anonymous'}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-violet-500">{u.orderCount || 0} orders</span>
                              {u.totalSpent > 0 && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-400">₹{u.totalSpent.toFixed(0)}</span>}
                            </div>
                            <p className="mt-2 text-[11px] text-muted-foreground/70">Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</p>
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
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold text-foreground">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowProductModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Title *</Label>
                  <Input value={productForm.title} onChange={e => setProductForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Dragon Ball Goku Figure" className="mt-1 h-9 border-border bg-card text-xs text-foreground" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <textarea value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Product description..." rows={3}
                    className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-violet-500 focus:outline-none" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Price (₹) *</Label>
                  <Input type="number" value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))}
                    placeholder="2999" className="mt-1 h-9 border-border bg-card text-xs text-foreground" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Stock</Label>
                  <Input type="number" value={productForm.stock} onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))}
                    placeholder="50" className="mt-1 h-9 border-border bg-card text-xs text-foreground" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Category *</Label>
                  <select value={productForm.categorySlug}
                    onChange={e => handleCategoryChange(e.target.value)}
                    className="mt-1 w-full h-9 rounded-lg border border-border bg-card px-3 text-xs text-foreground focus:border-violet-500 focus:outline-none">
                    <option value="t-shirts">T-Shirts</option>
                    <option value="plushes">Plushes</option>
                    <option value="action-figures">Action Figures</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <select value={productForm.type} onChange={e => setProductForm(p => ({ ...p, type: e.target.value }))}
                    className="mt-1 w-full h-9 rounded-lg border border-border bg-card px-3 text-xs text-foreground focus:border-violet-500 focus:outline-none">
                    <option value="tshirt">T-Shirt</option>
                    <option value="plush">Plush</option>
                    <option value="action-figure">Action Figure</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {/* Subcategory — only for Action Figures */}
                {productForm.categorySlug === 'action-figures' && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Subcategory</Label>
                    <select value={productForm.subcategory} onChange={e => setProductForm(p => ({ ...p, subcategory: e.target.value }))}
                      className="mt-1 w-full h-9 rounded-lg border border-border bg-card px-3 text-xs text-foreground focus:border-violet-500 focus:outline-none">
                      <option value="">Select subcategory</option>
                      <option value="premium">Premium</option>
                      <option value="sustainable">Sustainable</option>
                    </select>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Series / Anime</Label>
                  <Input value={productForm.series} onChange={e => setProductForm(p => ({ ...p, series: e.target.value }))}
                    placeholder="e.g. Dragon Ball Z" className="mt-1 h-9 border-border bg-card text-xs text-foreground" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Material</Label>
                  <Input value={productForm.material} onChange={e => setProductForm(p => ({ ...p, material: e.target.value }))}
                    placeholder={
                      productForm.categorySlug === 't-shirts' ? '240 GSM French Terry Cotton' :
                      productForm.categorySlug === 'plushes' ? 'Cotton' : 'e.g. PVC'
                    }
                    className="mt-1 h-9 border-border bg-card text-xs text-foreground" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Image URLs (comma-separated)</Label>
                  <Input value={productForm.images} onChange={e => setProductForm(p => ({ ...p, images: e.target.value }))}
                    placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                    className="mt-1 h-9 border-border bg-card text-xs text-foreground" />
                  <p className="mt-1 text-[11px] text-muted-foreground">Paste image URLs. Multiple URLs separated by commas.</p>
                </div>

                {/* ── FOCAL POINT PICKER — all images ─────────────────── */}
                {(() => {
                  const imgList = productForm.images.split(',').map(s => s.trim()).filter(Boolean)
                  if (imgList.length === 0) return null
                  const safeIdx = Math.min(pickerIndex, imgList.length - 1)
                  const currentImg = imgList[safeIdx]
                  const positions = productForm.imagePositions || []
                  const currentPos = positions[safeIdx] || '50% 50%'
                  const updatePos = (x, y) => {
                    const next = [...imgList.map((_, i) => positions[i] || '50% 50%')]
                    next[safeIdx] = `${x}% ${y}%`
                    setProductForm(p => ({ ...p, imagePositions: next }))
                  }
                  return (
                    <div className="sm:col-span-2 space-y-3">
                      <Label className="text-xs text-muted-foreground">Image Crop Focus Point</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Select an image below, then click on it to set which spot stays visible when cropped.
                      </p>

                      {/* Image tabs */}
                      {imgList.length > 1 && (
                        <div className="flex gap-2 flex-wrap">
                          {imgList.map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setPickerIndex(idx)}
                              className={`relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-card transition-all ${
                                idx === safeIdx ? 'border-violet-500 ring-2 ring-violet-400/30' : 'border-border opacity-60 hover:opacity-100'
                              }`}
                            >
                              <img src={url} alt={`Image ${idx + 1}`} className="h-full w-full object-cover" onError={(e) => { e.target.style.display='none' }} />
                              <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[8px] text-white">{idx + 1}</span>
                              {(positions[idx] && positions[idx] !== '50% 50%') && (
                                <span className="absolute top-0.5 left-0.5 h-2 w-2 rounded-full bg-violet-400" title="Custom focal point set" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Picker + preview side by side */}
                      <div className="flex gap-4 items-start">
                        {/* Clickable full image */}
                        <div className="flex-1 space-y-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                            Image {safeIdx + 1} — click to set focal point
                          </p>
                          <div
                            className="relative w-full overflow-hidden rounded-xl border border-violet-500/40 bg-card cursor-crosshair select-none"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
                              const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
                              updatePos(x, y)
                            }}
                          >
                            <img
                              src={currentImg}
                              alt="focal point picker"
                              className="w-full h-auto block pointer-events-none"
                              draggable={false}
                              onError={(e) => { e.target.style.display = 'none' }}
                            />
                            {/* Crosshair */}
                            <div
                              className="absolute pointer-events-none transition-all duration-150"
                              style={{
                                left: currentPos.split(' ')[0],
                                top: currentPos.split(' ')[1],
                                transform: 'translate(-50%, -50%)',
                              }}
                            >
                              <div className="h-6 w-6 rounded-full border-2 border-white bg-violet-500/70 shadow-lg ring-2 ring-black/30" />
                            </div>
                          </div>
                          <p className="text-[11px] text-violet-400 font-medium">
                            Focal point: {currentPos}
                          </p>
                        </div>

                        {/* 4:3 preview */}
                        <div className="w-36 flex-shrink-0 space-y-1">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Card preview (4:3)</p>
                          <div className="relative w-full overflow-hidden rounded-xl border border-border bg-card" style={{ aspectRatio: '4/3' }}>
                            <img
                              src={currentImg}
                              alt="preview"
                              className="h-full w-full"
                              style={{ objectFit: 'cover', objectPosition: currentPos }}
                              onError={(e) => { e.target.style.display = 'none' }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground">How it looks on the product page</p>
                        </div>
                      </div>
                    </div>
                  )
                })()}
                {/* Dimensions — hidden for T-Shirts */}
                {productForm.categorySlug !== 't-shirts' && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Dimensions</Label>
                    <Input value={productForm.dimensions} onChange={e => setProductForm(p => ({ ...p, dimensions: e.target.value }))}
                      placeholder="e.g. 25cm x 15cm" className="mt-1 h-9 border-border bg-card text-xs text-foreground" />
                  </div>
                )}
              </div>

              {/* ── COLORS SECTION (T-Shirts only) ─────────────────────── */}
              {productForm.type === 'tshirt' && (
                <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                      Colors
                    </Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setProductColors(COLOR_PRESET.map(c => ({ ...c })))}
                        className="flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-400 hover:bg-amber-500/20"
                      >
                        Load Preset Colors
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductColors(prev => [...prev, { id: '', name: '', hex: '#000000', images: '' }])}
                        className="flex items-center gap-1 rounded-full border border-violet-500/50 bg-violet-500/10 px-2.5 py-1 text-[11px] text-violet-500 hover:bg-violet-500/20"
                      >
                        <Plus className="h-3 w-3" /> Add Color
                      </button>
                    </div>
                  </div>

                  {productColors.length === 0 && (
                    <p className="text-[11px] text-muted-foreground">No colors added. Click "Add Color" to define colors for this T-shirt.</p>
                  )}

                  <div className="space-y-3">
                    {productColors.map((c, idx) => (
                      <div key={idx} className="relative rounded-lg border border-border bg-card p-3">
                        <button
                          type="button"
                          onClick={() => setProductColors(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute right-2 top-2 text-muted-foreground hover:text-red-400"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>

                        <div className="grid gap-2 sm:grid-cols-3 pr-5">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Color Name *</Label>
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
                              className="mt-1 h-8 border-border bg-background text-xs text-foreground"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Hex Color</Label>
                            <div className="mt-1 flex gap-1.5">
                              <input
                                type="color"
                                value={c.hex || '#000000'}
                                onChange={e => setProductColors(prev => prev.map((item, i) => i === idx ? { ...item, hex: e.target.value } : item))}
                                className="h-8 w-8 cursor-pointer rounded border border-border bg-background p-0.5"
                              />
                              <Input
                                value={c.hex || '#000000'}
                                onChange={e => setProductColors(prev => prev.map((item, i) => i === idx ? { ...item, hex: e.target.value } : item))}
                                placeholder="#000000"
                                className="h-8 flex-1 border-border bg-background font-mono text-[11px] text-foreground"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">ID (auto)</Label>
                            <Input
                              value={c.id}
                              onChange={e => setProductColors(prev => prev.map((item, i) => i === idx ? { ...item, id: e.target.value } : item))}
                              placeholder="e.g. black"
                              className="mt-1 h-8 border-border bg-background font-mono text-[11px] text-muted-foreground"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <Label className="text-[10px] text-muted-foreground">Image URLs for this color (comma-separated)</Label>
                            <Input
                              value={c.images}
                              onChange={e => setProductColors(prev => prev.map((item, i) => i === idx ? { ...item, images: e.target.value } : item))}
                              placeholder="https://res.cloudinary.com/.../black-front.jpg, https://..."
                              className="mt-1 h-8 border-border bg-background text-[11px] text-foreground"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 border-t border-border px-6 py-4">
              <Button onClick={handleSaveProduct} disabled={savingProduct}
                className="flex-1 rounded-full bg-violet-500 text-xs hover:bg-violet-400">
                {savingProduct ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
              </Button>
              <Button variant="outline" onClick={() => setShowProductModal(false)}
                className="rounded-full border-border text-xs text-foreground/80">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── COUPON MODAL ────────────────────────────────────────────────────── */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold text-foreground">Create Coupon</h2>
              <button onClick={() => setShowCouponModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Coupon Code *</Label>
                  <Input value={couponForm.code} onChange={e => setCouponForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. SAVE100" className="mt-1 h-9 border-border bg-card font-mono text-xs uppercase text-foreground" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Discount Type *</Label>
                  <select value={couponForm.type} onChange={e => setCouponForm(p => ({ ...p, type: e.target.value }))}
                    className="mt-1 w-full h-9 rounded-lg border border-border bg-card px-3 text-xs text-foreground focus:border-violet-500 focus:outline-none">
                    <option value="percentage">Percentage (% off)</option>
                    <option value="flat">Flat Amount (₹ off)</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{couponForm.type === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'} *</Label>
                  <Input type="number" value={couponForm.value} onChange={e => setCouponForm(p => ({ ...p, value: e.target.value }))}
                    placeholder={couponForm.type === 'percentage' ? '10' : '200'}
                    className="mt-1 h-9 border-border bg-card text-xs text-foreground" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Min Order Amount (₹)</Label>
                  <Input type="number" value={couponForm.minOrder} onChange={e => setCouponForm(p => ({ ...p, minOrder: e.target.value }))}
                    placeholder="0" className="mt-1 h-9 border-border bg-card text-xs text-foreground" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Expiry Date (optional)</Label>
                  <Input type="date" value={couponForm.expiryDate} onChange={e => setCouponForm(p => ({ ...p, expiryDate: e.target.value }))}
                    className="mt-1 h-9 border-border bg-card text-xs text-foreground" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Input value={couponForm.description} onChange={e => setCouponForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="e.g. 10% off sitewide" className="mt-1 h-9 border-border bg-card text-xs text-foreground" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 border-t border-border px-6 py-4">
              <Button onClick={handleSaveCoupon} disabled={savingCoupon}
                className="flex-1 rounded-full bg-violet-500 text-xs hover:bg-violet-400">
                {savingCoupon ? 'Creating...' : 'Create Coupon'}
              </Button>
              <Button variant="outline" onClick={() => setShowCouponModal(false)}
                className="rounded-full border-border text-xs text-foreground/80">
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
