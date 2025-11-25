'use client'

import { SessionProvider } from 'next-auth/react'
import { AuthProvider } from './context/AuthContext'

const Providers = ({ children }) => {
  return (
    <SessionProvider>
      <AuthProvider>{children}</AuthProvider>
    </SessionProvider>
  )
}

export default Providers
