'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import AppShell from '../AppShell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (status === 'authenticated') {
      const adminRedirect =
        typeof window !== 'undefined'
          ? localStorage.getItem('admin_redirect')
          : null

      const isAdminEmail = session?.user?.email === 'chirayu1264@gmail.com'

      if (adminRedirect === 'true' || isAdminEmail) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_redirect')
        }
        router.push('/admin')
      }
    }
  }, [status, session, router])

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (mode === 'signup') {
        const res = await fetch('/api/auth/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, email, password, name }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data?.error || 'Something went wrong')
          return
        }

        setSuccess('Account created successfully. Please login.')
        setMode('login')
        return
      }

      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      if (res?.error) {
        setError(res.error)
        return
      }

      const adminRedirect =
        typeof window !== 'undefined'
          ? localStorage.getItem('admin_redirect')
          : null

      if (adminRedirect === 'true') {
        localStorage.removeItem('admin_redirect')
        router.push('/admin')
      } else {
        router.push('/')
      }
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary/70">
            Account
          </p>

          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {mode === 'login' ? 'Login' : 'Sign Up'}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Use email & password or sign in with Google.
          </p>
        </div>

        <Card className="border border-border bg-card">
          <CardContent className="space-y-4 p-6">

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-500">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">

              {mode === 'signup' && (
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Name
                  </label>

                  <Input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Email
                </label>

                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-primary text-primary-foreground hover:opacity-90"
              >
                {loading
                  ? mode === 'signup'
                    ? 'Creating account...'
                    : 'Logging in...'
                  : mode === 'signup'
                  ? 'Sign Up'
                  : 'Login'}
              </Button>

            </form>

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

            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                signIn('google', { callbackUrl: '/' })
              }
            >
              Login with Google
            </Button>

            <div className="text-center text-xs">
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login')
                  setError('')
                  setSuccess('')
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                {mode === 'login'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Login'}
              </button>
            </div>

          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
