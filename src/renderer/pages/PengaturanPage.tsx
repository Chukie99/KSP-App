import { useEffect, useState } from 'react'
import type { User } from '../types'
import { Settings, Save, UserPlus, Users, Key, X } from 'lucide-react'
export default function PengaturanPage() {
  const [pengaturan, setPengaturan] = useState<Record<string, string>>({})
  const [users, setUsers] = useState<User[]>([])
  const [showUserForm, setShowUserForm] = useState(false)
  const [userForm, setUserForm] = useState({ username: '', password: '', nama_lengkap: '', role: 'teller' as const })
  const [editUserId, setEditUserId] = useState<number | null>(null)
  const [tab, setTab] = useState<'umum' | 'user'>('umum')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const load = () => { window.api.pengaturan.get().then(setPengaturan); window.api.users.list().then(setUsers) }
  useEffect(() => { load() }, [])
  const savePengaturan = async (key: string, value: string) => { const r = await window.api.pengaturan.update(key, value); if (r.error) return setError(r.error); setPengaturan(p => ({ ...p, [key]: value })); setSuccess('Berhasil disimpan'); setTimeout(() => setSuccess(''), 2000) }
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userForm.username.trim() || !userForm.nama_lengkap.trim()) return setError('Lengkapi data user')
    if (!editUserId && !userForm.password) return setError('Password wajib diisi')
    setLoading(true); setError('')
    const result = editUserId ? await window.api.users.update(editUserId, userForm) : await window.api.users.create(userForm)
    setLoading(false)
    if (result.error) return setError(result.error)
    setShowUserForm(false); setEditUserId(null); setUserForm({ username: '', password: '', nama_lengkap: '', role: 'teller' }); load()
  }
  return (
    <div style={{ animation: 'fadeIn 200ms ease-out' }}>
      <div className="mb-6"><h1 className="text-[28px] font-bold text-[#1a1a1a]">Pengaturan</h1><p className="text-[14px] text-[#616161] mt-1">Konfigurasi koperasi dan manajemen user</p></div>
      <div className="flex gap-1 mb-6 bg-white rounded-lg p-1 border border-black/5 w-fit">
        {([{ id: 'umum' as const, label: 'Umum', icon: Settings }, { id: 'user' as const, label: 'User Management', icon: Users }]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-semibold transition-all ${tab === t.id ? 'bg-[#0078D4]/10 text-[#0078D4] shadow-sm' : 'text-[#616161] hover:bg-black/5'}`}><t.icon size={14} /> {t.label}</button>
        ))}
      </div>
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-[13px] rounded-lg px-4 py-3 font-medium mb-4">{success}</div>}
      {tab === 'umum' && (
        <div className="space-y-4">
          <div className="win-card">
            <h3 className="text-[15px] font-bold mb-4">Informasi Koperasi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {([{ key: 'nama_koperasi', label: 'Nama Koperasi' }, { key: 'alamat_koperasi', label: 'Alamat' }, { key: 'telepon_koperasi', label: 'Telepon' }]).map(item => (
                <div key={item.key}><label className="win-label">{item.label}</label><div className="flex gap-2"><input className="win-input flex-1" value={pengaturan[item.key] || ''} onChange={e => setPengaturan(p => ({ ...p, [item.key]: e.target.value }))} /><button onClick={() => savePengaturan(item.key, pengaturan[item.key] || '')} className="win-btn win-btn-primary px-3"><Save size={14} /></button></div></div>
              ))}
            </div>
          </div>
          <div className="win-card">
            <h3 className="text-[15px] font-bold mb-4">Simpanan Default</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="win-label">Simpanan Pokok (Rp)</label><div className="flex gap-2"><input type="number" className="win-input flex-1" value={pengaturan.simpanan_pokok || ''} onChange={e => setPengaturan(p => ({ ...p, simpanan_pokok: e.target.value }))} /><button onClick={() => savePengaturan('simpanan_pokok', pengaturan.simpanan_pokok || '')} className="win-btn win-btn-primary px-3"><Save size={14} /></button></div></div>
              <div><label className="win-label">Simpanan Wajib/Bulan (Rp)</label><div className="flex gap-2"><input type="number" className="win-input flex-1" value={pengaturan.simpanan_wajib || ''} onChange={e => setPengaturan(p => ({ ...p, simpanan_wajib: e.target.value }))} /><button onClick={() => savePengaturan('simpanan_wajib', pengaturan.simpanan_wajib || '')} className="win-btn win-btn-primary px-3"><Save size={14} /></button></div></div>
            </div>
          </div>
        </div>
      )}
      {tab === 'user' && (
        <div>
          <div className="flex justify-end mb-4"><button onClick={() => { setEditUserId(null); setUserForm({ username: '', password: '', nama_lengkap: '', role: 'teller' }); setError(''); setShowUserForm(true) }} className="win-btn win-btn-primary"><UserPlus size={16} /> Tambah User</button></div>
          <div className="win-card !p-0 overflow-hidden">
            <table className="win-table">
              <thead><tr><th>Username</th><th>Nama</th><th>Role</th><th>Status</th><th className="text-right">Aksi</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.username}</td>
                    <td>{u.nama_lengkap}</td>
                    <td><span className={`win-badge ${u.role === 'admin' ? 'win-badge-danger' : u.role === 'teller' ? 'win-badge-info' : 'win-badge-success'}`}>{u.role}</span></td>
                    <td><span className={`win-badge ${u.is_active ? 'win-badge-success' : 'win-badge-danger'}`}>{u.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                    <td className="text-right"><div className="flex items-center justify-end gap-1"><button onClick={() => { setEditUserId(u.id); setUserForm({ username: u.username, password: '', nama_lengkap: u.nama_lengkap, role: u.role as any }); setError(''); setShowUserForm(true) }} className="win-btn win-btn-ghost text-[13px]">Edit</button><button onClick={async () => { if (!confirm('Hapus?')) return; await window.api.users.delete(u.id); load() }} className="win-btn win-btn-ghost text-[13px] text-[#c42b1c] hover:bg-red-50">Hapus</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showUserForm && (
        <div className="win-dialog-overlay" onClick={() => setShowUserForm(false)}>
          <div className="win-dialog" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-[18px] font-bold flex items-center gap-2"><Key size={20} /> {editUserId ? 'Edit User' : 'Tambah User'}</h3><button onClick={() => setShowUserForm(false)} className="win-btn win-btn-ghost p-1"><X size={18} /></button></div>
            <form onSubmit={handleUserSubmit} className="space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-lg px-4 py-3 font-medium">{error}</div>}
              <div><label className="win-label">Username *</label><input className="win-input" value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} required disabled={!!editUserId} /></div>
              <div><label className="win-label">Password {editUserId ? '(kosongkan jika tidak diubah)' : '*'}</label><input type="password" className="win-input" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required={!editUserId} /></div>
              <div><label className="win-label">Nama Lengkap *</label><input className="win-input" value={userForm.nama_lengkap} onChange={e => setUserForm({ ...userForm, nama_lengkap: e.target.value })} required /></div>
              <div><label className="win-label">Role *</label><select className="win-input" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value as any })}><option value="admin">Admin</option><option value="teller">Teller</option><option value="anggota">Anggota</option></select></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-black/5"><button type="button" onClick={() => setShowUserForm(false)} className="win-btn win-btn-secondary">Batal</button><button type="submit" disabled={loading} className="win-btn win-btn-primary">{loading ? 'Menyimpan...' : 'Simpan'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
