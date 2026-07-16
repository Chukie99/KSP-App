import { createClient, SupabaseClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || ''

let supabase: SupabaseClient | null = null

export function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('Supabase not configured, sync disabled')
    return
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  console.log('Supabase initialized')
}

export async function syncAnggota(data: any[]) {
  if (!supabase) return
  try {
    const { error } = await supabase
      .from('anggota')
      .upsert(data.map(row => ({
        id: row.id,
        no_anggota: row.no_anggota,
        user_id: row.user_id,
        nama: row.nama,
        nik: row.nik,
        alamat: row.alamat,
        telepon: row.telepon,
        email: row.email,
        tanggal_lahir: row.tanggal_lahir,
        pekerjaan: row.pekerjaan,
        foto: row.foto,
        status: row.status,
        simpanan_pokok_bayar: row.simpanan_pokok_bayar,
        created_at: row.created_at,
        updated_at: row.updated_at
      })), { onConflict: 'id' })
    if (error) console.error('Sync anggota error:', error)
    else console.log(`Synced ${data.length} anggota`)
  } catch (err) {
    console.error('Sync anggota failed:', err)
  }
}

export async function syncSimpanan(data: any[]) {
  if (!supabase) return
  try {
    const { error } = await supabase
      .from('simpanan')
      .upsert(data.map(row => ({
        id: row.id,
        anggota_id: row.anggota_id,
        jenis: row.jenis,
        nominal: row.nominal,
        keterangan: row.keterangan,
        created_at: row.created_at
      })), { onConflict: 'id' })
    if (error) console.error('Sync simpanan error:', error)
    else console.log(`Synced ${data.length} simpanan`)
  } catch (err) {
    console.error('Sync simpanan failed:', err)
  }
}

export async function syncPinjaman(data: any[]) {
  if (!supabase) return
  try {
    const { error } = await supabase
      .from('pinjaman')
      .upsert(data.map(row => ({
        id: row.id,
        anggota_id: row.anggota_id,
        no_pinjaman: row.no_pinjaman,
        jumlah: row.jumlah,
        tenor: row.tenor,
        bunga_persen: row.bunga_persen,
        cicilan_per_bulan: row.cicilan_per_bulan,
        sisa_pinjaman: row.sisa_pinjaman,
        status: row.status,
        tanggal_mulai: row.tanggal_mulai,
        keterangan: row.keterangan,
        created_at: row.created_at
      })), { onConflict: 'id' })
    if (error) console.error('Sync pinjaman error:', error)
    else console.log(`Synced ${data.length} pinjaman`)
  } catch (err) {
    console.error('Sync pinjaman failed:', err)
  }
}

export async function syncPembayaran(data: any[]) {
  if (!supabase) return
  try {
    const { error } = await supabase
      .from('pembayaran')
      .upsert(data.map(row => ({
        id: row.id,
        pinjaman_id: row.pinjaman_id,
        anggota_id: row.anggota_id,
        jenis: row.jenis,
        nominal: row.nominal,
        keterangan: row.keterangan,
        petugas_id: row.petugas_id,
        created_at: row.created_at
      })), { onConflict: 'id' })
    if (error) console.error('Sync pembayaran error:', error)
    else console.log(`Synced ${data.length} pembayaran`)
  } catch (err) {
    console.error('Sync pembayaran failed:', err)
  }
}

export async function syncAllTables(db: any) {
  if (!supabase) return
  try {
    const anggota = db.exec('SELECT * FROM anggota')[0]?.values || []
    const simpanan = db.exec('SELECT * FROM simpanan')[0]?.values || []
    const pinjaman = db.exec('SELECT * FROM pinjaman')[0]?.values || []
    const pembayaran = db.exec('SELECT * FROM pembayaran')[0]?.values || []

    await syncAnggota(anggota)
    await syncSimpanan(simpanan)
    await syncPinjaman(pinjaman)
    await syncPembayaran(pembayaran)

    console.log('All tables synced to Supabase')
  } catch (err) {
    console.error('Sync all failed:', err)
  }
}
