'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import AppShell from '../AppShell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AdminLoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      if (res?.error) {
        setError(res.error)
        return
      }

      // mark admin redirect
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_redirect', 'true')
      }

      router.push('/login')
    } catch (err) {
      console.error(err)
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md space-y-6">
        
        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary/70">
            Admin
          </p>

          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Admin Login
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Access your dashboard securely.
          </p>
        </div>

        {/* Card */}
        <Card className="border border-border bg-card">
          <CardContent className="space-y-4 p-6">

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Email
                </label>

                <Input
                  type="email"
                  placeholder="admin@dracnoir.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background text-foreground border-border"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Password
                </label>

                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background text-foreground border-border"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-primary text-primary-foreground hover:opacity-90"
              >
                {loading ? 'Logging in...' : 'Login as Admin'}
              </Button>

            </form>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>

              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            {/* Google Login */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('admin_redirect', 'true')
                }
                signIn('google')
              }}
            >
              Continue with Google
            </Button>

          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
