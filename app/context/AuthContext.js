'use client'

import { createContext, useContext } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const { data: session, status } = useSession()

  const loginWithGoogle = () => signIn('google')
  const logout = () => signOut({ callbackUrl: '/' })

  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        status,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
