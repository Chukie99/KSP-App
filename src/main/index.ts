import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import bcrypt from 'bcryptjs'

const isDev = !app.isPackaged

// Supabase config (di-set dari login screen)
let SUPABASE_URL = ''
let SUPABASE_KEY = ''

// Per-sender session tracking
const sessions = new Map<string, { userId: number; role: string }>()

function getSession(senderId: string) { return sessions.get(senderId) || null }
function isAdmin(senderId: string) { return getSession(senderId)?.role === 'admin' }
function isTellerOrAdmin(senderId: string) {
  const role = getSession(senderId)?.role
  return role === 'admin' || role === 'teller'
}

// Supabase API helper
async function supabaseGet(table: string, query: string = ''): Promise<any[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  })
  if (!res.ok) throw new Error(`Supabase GET error: ${res.statusText}`)
  return res.json()
}

async function supabaseInsert(table: string, data: any): Promise<any> {
  const url = `${SUPABASE_URL}/rest/v1/${table}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error(`Supabase INSERT error: ${res.statusText}`)
  return res.json()
}

async function supabaseUpdate(table: string, query: string, data: any): Promise<any> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error(`Supabase UPDATE error: ${res.statusText}`)
  return res.json()
}

async function supabaseDelete(table: string, query: string): Promise<any> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  })
  if (!res.ok) throw new Error(`Supabase DELETE error: ${res.statusText}`)
  return res.json()
}

// Window controls
let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1100, minHeight: 700,
    frame: false, titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
    backgroundColor: '#f3f3f3', show: false,
  })
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }
  mainWindow.once('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(() => { createWindow() })
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })

ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => { if (mainWindow?.isMaximized()) mainWindow.unmaximize(); else mainWindow?.maximize() })
ipcMain.on('window:close', () => mainWindow?.close())

// ============ SUPABASE CONFIG ============
ipcMain.handle('supabase:connect', (_e, url: string, key: string) => {
  SUPABASE_URL = url.endsWith('/') ? url.slice(0, -1) : url
  SUPABASE_KEY = key
  return { success: true }
})

ipcMain.handle('supabase:check', () => {
  return { connected: !!SUPABASE_URL && !!SUPABASE_KEY }
})

// ============ AUTH ============
ipcMain.handle('auth:login', async (_e, username: string, password: string) => {
  try {
    if (!SUPABASE_URL) return { error: 'Belum koneksi ke Supabase' }
    const users = await supabaseGet('users', `username=eq.${username}&is_active=eq.1`)
    if (!users.length) return { error: 'User tidak ditemukan' }
    const user = users[0]
    if (!bcrypt.compareSync(password, user.password)) return { error: 'Password salah' }

    const senderId = String(Math.random())
    sessions.set(senderId, { userId: user.id, role: user.role })

    let anggota: any = null
    if (user.role === 'anggota') {
      const anggotaList = await supabaseGet('anggota', `user_id=eq.${user.id}`)
      anggota = anggotaList[0] || null
    }

    return {
      user: { id: user.id, username: user.username, role: user.role, nama_lengkap: user.nama_lengkap },
      anggota
    }
  } catch (err: any) {
    return { error: 'Gagal login: ' + err.message }
  }
})

ipcMain.handle('auth:logout', () => { sessions.clear(); return { success: true } })

// ============ USERS ============
ipcMain.handle('users:list', async () => {
  try {
    return await supabaseGet('users', 'select=id,username,role,nama_lengkap,is_active,created_at')
  } catch (err: any) { return { error: err.message } }
})

ipcMain.handle('users:create', async (_e, data: any) => {
  try {
    const hash = bcrypt.hashSync(data.password, 10)
    await supabaseInsert('users', {
      username: data.username, password: hash, role: data.role, nama_lengkap: data.nama_lengkap
    })
    return { success: true }
  } catch (err: any) { return { error: err.message } }
})

ipcMain.handle('users:update', async (_e, id: number, data: any) => {
  try {
    const updateData: any = { nama_lengkap: data.nama_lengkap, role: data.role, is_active: data.is_active ? 1 : 0 }
    if (data.password) updateData.password = bcrypt.hashSync(data.password, 10)
    await supabaseUpdate('users', `id=eq.${id}`, updateData)
    return { success: true }
  } catch (err: any) { return { error: err.message } }
})

ipcMain.handle('users:delete', async (_e, id: number) => {
  try {
    await supabaseDelete('users', `id=eq.${id}`)
    return { success: true }
  } catch (err: any) { return { error: err.message } }
})

// ============ ANGGOTA ============
ipcMain.handle('anggota:list', async () => {
  try {
    return await supabaseGet('anggota', 'order=no_anggota')
  } catch (err: any) { return { error: err.message } }
})

ipcMain.handle('anggota:get', async (_e, id: number) => {
  try {
    const list = await supabaseGet('anggota', `id=eq.${id}`)
    return list[0] || null
  } catch (err: any) { return { error: err.message } }
})

ipcMain.handle('anggota:create', async (_e, data: any) => {
  try {
    const allAnggota = await supabaseGet('anggota', 'select=no_anggota&order=id.desc&limit=1')
    let nextNum = 1
    if (allAnggota.length) nextNum = parseInt(allAnggota[0].no_anggota.replace('KSP-', '')) + 1
    const noAnggota = `KSP-${String(nextNum).padStart(3, '0')}`

    await supabaseInsert('anggota', {
      no_anggota: noAnggota, user_id: data.user_id || null, nama: data.nama, nik: data.nik,
      alamat: data.alamat, telepon: data.telepon, email: data.email,
      tanggal_lahir: data.tanggal_lahir, pekerjaan: data.pekerjaan
    })
    return { success: true, no_anggota: noAnggota }
  } catch (err: any) { return { error: err.message } }
})

ipcMain.handle('anggota:update', async (_e, id: number, data: any) => {
  try {
    await supabaseUpdate('anggota', `id=eq.${id}`, {
      nama: data.nama, nik: data.nik, alamat: data.alamat, telepon: data.telepon,
      email: data.email, tanggal_lahir: data.tanggal_lahir, pekerjaan: data.pekerjaan, status: data.status
    })
    return { success: true }
  } catch (err: any) { return { error: err.message } }
})

ipcMain.handle('anggota:toggle-status', async (_e, id: number) => {
  try {
    const anggota = await supabaseGet('anggota', `id=eq.${id}`)
    if (anggota.length) {
      const newStatus = anggota[0].status === 'aktif' ? 'nonaktif' : 'aktif'
      await supabaseUpdate('anggota', `id=eq.${id}`, { status: newStatus })
    }
    return { success: true }
  } catch (err: any) { return { error: err.message } }
})

ipcMain.handle('anggota:delete', async (_e, id: number) => {
  try {
    await supabaseDelete('anggota', `id=eq.${id}`)
    return { success: true }
  } catch (err: any) { return { error: err.message } }
})

// ============ SIMPANAN ============
ipcMain.handle('simpanan:list', async (_e, anggotaId?: number) => {
  try {
    const query = anggotaId ? `anggota_id=eq.${anggotaId}&order=created_at.desc` : 'order=created_at.desc'
    return await supabaseGet('simpanan', query)
  } catch (err: any) { return { error: err.message } }
})

ipcMain.handle('simpanan:create', async (_e, data: any) => {
  try {
    await supabaseInsert('simpanan', {
      anggota_id: data.anggota_id, jenis: data.jenis, nominal: data.nominal, keterangan: data.keterangan || ''
    })
    if (data.jenis === 'pokok') {
      await supabaseUpdate('anggota', `id=eq.${data.anggota_id}`, { simpanan_pokok_bayar: 1 })
    }
    return { success: true }
  } catch (err: any) { return { error: err.message } }
})

ipcMain.handle('simpanan:summary', async (_e, anggotaId: number) => {
  try {
    const all = await supabaseGet('simpanan', `anggota_id=eq.${anggotaId}`)
    const pokok = all.filter(s => s.jenis === 'pokok').reduce((sum, s) => sum + s.nominal, 0)
    const wajib = all.filter(s => s.jenis === 'wajib').reduce((sum, s) => sum + s.nominal, 0)
    const sukarela = all.filter(s => s.jenis === 'sukarela').reduce((sum, s) => sum + s.nominal, 0)
    return { pokok, wajib, sukarela, total: pokok + wajib + sukarela }
  } catch (err: any) { return { error: err.message } }
})

// ============ PINJAMAN ============
ipcMain.handle('pinjaman:list', async () => {
  try {
    return await supabaseGet('pinjaman', 'order=created_at.desc')
  } catch (err: any) { return { error: err.message } }
})

ipcMain.handle('pinjaman:create', async (_e, data: any) => {
  try {
    const allPinjaman = await supabaseGet('pinjaman', 'select=no_pinjaman&order=id.desc&limit=1')
    let nextNum = 1
    if (allPinjaman.length) nextNum = parseInt(allPinjaman[0].no_pinjaman.replace('PJ-', '')) + 1
    const noPinjaman = `PJ-${String(nextNum).padStart(3, '0')}`

    const bunga = data.jumlah * (data.bunga_persen || 0) / 100
    const totalHutang = data.jumlah + bunga
    const cicilan = Math.ceil(totalHutang / data.tenor)

    await supabaseInsert('pinjaman', {
      anggota_id: data.anggota_id, no_pinjaman: noPinjaman, jumlah: data.jumlah,
      tenor: data.tenor, bunga_persen: data.bunga_persen || 0, cicilan_per_bulan: cicilan,
      sisa_pinjaman: totalHutang, tanggal_mulai: data.tanggal_mulai, keterangan: data.keterangan || ''
    })
    return { success: true, no_pinjaman: noPinjaman }
  } catch (err: any) { return { error: err.message } }
})

ipcMain.handle('pinjaman:detail', async (_e, id: number) => {
  try {
    const list = await supabaseGet('pinjaman', `id=eq.${id}`)
    if (!list.length) return null
    const p = list[0]
    const totalHutang = p.jumlah + (p.jumlah * p.bunga_persen / 100)
    const totalBayar = totalHutang - p.sisa_pinjaman
    const angsuran = await supabaseGet('pembayaran', `pinjaman_id=eq.${id}&jenis=eq.angsuran`)
    return { ...p, total_dibayar: totalBayar, total_hutang: totalHutang, jumlah_angsuran: angsuran.length }
  } catch (err: any) { return { error: err.message } }
})

// ============ PEMBAYARAN ============
ipcMain.handle('pembayaran:list', async () => {
  try {
    return await supabaseGet('pembayaran', 'order=created_at.desc')
  } catch (err: any) { return { error: err.message } }
})

ipcMain.handle('pembayaran:create', async (_e, data: any) => {
  try {
    if (data.jenis === 'angsuran' && data.pinjaman_id) {
      const pinjamanList = await supabaseGet('pinjaman', `id=eq.${data.pinjaman_id}`)
      if (!pinjamanList.length) return { error: 'Pinjaman tidak ditemukan' }
      const pinjaman = pinjamanList[0]

      if (data.nominal > pinjaman.sisa_pinjaman) return { error: 'Nominal melebihi sisa pinjaman' }

      await supabaseInsert('pembayaran', {
        pinjaman_id: data.pinjaman_id, anggota_id: data.anggota_id, jenis: 'angsuran',
        nominal: data.nominal, keterangan: data.keterangan || ''
      })

      const newSisa = pinjaman.sisa_pinjaman - data.nominal
      const updateData: any = { sisa_pinjaman: newSisa }
      if (newSisa <= 0) updateData.status = 'lunas'
      await supabaseUpdate('pinjaman', `id=eq.${data.pinjaman_id}`, updateData)

    } else if (data.jenis === 'simpanan') {
      await supabaseInsert('pembayaran', {
        anggota_id: data.anggota_id, jenis: 'simpanan', nominal: data.nominal, keterangan: data.keterangan || ''
      })
      await supabaseInsert('simpanan', {
        anggota_id: data.anggota_id, jenis: data.jenis_simpanan || 'wajib',
        nominal: data.nominal, keterangan: data.keterangan || ''
      })
    }
    return { success: true }
  } catch (err: any) { return { error: err.message } }
})

// ============ PENGATURAN ============
ipcMain.handle('pengaturan:get', async () => {
  try {
    const rows = await supabaseGet('pengaturan')
    const result: any = {}
    rows.forEach((r: any) => { result[r.key] = r.value })
    return result
  } catch (err: any) { return { error: err.message } }
})

ipcMain.handle('pengaturan:update', async (_e, key: string, value: string) => {
  try {
    await supabaseUpdate('pengaturan', `key=eq.${key}`, { value })
    return { success: true }
  } catch (err: any) { return { error: err.message } }
})

// ============ DASHBOARD ============
ipcMain.handle('dashboard:stats', async () => {
  try {
    const anggota = await supabaseGet('anggota', `status=eq.aktif`)
    const simpanan = await supabaseGet('simpanan')
    const pinjaman = await supabaseGet('pinjaman')

    const totalSimpanan = simpanan.reduce((sum: number, s: any) => sum + s.nominal, 0)
    const pinjamanAktif = pinjaman.filter((p: any) => p.status === 'aktif')
    const totalPinjaman = pinjamanAktif.reduce((sum: number, p: any) => sum + p.sisa_pinjaman, 0)
    const pinjamanMacet = pinjaman.filter((p: any) => p.status === 'macet')
    const totalMacet = pinjamanMacet.reduce((sum: number, p: any) => sum + p.sisa_pinjaman, 0)

    return {
      totalAnggota: anggota.length, totalSimpanan,
      pinjamanAktif: pinjamanAktif.length, totalPinjaman,
      transaksiHariIni: 0, pinjamanMacet: pinjamanMacet.length, totalMacet,
      alerts: pinjamanMacet.length > 0 ? [`${pinjamanMacet.length} pinjaman MACET`] : [],
      overdueSoon: []
    }
  } catch (err: any) { return { error: err.message } }
})

// ============ LAPORAN ============
ipcMain.handle('laporan:transaksi', async (_e, from: string, to: string) => {
  try {
    const simpanan = await supabaseGet('simpanan', `created_at=gte.${from}&created_at=lte.${to}`)
    const pembayaran = await supabaseGet('pembayaran', `created_at=gte.${from}&created_at=lte.${to}`)
    return { simpanan, pembayaran }
  } catch (err: any) { return { error: err.message } }
})

ipcMain.handle('laporan:per-anggota', async (_e, anggotaId: number) => {
  try {
    const anggotaList = await supabaseGet('anggota', `id=eq.${anggotaId}`)
    const simpanan = await supabaseGet('simpanan', `anggota_id=eq.${anggotaId}`)
    const pinjaman = await supabaseGet('pinjaman', `anggota_id=eq.${anggotaId}`)
    const totalSimpanan = simpanan.reduce((sum: number, s: any) => sum + s.nominal, 0)
    const totalAngsuran = (await supabaseGet('pembayaran', `anggota_id=eq.${anggotaId}&jenis=eq.angsuran`))
      .reduce((sum: number, p: any) => sum + p.nominal, 0)
    return { anggota: anggotaList[0], simpanan, pinjaman, totalSimpanan, totalAngsuran }
  } catch (err: any) { return { error: err.message } }
})

// ============ EXPORT ============
ipcMain.handle('export:save', async (_e, content: string, defaultName: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, { defaultPath: defaultName, filters: [{ name: 'CSV Files', extensions: ['csv'] }] })
  if (!result.canceled && result.filePath) {
    const fs = await import('fs')
    fs.writeFileSync(result.filePath, content)
    return { success: true, path: result.filePath }
  }
  return { canceled: true }
})
