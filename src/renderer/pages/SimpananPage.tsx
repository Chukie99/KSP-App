import { useEffect, useState } from 'react'
import type { Anggota, Simpanan } from '../types'
import { formatRupiah, formatDateTime } from '../lib/utils'
import { Plus, Search, X } from 'lucide-react'
export default function SimpananPage() {
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([])
  const [list, setList] = useState<Simpanan[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ anggota_id: 0, jenis: 'wajib' as const, nominal: 50000, keterangan: '' })
  const [summary, setSummary] = useState({ pokok: 0, wajib: 0, sukarela: 0, total: 0 })
  const [selectedId, setSelectedId] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => { window.api.anggota.list().then(setAnggotaList) }, [])
  useEffect(() => {
    if (selectedId) { window.api.simpanan.list(selectedId).then(setList); window.api.simpanan.summary(selectedId).then(setSummary) }
    else { window.api.simpanan.list().then(setList); setSummary({ pokok: 0, wajib: 0, sukarela: 0, total: 0 }) }
  }, [selectedId])
  const filtered = list.filter(s => !search || s.nama?.toLowerCase().includes(search.toLowerCase()) || s.no_anggota?.toLowerCase().includes(search.toLowerCase()))
  const openAdd = (jenis?: string) => { setForm({ anggota_id: selectedId || 0, jenis: (jenis || 'wajib') as any, nominal: jenis === 'pokok' ? 100000 : 50000, keterangan: '' }); setError(''); setShowForm(true) }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.anggota_id) return setError('Pilih anggota')
    if (form.nominal <= 0) return setError('Nominal harus lebih dari 0')
    setLoading(true); setError('')
    const result = await window.api.simpanan.create(form)
    setLoading(false)
    if (result.error) return setError(result.error)
    setShowForm(false)
    if (selectedId) { window.api.simpanan.list(selectedId).then(setList); window.api.simpanan.summary(selectedId).then(setSummary) }
    else window.api.simpanan.list().then(setList)
  }
  return (
    <div style={{ animation: 'fadeIn 200ms ease-out' }}>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-[28px] font-bold text-[#1a1a1a]">Simpanan</h1><p className="text-[14px] text-[#616161] mt-1">Kelola simpanan anggota</p></div>
        <div className="flex gap-2">
          <button onClick={() => openAdd('wajib')} className="win-btn win-btn-primary"><Plus size={16} /> Simpanan Wajib</button>
          <button onClick={() => openAdd('sukarela')} className="win-btn win-btn-secondary"><Plus size={16} /> Sukarela</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        <div className="lg:col-span-1">
          <div className="win-card">
            <label className="win-label">Filter Anggota</label>
            <select className="win-input" value={selectedId} onChange={e => setSelectedId(Number(e.target.value))}>
              <option value={0}>Semua Anggota</option>
              {anggotaList.filter(a => a.status === 'aktif').map(a => <option key={a.id} value={a.id}>{a.no_anggota} - {a.nama}</option>)}
            </select>
            {selectedId > 0 && (
              <div className="mt-5 space-y-3">
                {([['Pokok', summary.pokok], ['Wajib', summary.wajib], ['Sukarela', summary.sukarela]] as [string, number][]).map(([l, v]) => (
                  <div key={l} className="flex justify-between text-[13px]"><span className="text-[#616161]">{l}</span><span className="font-semibold">{formatRupiah(v)}</span></div>
                ))}
                <div className="border-t border-black/5 pt-3 flex justify-between text-[14px] font-bold"><span>Total</span><span className="text-[#0078D4]">{formatRupiah(summary.total)}</span></div>
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="win-card mb-4 !p-4"><div className="relative max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" /><input type="text" className="win-input pl-10" placeholder="Cari..." value={search} onChange={e => setSearch(e.target.value)} /></div></div>
          <div className="win-card !p-0 overflow-hidden">
            <table className="win-table">
              <thead><tr><th>Tanggal</th><th>No Anggota</th><th>Nama</th><th>Jenis</th><th className="text-right">Nominal</th><th>Keterangan</th></tr></thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td className="text-[#616161] text-[13px]">{formatDateTime(s.created_at)}</td>
                    <td className="font-semibold text-[#0078D4]">{s.no_anggota}</td>
                    <td className="font-medium">{s.nama}</td>
                    <td><span className={`win-badge ${s.jenis === 'pokok' ? 'win-badge-info' : s.jenis === 'wajib' ? 'win-badge-success' : 'win-badge-warning'}`}>{s.jenis === 'pokok' ? 'Pokok' : s.jenis === 'wajib' ? 'Wajib' : 'Sukarela'}</span></td>
                    <td className="text-right font-semibold">{formatRupiah(s.nominal)}</td>
                    <td className="text-[#616161]">{s.keterangan || '-'}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-16 text-[#9e9e9e]">Tidak ada data simpanan</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {showForm && (
        <div className="win-dialog-overlay" onClick={() => setShowForm(false)}>
          <div className="win-dialog" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-[18px] font-bold">Tambah Simpanan</h3><button onClick={() => setShowForm(false)} className="win-btn win-btn-ghost p-1"><X size={18} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-lg px-4 py-3 font-medium">{error}</div>}
              <div><label className="win-label">Anggota *</label><select className="win-input" value={form.anggota_id} onChange={e => setForm({ ...form, anggota_id: Number(e.target.value) })} required><option value={0}>Pilih Anggota</option>{anggotaList.filter(a => a.status === 'aktif').map(a => <option key={a.id} value={a.id}>{a.no_anggota} - {a.nama}</option>)}</select></div>
              <div><label className="win-label">Jenis Simpanan</label><select className="win-input" value={form.jenis} onChange={e => setForm({ ...form, jenis: e.target.value as any })}><option value="pokok">Pokok (Sekali)</option><option value="wajib">Wajib (Bulanan)</option><option value="sukarela">Sukarela</option></select></div>
              <div><label className="win-label">Nominal (Rp) *</label><input type="number" className="win-input" value={form.nominal || ''} onChange={e => setForm({ ...form, nominal: Number(e.target.value) })} min={0} required /></div>
              <div><label className="win-label">Keterangan</label><input className="win-input" value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} placeholder="Opsional" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-black/5"><button type="button" onClick={() => setShowForm(false)} className="win-btn win-btn-secondary">Batal</button><button type="submit" disabled={loading} className="win-btn win-btn-primary">{loading ? 'Menyimpan...' : 'Simpan'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
