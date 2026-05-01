import { create } from 'zustand'

interface User {
  id: string
  email: string
  full_name: string
  role: 'analyst' | 'viewer'
}

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  clearAuth: () => void
  isAnalyst: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  setAuth: (token, user) => set({ token, user }),
  clearAuth: () => set({ token: null, user: null }),
  isAnalyst: () => get().user?.role === 'analyst',
}))