import { useEffect, useState } from 'react'
import type { Anggota } from '../types'
import { formatDate } from '../lib/utils'
import { Plus, Search, Edit2, Trash2, Eye, X, ToggleLeft, ToggleRight } from 'lucide-react'
const emptyForm = { nama: '', nik: '', alamat: '', telepon: '', email: '', tanggal_lahir: '', pekerjaan: '', foto: '' }
export default function AnggotaPage() {
  const [data, setData] = useState<Anggota[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState<Anggota | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const load = () => window.api.anggota.list().then(setData)
  useEffect(() => { load() }, [])
  const filtered = data.filter(a => a.nama.toLowerCase().includes(search.toLowerCase()) || a.no_anggota.toLowerCase().includes(search.toLowerCase()) || a.nik.includes(search))
  const openAdd = () => { setForm(emptyForm); setEditId(null); setError(''); setShowForm(true) }
  const openEdit = (a: Anggota) => { setForm({ nama: a.nama, nik: a.nik, alamat: a.alamat || '', telepon: a.telepon || '', email: a.email || '', tanggal_lahir: a.tanggal_lahir || '', pekerjaan: a.pekerjaan || '', foto: a.foto || '' }); setEditId(a.id); setError(''); setShowForm(true) }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nama.trim() || !form.nik.trim()) return setError('Nama dan NIK wajib diisi')
    setLoading(true); setError('')
    const result = editId ? await window.api.anggota.update(editId, { ...form, status: 'aktif' }) : await window.api.anggota.create(form)
    setLoading(false)
    if (result.error) return setError(result.error)
    setShowForm(false); load()
  }
  const handleToggle = async (id: number) => { await window.api.anggota.toggleStatus(id); load() }
  const handleDelete = async (id: number) => { if (!confirm('Hapus anggota ini?')) return; await window.api.anggota.delete(id); load() }
  return (
    <div style={{ animation: 'fadeIn 200ms ease-out' }}>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-[28px] font-bold text-[#1a1a1a]">Anggota</h1><p className="text-[14px] text-[#616161] mt-1">Kelola data anggota koperasi</p></div>
        <button onClick={openAdd} className="win-btn win-btn-primary"><Plus size={16} /> Tambah Anggota</button>
      </div>
      <div className="win-card mb-4 !p-4">
        <div className="relative max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" /><input type="text" className="win-input pl-10" placeholder="Cari nama, no anggota, NIK..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>
      <div className="win-card !p-0 overflow-hidden">
        <table className="win-table">
          <thead><tr><th>No Anggota</th><th>Nama</th><th>NIK</th><th>Telepon</th><th>Status</th><th>Pokok</th><th className="text-right">Aksi</th></tr></thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id}>
                <td className="font-semibold text-[#0078D4]">{a.no_anggota}</td>
                <td className="font-medium">{a.nama}</td>
                <td className="text-[#616161] font-mono text-[13px]">{a.nik}</td>
                <td className="text-[#616161]">{a.telepon || '-'}</td>
                <td><span className={`win-badge ${a.status === 'aktif' ? 'win-badge-success' : 'win-badge-danger'}`}>{a.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</span></td>
                <td><span className={`win-badge ${a.simpanan_pokok_bayar ? 'win-badge-success' : 'win-badge-warning'}`}>{a.simpanan_pokok_bayar ? 'Dibayar' : 'Belum'}</span></td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setShowDetail(a)} className="win-btn win-btn-ghost p-1.5"><Eye size={15} /></button>
                    <button onClick={() => openEdit(a)} className="win-btn win-btn-ghost p-1.5"><Edit2 size={15} /></button>
                    <button onClick={() => handleToggle(a.id)} className="win-btn win-btn-ghost p-1.5">{a.status === 'aktif' ? <ToggleRight size={16} className="text-[#0e7a0d]" /> : <ToggleLeft size={16} className="text-[#9e9e9e]" />}</button>
                    <button onClick={() => handleDelete(a.id)} className="win-btn win-btn-ghost p-1.5 text-[#c42b1c] hover:bg-red-50"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-16 text-[#9e9e9e]">Tidak ada data anggota</td></tr>}
          </tbody>
        </table>
      </div>
      {showDetail && (
        <div className="win-dialog-overlay" onClick={() => setShowDetail(null)}>
          <div className="win-dialog" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-[18px] font-bold">Detail Anggota</h3><button onClick={() => setShowDetail(null)} className="win-btn win-btn-ghost p-1"><X size={18} /></button></div>
            <div className="grid grid-cols-2 gap-4 text-[14px]">
              {([['No Anggota', showDetail.no_anggota], ['Nama', showDetail.nama], ['NIK', showDetail.nik], ['Telepon', showDetail.telepon || '-'], ['Email', showDetail.email || '-'], ['Pekerjaan', showDetail.pekerjaan || '-'], ['Tgl Lahir', formatDate(showDetail.tanggal_lahir)], ['Status', showDetail.status === 'aktif' ? 'Aktif' : 'Nonaktif']] as [string, any][]).map(([label, value]) => (
                <div key={label}><span className="text-[#9e9e9e] text-[13px]">{label}</span><p className="font-semibold mt-0.5">{value}</p></div>
              ))}
              <div className="col-span-2"><span className="text-[#9e9e9e] text-[13px]">Alamat</span><p className="font-semibold mt-0.5">{showDetail.alamat || '-'}</p></div>
            </div>
          </div>
        </div>
      )}
      {showForm && (
        <div className="win-dialog-overlay" onClick={() => setShowForm(false)}>
          <div className="win-dialog" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-[18px] font-bold">{editId ? 'Edit Anggota' : 'Tambah Anggota'}</h3><button onClick={() => setShowForm(false)} className="win-btn win-btn-ghost p-1"><X size={18} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-lg px-4 py-3 font-medium">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="win-label">Nama Lengkap *</label><input className="win-input" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required /></div>
                <div><label className="win-label">NIK * (16 digit)</label><input className="win-input" value={form.nik} onChange={e => setForm({ ...form, nik: e.target.value })} required maxLength={16} placeholder="3201234567890001" /></div>
                <div><label className="win-label">Telepon</label><input className="win-input" value={form.telepon} onChange={e => setForm({ ...form, telepon: e.target.value })} /></div>
                <div><label className="win-label">Email</label><input className="win-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div><label className="win-label">Tanggal Lahir</label><input className="win-input" type="date" value={form.tanggal_lahir} onChange={e => setForm({ ...form, tanggal_lahir: e.target.value })} /></div>
                <div><label className="win-label">Pekerjaan</label><input className="win-input" value={form.pekerjaan} onChange={e => setForm({ ...form, pekerjaan: e.target.value })} /></div>
              </div>
              <div><label className="win-label">Alamat</label><textarea className="win-input" value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-black/5">
                <button type="button" onClick={() => setShowForm(false)} className="win-btn win-btn-secondary">Batal</button>
                <button type="submit" disabled={loading} className="win-btn win-btn-primary">{loading ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
