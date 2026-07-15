import { useState } from 'react'
import { useAuthStore } from '../store/auth'
import { Lock, User } from 'lucide-react'
export default function Login() {
  const { setAuth } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return setError('Masukkan username dan password')
    setLoading(true); setError('')
    const result = await window.api.auth.login(username, password)
    setLoading(false)
    if (result.error) return setError(result.error)
    setAuth(result.user, result.anggota)
  }
  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,120,212,0.03), rgba(0,120,212,0.08))' }}>
      <div className="win-card w-full max-w-[380px] mx-4 p-10" style={{ animation: 'scaleIn 200ms ease-out' }}>
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#0078D4] flex items-center justify-center mx-auto mb-4" style={{ boxShadow: '0 4px 12px rgba(0,120,212,0.25)' }}>
            <span className="text-2xl font-bold text-white">K</span>
          </div>
          <h1 className="text-[20px] font-bold text-[#1a1a1a]">KSP Simpan Pinjam</h1>
          <p className="text-[13px] text-[#616161] mt-1.5">Masuk ke akun Anda</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-lg px-4 py-3 font-medium">{error}</div>}
          <div>
            <label className="win-label">Username</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
              <input type="text" className="win-input pl-10" placeholder="Masukkan username" value={username} onChange={e => setUsername(e.target.value)} autoFocus />
            </div>
          </div>
          <div>
            <label className="win-label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
              <input type="password" className="win-input pl-10" placeholder="Masukkan password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="win-btn win-btn-primary w-full py-2.5 mt-2">
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
