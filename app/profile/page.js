'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import AppShell from '../AppShell'

const ProfilePage = () => {
  const { user, logout, status } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  if (!user) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center text-slate-200">
          Loading profile...
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80">Account</p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Profile</h1>
            <p className="mt-1 text-sm text-slate-300">
              Manage your Dracnoir account, preferences and saved details.
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

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border border-slate-800 bg-slate-950/80">
            <CardContent className="space-y-2 p-4 text-sm">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                Basic info
              </p>
              <p className="text-slate-100">{user.name || 'Otaku'}</p>
              <p className="text-slate-400">{user.email}</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-800 bg-slate-950/80">
            <CardContent className="space-y-2 p-4 text-sm">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                Saved addresses
              </p>
              <p className="text-slate-400 text-xs">
                Address book, preferences and more will appear here in the next iteration.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

export default ProfilePage
