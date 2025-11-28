'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Eye, EyeOff } from 'lucide-react'
import AppShell from '../AppShell'

const AdminLoginPage = () => {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid credentials')
        setLoading(false)
        return
      }

      // Redirect to admin dashboard
      router.push('/admin')
    } catch (err) {
      console.error('Login error:', err)
      setError('Unable to login. Please try again.')
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="flex min-h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md border-slate-800 bg-slate-950/80">
          <CardContent className="p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10">
                <Shield className="h-8 w-8 text-violet-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-100">Admin Access</h1>
              <p className="mt-2 text-sm text-slate-400">
                Secure login for administrators only
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-800/50 bg-red-950/20 p-3">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm text-slate-300">
                  Admin Username
                </Label>
                <Input
                  id="username"
                  name="admin-username"
                  type="text"
                  placeholder="DragonEmperor@07"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  required
                  className="border-slate-800 bg-slate-900 text-slate-100"
                />
                <p className="text-xs text-slate-500">Enter: DragonEmperor@07</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-slate-300">
                  Admin Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    autoComplete="off"
                    required
                    className="border-slate-800 bg-slate-900 pr-10 text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-violet-500 text-sm font-semibold hover:bg-violet-400"
              >
                {loading ? 'Authenticating...' : 'Login to Admin Panel'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-950 px-2 text-slate-500">Or</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-slate-700 bg-slate-900/60 text-sm text-slate-200 hover:bg-slate-800"
              onClick={() => {
                // Set a flag in localStorage to redirect to admin after login
                if (typeof window !== 'undefined') {
                  localStorage.setItem('admin_redirect', 'true')
                }
                router.push('/login')
              }}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google (Admin Email)
            </Button>

            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/')}
                className="text-xs text-slate-400 hover:text-slate-300"
              >
                ← Back to Home
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

export default AdminLoginPage
