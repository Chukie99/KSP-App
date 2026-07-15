import { useState } from 'react'
import { useAuthStore } from '../store/auth'
import type { Page } from '../App'
import { LayoutDashboard, Users, Wallet, CreditCard, Receipt, BarChart3, Settings, LogOut, Key } from 'lucide-react'
const navItems: { id: Page; label: string; icon: any; roles: string[] }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'teller', 'anggota'] },
  { id: 'anggota', label: 'Anggota', icon: Users, roles: ['admin', 'teller'] },
  { id: 'simpanan', label: 'Simpanan', icon: Wallet, roles: ['admin', 'teller', 'anggota'] },
  { id: 'pinjaman', label: 'Pinjaman', icon: CreditCard, roles: ['admin', 'teller'] },
  { id: 'pembayaran', label: 'Pembayaran', icon: Receipt, roles: ['admin', 'teller'] },
  { id: 'laporan', label: 'Laporan', icon: BarChart3, roles: ['admin'] },
  { id: 'pengaturan', label: 'Pengaturan', icon: Settings, roles: ['admin'] },
]
export default function Sidebar({ page, onNavigate }: { page: Page; onNavigate: (p: Page) => void }) {
  const { user, logout } = useAuthStore()
  const [showChangePw, setShowChangePw] = useState(false)
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const filtered = navItems.filter(i => i.roles.includes(user?.role || ''))
  const handleLogout = async () => {
    await window.api.auth.logout()
    logout()
  }
  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(''); setPwSuccess('')
    if (!oldPw || !newPw) return setPwError('Isi semua field')
    if (newPw !== confirmPw) return setPwError('Password baru tidak cocok')
    if (newPw.length < 6) return setPwError('Password baru minimal 6 karakter')
    setPwLoading(true)
    const result = await window.api.auth.changePassword(user!.id, oldPw, newPw)
    setPwLoading(false)
    if (result.error) return setPwError(result.error)
    setPwSuccess('Password berhasil diubah')
    setOldPw(''); setNewPw(''); setConfirmPw('')
    setTimeout(() => { setPwSuccess(''); setShowChangePw(false) }, 1500)
  }
  return (
    <aside className="win-sidebar">
      <nav className="flex-1 space-y-1 mt-1">
        {filtered.map(item => (
          <button key={item.id} onClick={() => onNavigate(item.id)} className={`win-nav-item ${page === item.id ? 'active' : ''}`}>
            <item.icon size={18} strokeWidth={page === item.id ? 2 : 1.5} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="border-t border-black/5 pt-3 mt-3">
        <div className="px-3 py-1.5">
          <p className="text-[13px] font-semibold text-[#1a1a1a] truncate">{user?.nama_lengkap}</p>
          <p className="text-[11px] text-[#9e9e9e] capitalize">{user?.role}</p>
        </div>
        <button onClick={() => setShowChangePw(true)} className="win-nav-item mt-1 text-[#616161]">
          <Key size={18} strokeWidth={1.5} /><span>Ubah Password</span>
        </button>
        <button onClick={handleLogout} className="win-nav-item mt-1 text-[#c42b1c] hover:bg-red-50">
          <LogOut size={18} strokeWidth={1.5} /><span>Keluar</span>
        </button>
      </div>
      {showChangePw && (
        <div className="win-dialog-overlay" onClick={() => setShowChangePw(false)}>
          <div className="win-dialog" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-bold flex items-center gap-2"><Key size={20} /> Ubah Password</h3>
              <button onClick={() => setShowChangePw(false)} className="win-btn win-btn-ghost p-1">&times;</button>
            </div>
            <form onSubmit={handleChangePw} className="space-y-4">
              {pwError && <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-lg px-4 py-3 font-medium">{pwError}</div>}
              {pwSuccess && <div className="bg-green-50 border border-green-200 text-green-700 text-[13px] rounded-lg px-4 py-3 font-medium">{pwSuccess}</div>}
              <div><label className="win-label">Password Lama *</label><input type="password" className="win-input" value={oldPw} onChange={e => setOldPw(e.target.value)} required /></div>
              <div><label className="win-label">Password Baru *</label><input type="password" className="win-input" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={6} /></div>
              <div><label className="win-label">Konfirmasi Password Baru *</label><input type="password" className="win-input" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-black/5">
                <button type="button" onClick={() => setShowChangePw(false)} className="win-btn win-btn-secondary">Batal</button>
                <button type="submit" disabled={pwLoading} className="win-btn win-btn-primary">{pwLoading ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  )
}
