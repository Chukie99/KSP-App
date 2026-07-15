import { create } from 'zustand'
interface AuthState {
  user: { id: number; username: string; role: string; nama_lengkap: string } | null
  anggota: any | null
  setAuth: (user: any, anggota?: any) => void
  logout: () => void
}
export const useAuthStore = create<AuthState>((set) => ({
  user: null, anggota: null,
  setAuth: (user, anggota) => set({ user, anggota }),
  logout: () => set({ user: null, anggota: null }),
}))
