import { useState, useEffect } from 'react'
import type { Anggota } from '../types'
import { formatRupiah, formatDateTime, formatDate } from '../lib/utils'
import { BarChart3, Download, Calendar, User, Database, Upload } from 'lucide-react'
export default function LaporanPage() {
  const today = new Date().toISOString().split('T')[0]
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const [from, setFrom] = useState(firstOfMonth)
  const [to, setTo] = useState(today)
  const [data, setData] = useState<{ simpanan: any[]; pembayaran: any[]; pinjaman: any[] }>({ simpanan: [], pembayaran: [], pinjaman: [] })
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'periode' | 'anggota'>('periode')
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([])
  const [selectedAnggota, setSelectedAnggota] = useState(0)
  const [anggotaReport, setAnggotaReport] = useState<any>(null)
  useEffect(() => { window.api.anggota.list().then(setAnggotaList) }, [])
  const load = async () => { setLoading(true); const r = await window.api.laporan.transaksi(from, to); setData(r); setLoading(false) }
  useEffect(() => { load() }, [])
  const loadAnggotaReport = async () => {
    if (!selectedAnggota) return
    setLoading(true)
    const r = await window.api.laporan.perAnggota(selectedAnggota)
    setAnggotaReport(r)
    setLoading(false)
  }
  const totalSimpanan = data.simpanan.reduce((s: number, x: any) => s + x.nominal, 0)
  const totalAngsuran = data.pembayaran.filter((p: any) => p.jenis === 'angsuran').reduce((s: number, x: any) => s + x.nominal, 0)
  const exportCSV = async () => {
    let csv = 'Tanggal,No Anggota,Nama,Jenis,Nominal,Keterangan\n'
    data.simpanan.forEach((s: any) => { csv += `"${formatDateTime(s.created_at)}","${s.no_anggota}","${s.nama}","Simpanan ${s.jenis}",${s.nominal},"${s.keterangan || ''}"\n` })
    data.pembayaran.forEach((p: any) => { csv += `"${formatDateTime(p.created_at)}","${p.no_anggota}","${p.nama}","${p.jenis === 'angsuran' ? 'Angsuran' : 'Simpanan'}",${p.nominal},"${p.keterangan || ''}"\n` })
    const result = await window.api.export.save(csv, `laporan-koperasi-${from}-${to}.csv`)
    if (result.success) alert('Export berhasil: ' + result.path)
  }
  const handleBackup = async () => {
    const result = await window.api.backup.database()
    if (result.success) alert('Backup berhasil: ' + result.path)
  }
  const handleRestore = async () => {
    if (!confirm('Restore akan mengganti semua data saat ini. Lanjutkan?')) return
    const result = await window.api.backup.restore()
    if (result.success) { alert('Restore berhasil! Aplikasi akan dimuat ulang.'); window.location.reload() }
    else if (result.error) alert(result.error)
  }
  const allRows = [...data.simpanan.map((s: any) => ({ ...s, _jenis: `Simpanan ${s.jenis}`, _date: s.created_at })), ...data.pembayaran.map((p: any) => ({ ...p, _jenis: p.jenis === 'angsuran' ? 'Angsuran' : 'Simpanan', _date: p.created_at }))].sort((a: any, b: any) => new Date(b._date).getTime() - new Date(a._date).getTime())
  return (
    <div style={{ animation: 'fadeIn 200ms ease-out' }}>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-[28px] font-bold text-[#1a1a1a]">Laporan & Backup</h1><p className="text-[14px] text-[#616161] mt-1">Laporan transaksi dan manajemen database</p></div>
        <div className="flex gap-2">
          <button onClick={handleBackup} className="win-btn win-btn-secondary"><Download size={16} /> Backup DB</button>
          <button onClick={handleRestore} className="win-btn win-btn-secondary"><Upload size={16} /> Restore DB</button>
          <button onClick={exportCSV} className="win-btn win-btn-primary"><Download size={16} /> Export CSV</button>
        </div>
      </div>
      <div className="flex gap-1 mb-6 bg-white rounded-lg p-1 border border-black/5 w-fit">
        {([{ id: 'periode' as const, label: 'Laporan Periode', icon: Calendar }, { id: 'anggota' as const, label: 'Laporan Per Anggota', icon: User }]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-semibold transition-all ${tab === t.id ? 'bg-[#0078D4]/10 text-[#0078D4] shadow-sm' : 'text-[#616161] hover:bg-black/5'}`}><t.icon size={14} /> {t.label}</button>
        ))}
      </div>
      {tab === 'periode' && (
        <>
          <div className="win-card mb-4">
            <div className="flex items-end gap-4">
              <div className="flex-1"><label className="win-label">Dari Tanggal</label><input type="date" className="win-input" value={from} onChange={e => setFrom(e.target.value)} /></div>
              <div className="flex-1"><label className="win-label">Sampai Tanggal</label><input type="date" className="win-input" value={to} onChange={e => setTo(e.target.value)} /></div>
              <button onClick={load} disabled={loading} className="win-btn win-btn-primary"><Calendar size={16} /> {loading ? 'Memuat...' : 'Tampilkan'}</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="win-stat"><div className="win-stat-icon" style={{ background: '#dff6dd' }}><BarChart3 size={20} color="#0e7a0d" /></div><div><p className="text-[12px] font-medium text-[#616161]">Total Simpanan</p><p className="text-[22px] font-bold text-[#0e7a0d] mt-0.5">{formatRupiah(totalSimpanan)}</p></div></div>
            <div className="win-stat"><div className="win-stat-icon" style={{ background: '#d0e7ff' }}><BarChart3 size={20} color="#004e8c" /></div><div><p className="text-[12px] font-medium text-[#616161]">Total Angsuran</p><p className="text-[22px] font-bold text-[#004e8c] mt-0.5">{formatRupiah(totalAngsuran)}</p></div></div>
          </div>
          {data.pinjaman.length > 0 && (
            <div className="win-card mb-4">
              <h3 className="text-[15px] font-bold mb-3">Pinjaman Baru ({data.pinjaman.length})</h3>
              <table className="win-table">
                <thead><tr><th>Tanggal</th><th>No Pinjaman</th><th>Anggota</th><th className="text-right">Jumlah</th><th>Status</th></tr></thead>
                <tbody>
                  {data.pinjaman.map((p: any) => (
                    <tr key={p.id}>
                      <td className="text-[#616161] text-[13px]">{formatDateTime(p.created_at)}</td>
                      <td className="font-semibold text-[#0078D4]">{p.no_pinjaman}</td>
                      <td className="font-medium">{p.nama}</td>
                      <td className="text-right font-semibold">{formatRupiah(p.jumlah)}</td>
                      <td><span className={`win-badge ${p.status === 'aktif' ? 'win-badge-info' : p.status === 'lunas' ? 'win-badge-success' : 'win-badge-danger'}`}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="win-card !p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-black/5"><h3 className="text-[15px] font-bold">Detail Transaksi</h3></div>
            <table className="win-table">
              <thead><tr><th>Tanggal</th><th>No Anggota</th><th>Nama</th><th>Jenis</th><th className="text-right">Nominal</th><th>Keterangan</th></tr></thead>
              <tbody>
                {allRows.map((item: any, i: number) => (
                  <tr key={`${item.id}-${i}`}>
                    <td className="text-[#616161] text-[13px]">{formatDateTime(item._date)}</td>
                    <td className="font-semibold text-[#0078D4]">{item.no_anggota}</td>
                    <td className="font-medium">{item.nama}</td>
                    <td><span className="win-badge win-badge-info">{item._jenis}</span></td>
                    <td className="text-right font-semibold">{formatRupiah(item.nominal)}</td>
                    <td className="text-[#616161]">{item.keterangan || '-'}</td>
                  </tr>
                ))}
                {allRows.length === 0 && <tr><td colSpan={6} className="text-center py-16 text-[#9e9e9e]">Tidak ada data transaksi pada periode ini</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
      {tab === 'anggota' && (
        <>
          <div className="win-card mb-4">
            <div className="flex items-end gap-4">
              <div className="flex-1"><label className="win-label">Pilih Anggota</label><select className="win-input" value={selectedAnggota} onChange={e => setSelectedAnggota(Number(e.target.value))}><option value={0}>Pilih Anggota</option>{anggotaList.filter(a => a.status === 'aktif').map(a => <option key={a.id} value={a.id}>{a.no_anggota} - {a.nama}</option>)}</select></div>
              <button onClick={loadAnggotaReport} disabled={loading || !selectedAnggota} className="win-btn win-btn-primary"><Calendar size={16} /> {loading ? 'Memuat...' : 'Tampilkan'}</button>
            </div>
          </div>
          {anggotaReport && (
            <>
              <div className="win-card mb-4">
                <h3 className="text-[15px] font-bold mb-3">{anggotaReport.anggota.nama} ({anggotaReport.anggota.no_anggota})</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[14px]">
                  <div><span className="text-[#9e9e9e] text-[13px]">Total Simpanan</span><p className="font-bold text-[#0e7a0d] mt-0.5">{formatRupiah(anggotaReport.totalSimpanan)}</p></div>
                  <div><span className="text-[#9e9e9e] text-[13px]">Total Angsuran</span><p className="font-bold text-[#004e8c] mt-0.5">{formatRupiah(anggotaReport.totalAngsuran)}</p></div>
                  <div><span className="text-[#9e9e9e] text-[13px]">Jumlah Pinjaman</span><p className="font-bold text-[#1a1a1a] mt-0.5">{anggotaReport.pinjaman.length}</p></div>
                  <div><span className="text-[#9e9e9e] text-[13px]">Pinjaman Aktif</span><p className="font-bold text-[#c42b1c] mt-0.5">{anggotaReport.pinjaman.filter((p: any) => p.status === 'aktif').length}</p></div>
                </div>
              </div>
              {anggotaReport.simpanan.length > 0 && (
                <div className="win-card mb-4 !p-0 overflow-hidden">
                  <div className="px-6 py-4 border-b border-black/5"><h3 className="text-[15px] font-bold">Riwayat Simpanan</h3></div>
                  <table className="win-table">
                    <thead><tr><th>Tanggal</th><th>Jenis</th><th className="text-right">Nominal</th><th>Keterangan</th></tr></thead>
                    <tbody>
                      {anggotaReport.simpanan.map((s: any) => (
                        <tr key={s.id}>
                          <td className="text-[#616161] text-[13px]">{formatDateTime(s.created_at)}</td>
                          <td><span className={`win-badge ${s.jenis === 'pokok' ? 'win-badge-info' : s.jenis === 'wajib' ? 'win-badge-success' : 'win-badge-warning'}`}>{s.jenis}</span></td>
                          <td className="text-right font-semibold">{formatRupiah(s.nominal)}</td>
                          <td className="text-[#616161]">{s.keterangan || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {anggotaReport.pinjaman.length > 0 && (
                <div className="win-card !p-0 overflow-hidden">
                  <div className="px-6 py-4 border-b border-black/5"><h3 className="text-[15px] font-bold">Riwayat Pinjaman</h3></div>
                  <table className="win-table">
                    <thead><tr><th>No Pinjaman</th><th>Tanggal</th><th className="text-right">Jumlah</th><th>Tenor</th><th className="text-right">Sisa</th><th>Status</th></tr></thead>
                    <tbody>
                      {anggotaReport.pinjaman.map((p: any) => (
                        <tr key={p.id}>
                          <td className="font-semibold text-[#0078D4]">{p.no_pinjaman}</td>
                          <td className="text-[#616161] text-[13px]">{formatDate(p.tanggal_mulai)}</td>
                          <td className="text-right font-semibold">{formatRupiah(p.jumlah)}</td>
                          <td>{p.tenor} bln</td>
                          <td className="text-right font-semibold">{formatRupiah(p.sisa_pinjaman)}</td>
                          <td><span className={`win-badge ${p.status === 'aktif' ? 'win-badge-info' : p.status === 'lunas' ? 'win-badge-success' : 'win-badge-danger'}`}>{p.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
