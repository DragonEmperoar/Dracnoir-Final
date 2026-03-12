'use client'

import { SessionProvider } from 'next-auth/react'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from 'next-themes'

const Providers = ({ children }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider>
        <AuthProvider>{children}</AuthProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}

export default Providers
