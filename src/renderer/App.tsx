import { useState } from 'react'
import { useAuthStore } from './store/auth'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AnggotaPage from './pages/AnggotaPage'
import SimpananPage from './pages/SimpananPage'
import PinjamanPage from './pages/PinjamanPage'
import PembayaranPage from './pages/PembayaranPage'
import LaporanPage from './pages/LaporanPage'
import PengaturanPage from './pages/PengaturanPage'

export type Page = 'dashboard' | 'anggota' | 'simpanan' | 'pinjaman' | 'pembayaran' | 'laporan' | 'pengaturan'

export default function App() {
  const { user } = useAuthStore()
  const [page, setPage] = useState<Page>('dashboard')

  if (!user) {
    return (
      <div className="h-screen flex flex-col">
        <TitleBar />
        <Login />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <TitleBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar page={page} onNavigate={setPage} />
        <main className="flex-1 overflow-y-auto p-8">
          {page === 'dashboard' && <Dashboard />}
          {page === 'anggota' && <AnggotaPage />}
          {page === 'simpanan' && <SimpananPage />}
          {page === 'pinjaman' && <PinjamanPage />}
          {page === 'pembayaran' && <PembayaranPage />}
          {page === 'laporan' && <LaporanPage />}
          {page === 'pengaturan' && <PengaturanPage />}
        </main>
      </div>
    </div>
  )
}
