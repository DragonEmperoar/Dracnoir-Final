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
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCheckDone, setAdminCheckDone] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    
    if (status === 'authenticated') {
      checkAdminAccess()
    }
  }, [status, router])

  const checkAdminAccess = async () => {
    try {
      const res = await fetch('/api/admin/check')
      const data = await res.json()
      
      if (data.isAdmin) {
        setIsAdmin(true)
        setAdminCheckDone(true)
        loadData()
      } else {
        setAccessDenied(true)
        setAdminCheckDone(true)
      }
    } catch (error) {
      console.error('Admin check failed:', error)
      setAccessDenied(true)
      setAdminCheckDone(true)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        fetch('/api/products?limit=100'),
        fetch('/api/orders'),
        fetch('/api/users'),
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
      
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData || [])
        setStats(prev => ({ ...prev, totalUsers: usersData.length }))
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
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-bold text-red-300">Access Denied</h2>
              <p className="mb-4 text-sm text-slate-300">
                You don't have permission to access the admin dashboard.
              </p>
              <p className="mb-6 text-xs text-slate-400">
                Only authorized administrators can access this area.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  className="border-slate-700 text-slate-300"
                  onClick={() => router.push('/')}
                >
                  Go to Homepage
                </Button>
                <Button
                  className="bg-violet-500 hover:bg-violet-400"
                  onClick={() => router.push('/profile')}
                >
                  Go to Profile
                </Button>
              </div>
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
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-2 rounded-full px-3 sm:px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-violet-500 text-white'
                    : 'border border-slate-800 bg-slate-950/80 text-slate-300 hover:border-violet-500/50 hover:bg-slate-900'
                }`}
              >
                <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
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
              <div className="space-y-4">
                <p className="text-sm text-slate-300">{users.length} registered users</p>
                
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {users.map((user) => (
                    <Card key={user.id} className="border border-slate-800 bg-slate-950/80">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name}
                              className="h-12 w-12 rounded-full border border-slate-700"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-sm font-semibold text-slate-400">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-100">{user.name || 'Anonymous'}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-violet-300">
                                {user.orderCount} orders
                              </span>
                              {user.totalSpent > 0 && (
                                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                                  ₹{user.totalSpent.toFixed(0)}
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                              Joined {new Date(user.createdAt).toLocaleDateString()}
                            </p>
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
    </AppShell>
  )
}

export default AdminDashboard
