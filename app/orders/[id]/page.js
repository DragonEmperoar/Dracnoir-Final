'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppShell from '../../AppShell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

const OrderDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const rawId = params?.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/orders/${id}`)
        if (!res.ok) {
          setError('Order not found or you do not have access to it.')
          setOrder(null)
          return
        }
        const data = await res.json()
        setOrder(data)
      } catch (e) {
        console.error(e)
        setError('Unable to load order right now.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const items = order?.items || []
  const addr = order?.addressSnapshot

  return (
    <AppShell>
      <div className="space-y-8">
        {loading ? (
          <p className="text-base text-slate-300">Loading order...</p>
        ) : error ? (
          <p className="text-base text-red-300">{error}</p>
        ) : !order ? (
          <p className="text-base text-slate-300">Order not found.</p>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 px-6 py-6 text-center md:flex-row md:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 animate-pulse" />
                  <span className="pointer-events-none absolute inset-0 rounded-full border border-emerald-500/40" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    Order placed
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-50">
                    Your Dracnoir haul is locked in.
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Order ID:{' '}
                    <span className="font-mono text-slate-100">
                      {order.id}
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 text-sm text-slate-200 md:mt-0">
                <Button
                  size="sm"
                  className="w-full rounded-full bg-violet-500 text-xs font-semibold text-white hover:bg-violet-400"
                  onClick={() => window.scrollTo({ top: 9999, behavior: 'smooth' })}
                >
                  View order summary
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full rounded-full border-slate-700 bg-slate-950 text-xs text-slate-100 hover:bg-slate-900"
                  onClick={() => router.push('/')}
                >
                  Continue shopping
                </Button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,_1.4fr)_minmax(0,_1.2fr)]">
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

            <Card className="h-fit border border-slate-800 bg-slate-950/80 text-sm">
              <CardContent className="space-y-3 p-4">
                <div className="space-y-2 text-xs text-slate-300">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
                    Shipping address
                  </p>
                  {addr ? (
                    <div className="space-y-1">
                      <p className="font-medium text-slate-100">{addr.label}</p>
                      <p className="text-slate-300">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ''}
                      </p>
                      <p className="text-slate-300">
                        {addr.city}, {addr.state} {addr.postalCode}
                      </p>
                      <p className="text-slate-400">{addr.country}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No address snapshot available.</p>
                  )}
                </div>
                <div className="border-t border-slate-800 pt-3 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="text-base font-semibold text-slate-50">
                      ${order.subtotal?.toFixed?.(2) ?? '0.00'}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-500">
                    Status: <span className="text-emerald-300">{order.status}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  )
}

export default OrderDetailPage
