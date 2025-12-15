'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { userService } from '@/services/user.service'
import type { Database } from '@/lib/database.types'

type User = Database['public']['Tables']['users']['Row']

interface UserContextType {
  user: User | null
  loading: boolean
  updateUser: (walletAddress: string, role?: 'FREELANCER' | 'EMPLOYER') => Promise<void>
  clearUser: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  const updateUser = async (walletAddress: string, role?: 'FREELANCER' | 'EMPLOYER') => {
    setLoading(true)
    try {
      const userData = await userService.getOrCreateUser(walletAddress, role)
      setUser(userData)
    } catch (error) {
      console.error('Error updating user:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearUser = () => {
    setUser(null)
  }

  return (
    <UserContext.Provider value={{ user, loading, updateUser, clearUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
