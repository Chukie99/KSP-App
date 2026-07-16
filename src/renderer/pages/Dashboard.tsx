import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../store/auth'
import { formatRupiah } from '../lib/utils'
import { Users, Wallet, CreditCard, TrendingUp, Activity, AlertTriangle } from 'lucide-react'
import type { DashboardStats } from '../types'
export default function Dashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>({ totalAnggota: 0, totalSimpanan: 0, pinjamanAktif: 0, totalPinjaman: 0, transaksiHariIni: 0, pinjamanMacet: 0, totalMacet: 0, alerts: [], overdueSoon: [] })
  const loadStats = useCallback(() => { window.api.dashboard.stats().then(setStats) }, [])
  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { const interval = setInterval(loadStats, 30000); return () => clearInterval(interval) }, [loadStats])
  const cards = [
    { label: 'Total Anggota', value: String(stats.totalAnggota), icon: Users, bg: '#d0e7ff', fg: '#004e8c' },
    { label: 'Total Simpanan', value: formatRupiah(stats.totalSimpanan), icon: Wallet, bg: '#dff6dd', fg: '#0e7a0d' },
    { label: 'Pinjaman Aktif', value: String(stats.pinjamanAktif), icon: CreditCard, bg: '#fff4ce', fg: '#9d5d00' },
    { label: 'Sisa Pinjaman', value: formatRupiah(stats.totalPinjaman), icon: TrendingUp, bg: '#fde7e9', fg: '#c42b1c' },
    { label: 'Transaksi Hari Ini', value: String(stats.transaksiHariIni), icon: Activity, bg: '#e8daef', fg: '#6c3483' },
  ]
  return (
    <div style={{ animation: 'fadeIn 200ms ease-out' }}>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[#1a1a1a]">Dashboard</h1>
        <p className="text-[14px] text-[#616161] mt-1">Selamat datang, {user?.nama_lengkap}</p>
      </div>
      {stats.alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {stats.alerts.map((alert, i) => (
            <div key={i} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <AlertTriangle size={18} className="text-amber-600 shrink-0" />
              <p className="text-[13px] font-medium text-amber-800">{alert}</p>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {cards.map((card, i) => (
          <div key={i} className="win-stat">
            <div className="win-stat-icon" style={{ background: card.bg }}>
              <card.icon size={20} color={card.fg} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[#616161] truncate">{card.label}</p>
              <p className="text-[20px] font-bold text-[#1a1a1a] mt-0.5 truncate">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
      {stats.overdueSoon.length > 0 && (
        <div className="win-card">
          <h3 className="text-[15px] font-bold mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-600" /> Pinjaman Jatuh Tempo Bulan Ini</h3>
          <table className="win-table">
            <thead><tr><th>No Pinjaman</th><th>Anggota</th><th className="text-right">Sisa Pinjaman</th><th>Tenor</th></tr></thead>
            <tbody>
              {stats.overdueSoon.map((p, i) => (
                <tr key={i}>
                  <td className="font-semibold text-[#0078D4]">{p.no_pinjaman}</td>
                  <td className="font-medium">{p.nama}</td>
                  <td className="text-right font-semibold text-[#c42b1c]">{formatRupiah(p.sisa_pinjaman)}</td>
                  <td>{p.tenor} bulan</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
