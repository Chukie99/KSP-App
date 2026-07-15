import { useEffect, useState } from 'react'
import type { Anggota, Pinjaman, Pembayaran } from '../types'
import { formatRupiah, formatDateTime } from '../lib/utils'
import { Plus, Search, X } from 'lucide-react'
export default function PembayaranPage() {
  const [list, setList] = useState<Pembayaran[]>([])
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([])
  const [pinjamanList, setPinjamanList] = useState<Pinjaman[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ anggota_id: 0, pinjaman_id: 0, jenis: 'angsuran' as const, nominal: 0, keterangan: '', jenis_simpanan: 'wajib' as const })
  const [selectedPinjaman, setSelectedPinjaman] = useState<Pinjaman | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const load = () => { window.api.pembayaran.list().then(setList); window.api.anggota.list().then(setAnggotaList); window.api.pinjaman.list().then(setPinjamanList) }
  useEffect(() => { load() }, [])
  const activePinjaman = pinjamanList.filter(p => p.status === 'aktif')
  const anggotaPinjaman = form.anggota_id ? activePinjaman.filter(p => p.anggota_id === form.anggota_id) : []
  useEffect(() => {
    if (form.pinjaman_id) {
      const p = anggotaPinjaman.find(x => x.id === form.pinjaman_id)
      setSelectedPinjaman(p || null)
      if (p && form.nominal === 0) setForm(f => ({ ...f, nominal: p.cicilan_per_bulan }))
    } else {
      setSelectedPinjaman(null)
    }
  }, [form.pinjaman_id])
  const filtered = list.filter(p => !search || p.nama?.toLowerCase().includes(search.toLowerCase()) || p.no_anggota?.toLowerCase().includes(search.toLowerCase()))
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.anggota_id || form.nominal <= 0) return setError('Lengkapi data pembayaran')
    if (form.jenis === 'angsuran' && !form.pinjaman_id) return setError('Pilih pinjaman untuk angsuran')
    setLoading(true); setError('')
    const payload: any = { ...form, pinjaman_id: form.jenis === 'angsuran' ? form.pinjaman_id : null }
    if (form.jenis === 'simpanan') payload.jenis_simpanan = form.jenis_simpanan
    const result = await window.api.pembayaran.create(payload)
    setLoading(false)
    if (result.error) return setError(result.error)
    setShowForm(false); load()
  }
  return (
    <div style={{ animation: 'fadeIn 200ms ease-out' }}>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-[28px] font-bold text-[#1a1a1a]">Pembayaran</h1><p className="text-[14px] text-[#616161] mt-1">Catat pembayaran angsuran dan simpanan</p></div>
        <button onClick={() => { setForm({ anggota_id: 0, pinjaman_id: 0, jenis: 'angsuran', nominal: 0, keterangan: '', jenis_simpanan: 'wajib' }); setError(''); setShowForm(true) }} className="win-btn win-btn-primary"><Plus size={16} /> Pembayaran Baru</button>
      </div>
      <div className="win-card mb-4 !p-4"><div className="relative max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" /><input type="text" className="win-input pl-10" placeholder="Cari nama, no anggota..." value={search} onChange={e => setSearch(e.target.value)} /></div></div>
      <div className="win-card !p-0 overflow-hidden">
        <table className="win-table">
          <thead><tr><th>Tanggal</th><th>Anggota</th><th>Jenis</th><th className="text-right">Nominal</th><th>Keterangan</th></tr></thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td className="text-[#616161] text-[13px]">{formatDateTime(p.created_at)}</td>
                <td><p className="font-medium">{p.nama}</p><p className="text-[12px] text-[#9e9e9e]">{p.no_anggota}</p></td>
                <td><span className={`win-badge ${p.jenis === 'angsuran' ? 'win-badge-info' : 'win-badge-success'}`}>{p.jenis === 'angsuran' ? 'Angsuran' : 'Simpanan'}</span></td>
                <td className="text-right font-semibold">{formatRupiah(p.nominal)}</td>
                <td className="text-[#616161]">{p.keterangan || '-'}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-16 text-[#9e9e9e]">Tidak ada data pembayaran</td></tr>}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div className="win-dialog-overlay" onClick={() => setShowForm(false)}>
          <div className="win-dialog" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-[18px] font-bold">Pembayaran Baru</h3><button onClick={() => setShowForm(false)} className="win-btn win-btn-ghost p-1"><X size={18} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-lg px-4 py-3 font-medium">{error}</div>}
              <div><label className="win-label">Jenis Pembayaran *</label><select className="win-input" value={form.jenis} onChange={e => setForm({ ...form, jenis: e.target.value as any, pinjaman_id: 0, nominal: 0 })}><option value="angsuran">Angsuran Pinjaman</option><option value="simpanan">Simpanan</option></select></div>
              <div><label className="win-label">Anggota *</label><select className="win-input" value={form.anggota_id} onChange={e => setForm({ ...form, anggota_id: Number(e.target.value), pinjaman_id: 0, nominal: 0 })} required><option value={0}>Pilih Anggota</option>{anggotaList.filter(a => a.status === 'aktif').map(a => <option key={a.id} value={a.id}>{a.no_anggota} - {a.nama}</option>)}</select></div>
              {form.jenis === 'angsuran' && form.anggota_id > 0 && (
                <div>
                  <label className="win-label">Pinjaman *</label>
                  <select className="win-input" value={form.pinjaman_id} onChange={e => setForm({ ...form, pinjaman_id: Number(e.target.value) })} required>
                    <option value={0}>Pilih Pinjaman</option>
                    {anggotaPinjaman.map(p => <option key={p.id} value={p.id}>{p.no_pinjaman} - Sisa: {formatRupiah(p.sisa_pinjaman)}</option>)}
                  </select>
                  {selectedPinjaman && <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2 text-[13px]"><p>Cicilan/bulan: <span className="font-bold">{formatRupiah(selectedPinjaman.cicilan_per_bulan)}</span></p><p>Sisa: <span className="font-bold text-[#c42b1c]">{formatRupiah(selectedPinjaman.sisa_pinjaman)}</span></p></div>}
                  {form.anggota_id > 0 && anggotaPinjaman.length === 0 && <p className="text-[13px] text-[#9e9e9e] mt-2">Tidak ada pinjaman aktif untuk anggota ini</p>}
                </div>
              )}
              {form.jenis === 'simpanan' && (
                <div><label className="win-label">Jenis Simpanan</label><select className="win-input" value={form.jenis_simpanan} onChange={e => setForm({ ...form, jenis_simpanan: e.target.value as any })}><option value="wajib">Wajib (Bulanan)</option><option value="sukarela">Sukarela</option></select></div>
              )}
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
