'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import AppShell from '../AppShell'

const AdminDashboard = () => {
  const { user, status } = useAuth()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
  })
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    
    // TODO: Add admin role check
    // For now, any logged-in user can access
    
    loadData()
  }, [status, router])

  const loadData = async () => {
    setLoading(true)
    try {
      const [productsRes, ordersRes] = await Promise.all([
        fetch('/api/products?limit=100'),
        fetch('/api/orders'),
      ])
      
      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(data.items || [])
        setStats(prev => ({ ...prev, totalProducts: data.total || 0 }))
      }
      
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setOrders(ordersData || [])
        const revenue = ordersData.reduce((sum, order) => sum + (order.subtotal || 0), 0)
        setStats(prev => ({ 
          ...prev, 
          totalOrders: ordersData.length,
          totalRevenue: revenue 
        }))
      }
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'users', label: 'Users', icon: Users },
  ]

  if (!user) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-slate-300">Loading...</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80">Admin</p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-300">
              Manage your Dracnoir store
            </p>
          </div>
        </div>

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

        {/* Content */}
        {loading ? (
          <div className="text-sm text-slate-300">Loading...</div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border border-slate-800 bg-gradient-to-br from-violet-500/10 to-purple-500/10">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">Total Products</p>
                        <p className="mt-1 text-2xl font-bold text-slate-100">
                          {stats.totalProducts}
                        </p>
                      </div>
                      <Package className="h-8 w-8 text-violet-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-800 bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">Total Orders</p>
                        <p className="mt-1 text-2xl font-bold text-slate-100">
                          {stats.totalOrders}
                        </p>
                      </div>
                      <ShoppingCart className="h-8 w-8 text-emerald-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-800 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">Total Revenue</p>
                        <p className="mt-1 text-2xl font-bold text-slate-100">
                          ₹{stats.totalRevenue.toFixed(0)}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-amber-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-800 bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">Total Users</p>
                        <p className="mt-1 text-2xl font-bold text-slate-100">
                          {stats.totalUsers || '0'}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Orders */}
                <Card className="border border-slate-800 bg-slate-950/80 sm:col-span-2 lg:col-span-4">
                  <CardContent className="p-6">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Recent Orders
                    </h3>
                    <div className="space-y-2">
                      {orders.slice(0, 5).map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-3"
                        >
                          <div>
                            <p className="text-xs font-medium text-slate-100">
                              Order #{order.id?.slice(-6)}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(order.createdAt).toLocaleDateString()} • {order.items?.length || 0} items
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-semibold text-violet-300">
                              ₹{order.subtotal?.toFixed(0)}
                            </p>
                            <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-300">{products.length} products</p>
                  <Button
                    size="sm"
                    className="gap-2 rounded-full bg-violet-500 text-xs hover:bg-violet-400"
                  >
                    <Plus className="h-3 w-3" />
                    Add Product
                  </Button>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <Card key={product.id} className="border border-slate-800 bg-slate-950/80">
                      <CardContent className="p-4">
                        <div className="aspect-square overflow-hidden rounded-lg bg-slate-900">
                          <img
                            src={product.images?.[0]}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-medium text-slate-100">{product.title}</p>
                          <p className="text-xs text-slate-400">{product.series}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-violet-300">
                              ₹{product.price?.toFixed(0)}
                            </p>
                            <div className="flex gap-1">
                              <button className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 hover:bg-slate-800">
                                <Edit className="h-3 w-3 text-slate-400" />
                              </button>
                              <button className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 hover:bg-slate-800">
                                <Trash2 className="h-3 w-3 text-red-400" />
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

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-300">{orders.length} total orders</p>
                
                <div className="space-y-2">
                  {orders.map((order) => (
                    <Card key={order.id} className="border border-slate-800 bg-slate-950/80">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-100">
                              Order #{order.id?.slice(-8)}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {new Date(order.createdAt).toLocaleString()} • {order.items?.length || 0} items
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Payment: {order.paymentStatus || 'pending'}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-100">
                                ₹{order.subtotal?.toFixed(0)}
                              </p>
                              <span className="mt-1 inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                                {order.status}
                              </span>
                            </div>
                            <button
                              onClick={() => router.push(`/orders/${order.id}`)}
                              className="rounded-lg border border-slate-700 bg-slate-900 p-2 hover:bg-slate-800"
                            >
                              <Eye className="h-4 w-4 text-slate-400" />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <Card className="border border-slate-800 bg-slate-950/80">
                <CardContent className="p-6 text-center">
                  <Users className="mx-auto h-12 w-12 text-slate-700" />
                  <p className="mt-4 text-sm text-slate-400">
                    User management coming soon
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}

export default AdminDashboard
