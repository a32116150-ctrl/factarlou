import { create } from 'zustand'

interface AuthState {
  user: { id: string; email: string } | null
  loading: boolean
  setUser: (user: { id: string; email: string } | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}))
