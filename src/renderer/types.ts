export interface User {
  id: number
  username: string
  role: 'admin' | 'teller' | 'anggota'
  nama_lengkap: string
  is_active: number
  created_at: string
}

export interface Anggota {
  id: number
  no_anggota: string
  user_id: number | null
  nama: string
  nik: string
  alamat: string
  telepon: string
  email: string
  tanggal_lahir: string
  pekerjaan: string
  foto: string | null
  status: 'aktif' | 'nonaktif'
  simpanan_pokok_bayar: number
  created_at: string
  username?: string
}

export interface Simpanan {
  id: number
  anggota_id: number
  jenis: 'pokok' | 'wajib' | 'sukarela'
  nominal: number
  keterangan: string
  created_at: string
  nama?: string
  no_anggota?: string
}

export interface Pinjaman {
  id: number
  anggota_id: number
  no_pinjaman: string
  jumlah: number
  tenor: number
  bunga_persen: number
  cicilan_per_bulan: number
  sisa_pinjaman: number
  status: 'aktif' | 'lunas' | 'macet'
  tanggal_mulai: string
  keterangan: string
  created_at: string
  nama?: string
  no_anggota?: string
  total_dibayar?: number
  total_hutang?: number
  jumlah_angsuran?: number
}

export interface Pembayaran {
  id: number
  pinjaman_id: number | null
  anggota_id: number
  jenis: 'angsuran' | 'simpanan'
  nominal: number
  keterangan: string
  petugas_id: number
  created_at: string
  nama?: string
  no_anggota?: string
}

export interface DashboardStats {
  totalAnggota: number
  totalSimpanan: number
  pinjamanAktif: number
  totalPinjaman: number
  transaksiHariIni: number
  pinjamanMacet: number
  totalMacet: number
  alerts: string[]
  overdueSoon: Array<{ no_pinjaman: string; nama: string; sisa_pinjaman: number; tenor: number; tanggal_mulai: string }>
}

declare global {
  interface Window {
    api: {
      window: { minimize: () => void; maximize: () => void; close: () => void }
      auth: {
        login: (username: string, password: string) => Promise<any>
        logout: () => Promise<any>
        changePassword: (userId: number, oldPassword: string, newPassword: string) => Promise<any>
      }
      users: { list: () => Promise<User[]>; create: (d: any) => Promise<any>; update: (id: number, d: any) => Promise<any>; delete: (id: number) => Promise<any> }
      anggota: { list: () => Promise<Anggota[]>; get: (id: number) => Promise<Anggota>; create: (d: any) => Promise<any>; update: (id: number, d: any) => Promise<any>; toggleStatus: (id: number) => Promise<any>; delete: (id: number) => Promise<any> }
      simpanan: { list: (anggotaId?: number) => Promise<Simpanan[]>; create: (d: any) => Promise<any>; summary: (anggotaId: number) => Promise<any> }
      pinjaman: { list: () => Promise<Pinjaman[]>; create: (d: any) => Promise<any>; detail: (id: number) => Promise<Pinjaman> }
      pembayaran: { list: () => Promise<Pembayaran[]>; create: (d: any) => Promise<any> }
      pengaturan: { get: () => Promise<Record<string, string>>; update: (key: string, value: string) => Promise<any> }
      dashboard: { stats: () => Promise<DashboardStats> }
      laporan: {
        transaksi: (from: string, to: string) => Promise<any>
        perAnggota: (anggotaId: number) => Promise<any>
      }
      backup: { database: () => Promise<any>; restore: () => Promise<any> }
      export: { save: (content: string, name: string) => Promise<any> }
    }
  }
}
