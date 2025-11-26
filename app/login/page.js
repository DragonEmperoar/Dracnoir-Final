'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import AppShell from '../AppShell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const LoginPage = () => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (mode === 'signup') {
        // Create account via REST endpoint
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
        setSuccess('Account created. You can now log in with these credentials.')
        setMode('login')
        return
      }

      // Login via NextAuth credentials provider
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      if (res?.error) {
        setError(res.error)
        return
      }

      setSuccess('Logged in successfully.')
      router.push('/')
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80">Account</p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {mode === 'login' ? 'Login' : 'Sign up'}
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Use email and password as an alternative to Google sign-in.
          </p>
        </div>

        <Card className="border border-slate-800 bg-slate-950/80">
          <CardContent className="space-y-4 p-4 text-sm">
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <Input
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 border-slate-700 bg-slate-900/80 text-sm"
                />
              )}
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 border-slate-700 bg-slate-900/80 text-sm"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 border-slate-700 bg-slate-900/80 text-sm"
              />
              {error && <p className="text-xs text-red-300">{error}</p>}
              {success && <p className="text-xs text-emerald-300">{success}</p>}
              <Button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-full bg-violet-500 text-xs font-semibold text-white hover:bg-violet-400"
              >
                {loading
                  ? 'Please wait...'
                  : mode === 'login'
                  ? 'Login'
                  : 'Create account'}
              </Button>
            </form>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-violet-300 hover:text-violet-200"
              >
                {mode === 'login'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Log in'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="hover:text-slate-200"
              >
                Back to home
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

export default LoginPage
