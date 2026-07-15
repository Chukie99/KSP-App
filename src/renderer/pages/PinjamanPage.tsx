import { useEffect, useState } from 'react'
import type { Anggota, Pinjaman } from '../types'
import { formatRupiah, formatDate } from '../lib/utils'
import { Plus, Search, Eye, X } from 'lucide-react'
export default function PinjamanPage() {
  const [list, setList] = useState<Pinjaman[]>([])
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState<Pinjaman | null>(null)
  const [detailData, setDetailData] = useState<any>(null)
  const [form, setForm] = useState({ anggota_id: 0, jumlah: 0, tenor: 12, bunga_persen: 0, tanggal_mulai: new Date().toISOString().split('T')[0], keterangan: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const load = () => { window.api.pinjaman.list().then(setList); window.api.anggota.list().then(setAnggotaList) }
  useEffect(() => { load() }, [])
  const filtered = list.filter(p => p.nama?.toLowerCase().includes(search.toLowerCase()) || p.no_pinjaman.toLowerCase().includes(search.toLowerCase()))
  const cicilan = form.jumlah > 0 && form.tenor > 0 ? Math.ceil((form.jumlah + (form.jumlah * form.bunga_persen / 100)) / form.tenor) : 0
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.anggota_id || form.jumlah <= 0) return setError('Lengkapi data pinjaman')
    setLoading(true); setError('')
    const result = await window.api.pinjaman.create(form)
    setLoading(false)
    if (result.error) return setError(result.error)
    setShowForm(false); load()
  }
  const openDetail = async (p: Pinjaman) => {
    setShowDetail(p)
    const detail = await window.api.pinjaman.detail(p.id)
    setDetailData(detail)
  }
  const progress = detailData ? ((detailData.total_dibayar || 0) / (detailData.total_hutang || 1)) * 100 : 0
  return (
    <div style={{ animation: 'fadeIn 200ms ease-out' }}>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-[28px] font-bold text-[#1a1a1a]">Pinjaman</h1><p className="text-[14px] text-[#616161] mt-1">Kelola pinjaman anggota</p></div>
        <button onClick={() => { setForm({ anggota_id: 0, jumlah: 0, tenor: 12, bunga_persen: 0, tanggal_mulai: new Date().toISOString().split('T')[0], keterangan: '' }); setError(''); setShowForm(true) }} className="win-btn win-btn-primary"><Plus size={16} /> Pinjaman Baru</button>
      </div>
      <div className="win-card mb-4 !p-4"><div className="relative max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" /><input type="text" className="win-input pl-10" placeholder="Cari no pinjaman, nama..." value={search} onChange={e => setSearch(e.target.value)} /></div></div>
      <div className="win-card !p-0 overflow-hidden">
        <table className="win-table">
          <thead><tr><th>No Pinjaman</th><th>Anggota</th><th className="text-right">Jumlah</th><th>Tenor</th><th className="text-right">Cicilan/Bln</th><th className="text-right">Sisa</th><th>Status</th><th className="text-right">Aksi</th></tr></thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td className="font-semibold text-[#0078D4]">{p.no_pinjaman}</td>
                <td><p className="font-medium">{p.nama}</p><p className="text-[12px] text-[#9e9e9e]">{p.no_anggota}</p></td>
                <td className="text-right font-semibold">{formatRupiah(p.jumlah)}</td>
                <td>{p.tenor} bln</td>
                <td className="text-right">{formatRupiah(p.cicilan_per_bulan)}</td>
                <td className="text-right font-semibold">{formatRupiah(p.sisa_pinjaman)}</td>
                <td><span className={`win-badge ${p.status === 'aktif' ? 'win-badge-info' : p.status === 'lunas' ? 'win-badge-success' : 'win-badge-danger'}`}>{p.status === 'aktif' ? 'Aktif' : p.status === 'lunas' ? 'Lunas' : 'Macet'}</span></td>
                <td className="text-right"><button onClick={() => openDetail(p)} className="win-btn win-btn-ghost p-1.5"><Eye size={15} /></button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-16 text-[#9e9e9e]">Tidak ada data pinjaman</td></tr>}
          </tbody>
        </table>
      </div>
      {showDetail && (
        <div className="win-dialog-overlay" onClick={() => setShowDetail(null)}>
          <div className="win-dialog" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-[18px] font-bold">Detail {showDetail.no_pinjaman}</h3><button onClick={() => setShowDetail(null)} className="win-btn win-btn-ghost p-1"><X size={18} /></button></div>
            <div className="grid grid-cols-2 gap-4 text-[14px] mb-5">
              {([['Anggota', `${showDetail.nama} (${showDetail.no_anggota})`], ['Status', showDetail.status], ['Jumlah', formatRupiah(showDetail.jumlah)], ['Bunga', `${showDetail.bunga_persen}%`], ['Tenor', `${showDetail.tenor} bulan`], ['Cicilan/Bulan', formatRupiah(showDetail.cicilan_per_bulan)], ['Mulai', formatDate(showDetail.tanggal_mulai)]] as [string, any][]).map(([l, v]) => (
                <div key={l}><span className="text-[#9e9e9e] text-[13px]">{l}</span><p className={`font-semibold mt-0.5 ${l === 'Sisa Pinjaman' ? 'text-[#c42b1c]' : ''}`}>{v}</p></div>
              ))}
            </div>
            {detailData && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="text-[14px] font-bold">Progress Pembayaran</h4>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className={`h-3 rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : 'bg-[#0078D4]'}`} style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#616161]">Dibayar: <span className="font-semibold text-[#0e7a0d]">{formatRupiah(detailData.total_dibayar || 0)}</span></span>
                  <span className="text-[#616161]">Sisa: <span className="font-semibold text-[#c42b1c]">{formatRupiah(showDetail.sisa_pinjaman)}</span></span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#616161]">Angsuran ke: <span className="font-semibold">{detailData.jumlah_angsuran || 0}</span> dari <span className="font-semibold">{showDetail.tenor}</span></span>
                  <span className="text-[#616161]">Total hutang: <span className="font-semibold">{formatRupiah(detailData.total_hutang || 0)}</span></span>
                </div>
                <p className="text-[12px] text-[#9e9e9e]">{Math.round(progress)}% lunas</p>
              </div>
            )}
          </div>
        </div>
      )}
      {showForm && (
        <div className="win-dialog-overlay" onClick={() => setShowForm(false)}>
          <div className="win-dialog" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-[18px] font-bold">Pinjaman Baru</h3><button onClick={() => setShowForm(false)} className="win-btn win-btn-ghost p-1"><X size={18} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-lg px-4 py-3 font-medium">{error}</div>}
              <div><label className="win-label">Anggota *</label><select className="win-input" value={form.anggota_id} onChange={e => setForm({ ...form, anggota_id: Number(e.target.value) })} required><option value={0}>Pilih Anggota</option>{anggotaList.filter(a => a.status === 'aktif').map(a => <option key={a.id} value={a.id}>{a.no_anggota} - {a.nama}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="win-label">Jumlah (Rp) *</label><input type="number" className="win-input" value={form.jumlah || ''} onChange={e => setForm({ ...form, jumlah: Number(e.target.value) })} min={0} required /></div>
                <div><label className="win-label">Bunga (%)</label><input type="number" className="win-input" value={form.bunga_persen} onChange={e => setForm({ ...form, bunga_persen: Number(e.target.value) })} min={0} max={100} step={0.5} /></div>
                <div><label className="win-label">Tenor</label><select className="win-input" value={form.tenor} onChange={e => setForm({ ...form, tenor: Number(e.target.value) })}>{[6, 12, 18, 24, 36, 48, 60].map(t => <option key={t} value={t}>{t} bulan</option>)}</select></div>
                <div><label className="win-label">Tanggal Mulai</label><input type="date" className="win-input" value={form.tanggal_mulai} onChange={e => setForm({ ...form, tanggal_mulai: e.target.value })} /></div>
              </div>
              {cicilan > 0 && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4"><p className="text-[13px] text-[#616161]">Estimasi cicilan/bulan</p><p className="text-[22px] font-bold text-[#0078D4] mt-1">{formatRupiah(cicilan)}</p></div>}
              <div><label className="win-label">Keterangan</label><input className="win-input" value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} placeholder="Opsional" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-black/5"><button type="button" onClick={() => setShowForm(false)} className="win-btn win-btn-secondary">Batal</button><button type="submit" disabled={loading} className="win-btn win-btn-primary">{loading ? 'Menyimpan...' : 'Simpan'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
