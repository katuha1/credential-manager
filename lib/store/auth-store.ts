"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthState } from '@/lib/types'

interface AuthStore extends AuthState {
  login: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (user: User) => set({ isAuthenticated: true, user }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
