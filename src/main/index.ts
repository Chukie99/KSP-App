import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import initSqlJs, { Database } from 'sql.js'
import bcrypt from 'bcryptjs'
import fs from 'fs'

const isDev = !app.isPackaged
const dbDir = isDev ? path.join(__dirname, '../../data') : path.join(process.resourcesPath, 'data')
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })
const dbPath = path.join(dbDir, 'koperasi.db')

let db: Database

// Role-based access control
let currentUserId: number | null = null
let currentUserRole: string | null = null

function isAdmin(): boolean { return currentUserRole === 'admin' }
function isTellerOrAdmin(): boolean { return currentUserRole === 'admin' || currentUserRole === 'teller' }

async function initDatabase() {
  const sqlWasmPath = path.join(__dirname, 'sql-wasm.wasm')
  const SQL = await initSqlJs({ locateFile: () => sqlWasmPath })
  if (fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath))
  } else {
    db = new SQL.Database()
  }

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','teller','anggota')),
    nama_lengkap TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS anggota (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    no_anggota TEXT UNIQUE NOT NULL,
    user_id INTEGER,
    nama TEXT NOT NULL,
    nik TEXT UNIQUE NOT NULL,
    alamat TEXT, telepon TEXT, email TEXT, tanggal_lahir TEXT, pekerjaan TEXT, foto TEXT,
    status TEXT DEFAULT 'aktif' CHECK(status IN ('aktif','nonaktif')),
    simpanan_pokok_bayar INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS pengaturan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    deskripsi TEXT
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS simpanan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anggota_id INTEGER NOT NULL,
    jenis TEXT NOT NULL CHECK(jenis IN ('pokok','wajib','sukarela')),
    nominal REAL NOT NULL,
    keterangan TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS pinjaman (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anggota_id INTEGER NOT NULL,
    no_pinjaman TEXT UNIQUE NOT NULL,
    jumlah REAL NOT NULL, tenor INTEGER NOT NULL,
    bunga_persen REAL NOT NULL DEFAULT 0,
    cicilan_per_bulan REAL NOT NULL,
    sisa_pinjaman REAL NOT NULL,
    status TEXT DEFAULT 'aktif' CHECK(status IN ('aktif','lunas','macet')),
    tanggal_mulai TEXT NOT NULL,
    keterangan TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS pembayaran (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pinjaman_id INTEGER,
    anggota_id INTEGER NOT NULL,
    jenis TEXT NOT NULL CHECK(jenis IN ('angsuran','simpanan')),
    nominal REAL NOT NULL,
    keterangan TEXT,
    petugas_id INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  )`)

  const adminCheck = db.exec("SELECT COUNT(*) as c FROM users WHERE role = 'admin'")
  if ((adminCheck[0]?.values[0]?.[0] as number) === 0) {
    const hash = bcrypt.hashSync('admin123', 10)
    db.run('INSERT INTO users (username, password, role, nama_lengkap) VALUES (?, ?, ?, ?)', ['admin', hash, 'admin', 'Administrator'])
  }

  const pengCheck = db.exec('SELECT COUNT(*) as c FROM pengaturan')
  if ((pengCheck[0]?.values[0]?.[0] as number) === 0) {
    db.run("INSERT INTO pengaturan (key, value, deskripsi) VALUES ('simpanan_pokok', '100000', 'Nominal Simpanan Pokok')")
    db.run("INSERT INTO pengaturan (key, value, deskripsi) VALUES ('simpanan_wajib', '50000', 'Nominal Simpanan Wajib per bulan')")
    db.run("INSERT INTO pengaturan (key, value, deskripsi) VALUES ('nama_koperasi', 'KSP Sejahtera', 'Nama Koperasi')")
    db.run("INSERT INTO pengaturan (key, value, deskripsi) VALUES ('alamat_koperasi', 'Jl. Merdeka No. 1', 'Alamat Koperasi')")
    db.run("INSERT INTO pengaturan (key, value, deskripsi) VALUES ('telepon_koperasi', '021-1234567', 'Telepon Koperasi')")
  }

  saveDb()
}

function saveDb() {
  const data = db.export()
  fs.writeFileSync(dbPath, Buffer.from(data))
}

function queryAll(sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params)
  const results: any[] = []
  while (stmt.step()) results.push(stmt.getAsObject())
  stmt.free()
  return results
}

function queryOne(sql: string, params: any[] = []): any | undefined {
  return queryAll(sql, params)[0]
}

function formatCurrency(num: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
}

function runSql(sql: string, params: any[] = []): number {
  db.run(sql, params)
  const lastId = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] as number
  saveDb()
  return lastId
}

// Auto-mark overdue loans as 'macet'
function checkOverdueLoans() {
  const overdue = queryAll(`
    SELECT id, no_pinjaman, anggota_id, tenor, tanggal_mulai FROM pinjaman
    WHERE status = 'aktif' AND date(tanggal_mulai, '+' || tenor || ' months') < date('now')
  `)
  for (const p of overdue) {
    db.run("UPDATE pinjaman SET status='macet' WHERE id=?", [p.id])
    console.log(`Pinjaman ${p.no_pinjaman} ditandai MACET (lewat tenor)`)
  }
  if (overdue.length > 0) saveDb()
}

// Scheduler: cek pinjaman macet setiap jam 12 malam
function startMacetScheduler() {
  const now = new Date()
  const next = new Date(now)
  next.setHours(24, 0, 0, 0)
  const ms = next.getTime() - now.getTime()
  setTimeout(() => {
    checkOverdueLoans()
    startMacetScheduler()
  }, ms)
}

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1100, minHeight: 700,
    frame: false, titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
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

app.whenReady().then(async () => {
  await initDatabase()
  checkOverdueLoans()
  startMacetScheduler()
  createWindow()
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })

// Window controls
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => { if (mainWindow?.isMaximized()) mainWindow.unmaximize(); else mainWindow?.maximize() })
ipcMain.on('window:close', () => mainWindow?.close())

// Auth
ipcMain.handle('auth:login', (_e, username: string, password: string) => {
  const user = queryOne('SELECT * FROM users WHERE username = ? AND is_active = 1', [username])
  if (!user) return { error: 'User tidak ditemukan' }
  if (!bcrypt.compareSync(password, user.password)) return { error: 'Password salah' }
  currentUserId = user.id
  currentUserRole = user.role
  let anggota: any = null
  if (user.role === 'anggota') anggota = queryOne('SELECT * FROM anggota WHERE user_id = ?', [user.id])
  return { user: { id: user.id, username: user.username, role: user.role, nama_lengkap: user.nama_lengkap }, anggota }
})

ipcMain.handle('auth:logout', () => { currentUserId = null; currentUserRole = null; return { success: true } })

ipcMain.handle('auth:change-password', (_e, userId: number, oldPassword: string, newPassword: string) => {
  try {
    const user = queryOne('SELECT * FROM users WHERE id=?', [userId])
    if (!user) return { error: 'User tidak ditemukan' }
    if (!bcrypt.compareSync(oldPassword, user.password)) return { error: 'Password lama salah' }
    if (newPassword.length < 6) return { error: 'Password baru minimal 6 karakter' }
    const h = bcrypt.hashSync(newPassword, 10)
    db.run('UPDATE users SET password=?, updated_at=datetime("now") WHERE id=?', [h, userId])
    saveDb()
    return { success: true }
  } catch (err: any) { return { error: err.message } }
})

// Users
ipcMain.handle('users:list', () => { if (!isAdmin()) return { error: 'Akses ditolak' }; return queryAll('SELECT id, username, role, nama_lengkap, is_active, created_at FROM users') })
ipcMain.handle('users:create', (_e, data: any) => {
  if (!isAdmin()) return { error: 'Hanya admin yang bisa membuat user' }
  try { const h = bcrypt.hashSync(data.password, 10); runSql('INSERT INTO users (username, password, role, nama_lengkap) VALUES (?, ?, ?, ?)', [data.username, h, data.role, data.nama_lengkap]); return { success: true } }
  catch (err: any) { return { error: err.message } }
})
ipcMain.handle('users:update', (_e, id: number, data: any) => {
  if (!isAdmin()) return { error: 'Hanya admin yang bisa mengubah user' }
  try {
    if (data.password) { const h = bcrypt.hashSync(data.password, 10); db.run('UPDATE users SET nama_lengkap=?, role=?, is_active=?, password=?, updated_at=datetime("now") WHERE id=?', [data.nama_lengkap, data.role, data.is_active ? 1 : 0, h, id]) }
    else db.run('UPDATE users SET nama_lengkap=?, role=?, is_active=?, updated_at=datetime("now") WHERE id=?', [data.nama_lengkap, data.role, data.is_active ? 1 : 0, id])
    saveDb(); return { success: true }
  } catch (err: any) { return { error: err.message } }
})
ipcMain.handle('users:delete', (_e, id: number) => {
  if (!isAdmin()) return { error: 'Hanya admin yang bisa menghapus user' }
  if (id === currentUserId) return { error: 'Tidak bisa menghapus akun sendiri' }
  try {
    const user = queryOne('SELECT role FROM users WHERE id=?', [id])
    if (user?.role === 'admin') {
      const adminCount = queryOne("SELECT COUNT(*) as c FROM users WHERE role='admin'")
      if ((adminCount?.c || 0) <= 1) return { error: 'Tidak bisa menghapus admin terakhir' }
    }
    db.run('DELETE FROM users WHERE id=?', [id]); saveDb(); return { success: true }
  } catch (err: any) { return { error: err.message } }
})

// Anggota
ipcMain.handle('anggota:list', () => queryAll('SELECT a.*, u.username FROM anggota a LEFT JOIN users u ON a.user_id=u.id ORDER BY a.no_anggota'))
ipcMain.handle('anggota:get', (_e, id: number) => queryOne('SELECT a.*, u.username FROM anggota a LEFT JOIN users u ON a.user_id=u.id WHERE a.id=?', [id]))
ipcMain.handle('anggota:create', (_e, data: any) => {
  if (!isTellerOrAdmin()) return { error: 'Akses ditolak' }
  try {
    const last = queryOne('SELECT no_anggota FROM anggota ORDER BY id DESC LIMIT 1')
    let nextNum = 1
    if (last) nextNum = parseInt(last.no_anggota.replace('KSP-', '')) + 1
    const noAnggota = `KSP-${String(nextNum).padStart(3, '0')}`
    runSql('INSERT INTO anggota (no_anggota, user_id, nama, nik, alamat, telepon, email, tanggal_lahir, pekerjaan, foto) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [noAnggota, data.user_id || null, data.nama, data.nik, data.alamat, data.telepon, data.email, data.tanggal_lahir, data.pekerjaan, data.foto || null])
    return { success: true, no_anggota: noAnggota }
  } catch (err: any) { return { error: err.message } }
})
ipcMain.handle('anggota:update', (_e, id: number, data: any) => {
  if (!isTellerOrAdmin()) return { error: 'Akses ditolak' }
  try { db.run("UPDATE anggota SET nama=?,nik=?,alamat=?,telepon=?,email=?,tanggal_lahir=?,pekerjaan=?,foto=?,status=?,updated_at=datetime('now') WHERE id=?", [data.nama, data.nik, data.alamat, data.telepon, data.email, data.tanggal_lahir, data.pekerjaan, data.foto, data.status, id]); saveDb(); return { success: true } }
  catch (err: any) { return { error: err.message } }
})
ipcMain.handle('anggota:toggle-status', (_e, id: number) => {
  if (!isTellerOrAdmin()) return { error: 'Akses ditolak' }
  try { db.run("UPDATE anggota SET status=CASE WHEN status='aktif' THEN 'nonaktif' ELSE 'aktif' END, updated_at=datetime('now') WHERE id=?", [id]); saveDb(); return { success: true } } catch (err: any) { return { error: err.message } }
})
ipcMain.handle('anggota:delete', (_e, id: number) => {
  if (!isAdmin()) return { error: 'Hanya admin yang bisa menghapus anggota' }
  try {
    const hasSimpanan = queryOne('SELECT COUNT(*) as c FROM simpanan WHERE anggota_id=?', [id])
    const hasPinjaman = queryOne('SELECT COUNT(*) as c FROM pinjaman WHERE anggota_id=?', [id])
    const hasPembayaran = queryOne('SELECT COUNT(*) as c FROM pembayaran WHERE anggota_id=?', [id])
    if ((hasSimpanan?.c || 0) > 0 || (hasPinjaman?.c || 0) > 0 || (hasPembayaran?.c || 0) > 0) {
      return { error: 'Tidak dapat menghapus anggota yang memiliki data simpanan, pinjaman, atau pembayaran' }
    }
    db.run('DELETE FROM anggota WHERE id=?', [id]); saveDb(); return { success: true }
  } catch (err: any) { return { error: err.message } }
})

// Simpanan
ipcMain.handle('simpanan:list', (_e, anggotaId?: number) => {
  if (anggotaId) return queryAll('SELECT s.*, a.nama, a.no_anggota FROM simpanan s JOIN anggota a ON s.anggota_id=a.id WHERE s.anggota_id=? ORDER BY s.created_at DESC', [anggotaId])
  return queryAll('SELECT s.*, a.nama, a.no_anggota FROM simpanan s JOIN anggota a ON s.anggota_id=a.id ORDER BY s.created_at DESC')
})
ipcMain.handle('simpanan:create', (_e, data: any) => {
  if (!isTellerOrAdmin()) return { error: 'Akses ditolak' }
  try {
    const anggota = queryOne('SELECT id FROM anggota WHERE id=? AND status="aktif"', [data.anggota_id])
    if (!anggota) return { error: 'Anggota tidak ditemukan atau tidak aktif' }
    if (data.jenis === 'pokok') {
      const existing = queryOne('SELECT id FROM simpanan WHERE anggota_id=? AND jenis="pokok"', [data.anggota_id])
      if (existing) return { error: 'Anggota sudah membayar simpanan pokok' }
    }
    runSql('INSERT INTO simpanan (anggota_id, jenis, nominal, keterangan) VALUES (?,?,?,?)', [data.anggota_id, data.jenis, data.nominal, data.keterangan || ''])
    if (data.jenis === 'pokok') { db.run('UPDATE anggota SET simpanan_pokok_bayar=1 WHERE id=?', [data.anggota_id]); saveDb() }
    return { success: true }
  } catch (err: any) { return { error: err.message } }
})
ipcMain.handle('simpanan:summary', (_e, anggotaId: number) => {
  const p = queryOne('SELECT COALESCE(SUM(nominal),0) as t FROM simpanan WHERE anggota_id=? AND jenis="pokok"', [anggotaId])
  const w = queryOne('SELECT COALESCE(SUM(nominal),0) as t FROM simpanan WHERE anggota_id=? AND jenis="wajib"', [anggotaId])
  const s = queryOne('SELECT COALESCE(SUM(nominal),0) as t FROM simpanan WHERE anggota_id=? AND jenis="sukarela"', [anggotaId])
  return { pokok: p?.t || 0, wajib: w?.t || 0, sukarela: s?.t || 0, total: (p?.t || 0) + (w?.t || 0) + (s?.t || 0) }
})

// Pinjaman
ipcMain.handle('pinjaman:list', () => queryAll('SELECT p.*, a.nama, a.no_anggota FROM pinjaman p JOIN anggota a ON p.anggota_id=a.id ORDER BY p.created_at DESC'))
ipcMain.handle('pinjaman:create', (_e, data: any) => {
  if (!isTellerOrAdmin()) return { error: 'Akses ditolak' }
  try {
    const anggota = queryOne('SELECT id FROM anggota WHERE id=? AND status="aktif"', [data.anggota_id])
    if (!anggota) return { error: 'Anggota tidak ditemukan atau tidak aktif' }
    const last = queryOne('SELECT no_pinjaman FROM pinjaman ORDER BY id DESC LIMIT 1')
    let nextNum = 1
    if (last) nextNum = parseInt(last.no_pinjaman.replace('PJ-', '')) + 1
    const noPinjaman = `PJ-${String(nextNum).padStart(3, '0')}`
    const bunga = data.jumlah * (data.bunga_persen || 0) / 100
    const totalHutang = data.jumlah + bunga
    const cicilan = Math.ceil(totalHutang / data.tenor)
    runSql('INSERT INTO pinjaman (anggota_id, no_pinjaman, jumlah, tenor, bunga_persen, cicilan_per_bulan, sisa_pinjaman, tanggal_mulai, keterangan) VALUES (?,?,?,?,?,?,?,?,?)',
      [data.anggota_id, noPinjaman, data.jumlah, data.tenor, data.bunga_persen || 0, cicilan, totalHutang, data.tanggal_mulai, data.keterangan || ''])
    return { success: true, no_pinjaman: noPinjaman }
  } catch (err: any) { return { error: err.message } }
})
ipcMain.handle('pinjaman:detail', (_e, id: number) => {
  const p = queryOne('SELECT p.*, a.nama, a.no_anggota FROM pinjaman p JOIN anggota a ON p.anggota_id=a.id WHERE p.id=?', [id])
  if (!p) return null
  const totalBayar = p.jumlah + (p.jumlah * p.bunga_persen / 100) - p.sisa_pinjaman
  const totalHutang = p.jumlah + (p.jumlah * p.bunga_persen / 100)
  const jumlahAngsuran = queryOne('SELECT COUNT(*) as c FROM pembayaran WHERE pinjaman_id=? AND jenis="angsuran"', [id])
  return { ...p, total_dibayar: totalBayar, total_hutang: totalHutang, jumlah_angsuran: jumlahAngsuran?.c || 0 }
})

// Pembayaran
ipcMain.handle('pembayaran:list', () => queryAll('SELECT p.*, a.nama, a.no_anggota FROM pembayaran p JOIN anggota a ON p.anggota_id=a.id ORDER BY p.created_at DESC'))
ipcMain.handle('pembayaran:create', (_e, data: any) => {
  if (!isTellerOrAdmin()) return { error: 'Akses ditolak' }
  try {
    const anggota = queryOne('SELECT id FROM anggota WHERE id=? AND status="aktif"', [data.anggota_id])
    if (!anggota) return { error: 'Anggota tidak ditemukan atau tidak aktif' }
    if (data.jenis === 'angsuran' && data.pinjaman_id) {
      const pinjaman = queryOne('SELECT * FROM pinjaman WHERE id=?', [data.pinjaman_id])
      if (!pinjaman) return { error: 'Pinjaman tidak ditemukan' }
      if (pinjaman.anggota_id !== data.anggota_id) return { error: 'Pinjaman tidak milik anggota ini' }
      if (pinjaman.status !== 'aktif') return { error: 'Pinjaman sudah lunas atau macet' }
      if (data.nominal <= 0) return { error: 'Nominal harus lebih dari 0' }
      if (data.nominal > pinjaman.sisa_pinjaman) return { error: `Nominal melebihi sisa pinjaman (${formatCurrency(pinjaman.sisa_pinjaman)})` }
      runSql('INSERT INTO pembayaran (pinjaman_id, anggota_id, jenis, nominal, keterangan, petugas_id) VALUES (?,?,?,?,?,?)', [data.pinjaman_id, data.anggota_id, data.jenis, data.nominal, data.keterangan || '', data.petugas_id])
      db.run('UPDATE pinjaman SET sisa_pinjaman=sisa_pinjaman-? WHERE id=?', [data.nominal, data.pinjaman_id])
      const pj = queryOne('SELECT sisa_pinjaman FROM pinjaman WHERE id=?', [data.pinjaman_id])
      if (pj && pj.sisa_pinjaman <= 0) db.run("UPDATE pinjaman SET status='lunas' WHERE id=?", [data.pinjaman_id])
      saveDb()
    } else if (data.jenis === 'simpanan') {
      runSql('INSERT INTO pembayaran (pinjaman_id, anggota_id, jenis, nominal, keterangan, petugas_id) VALUES (?,?,?,?,?,?)', [null, data.anggota_id, data.jenis, data.nominal, data.keterangan || '', data.petugas_id])
      runSql('INSERT INTO simpanan (anggota_id, jenis, nominal, keterangan) VALUES (?,?,?,?)', [data.anggota_id, data.jenis_simpanan || 'wajib', data.nominal, data.keterangan || ''])
    } else {
      runSql('INSERT INTO pembayaran (pinjaman_id, anggota_id, jenis, nominal, keterangan, petugas_id) VALUES (?,?,?,?,?,?)', [data.pinjaman_id || null, data.anggota_id, data.jenis, data.nominal, data.keterangan || '', data.petugas_id])
    }
    return { success: true }
  } catch (err: any) { return { error: err.message } }
})

// Pengaturan
ipcMain.handle('pengaturan:get', () => { const rows = queryAll('SELECT * FROM pengaturan'); const r: any = {}; rows.forEach((x: any) => { r[x.key] = x.value }); return r })
ipcMain.handle('pengaturan:update', (_e, key: string, value: string) => {
  if (!isAdmin()) return { error: 'Hanya admin yang bisa mengubah pengaturan' }
  try { db.run('UPDATE pengaturan SET value=? WHERE key=?', [value, key]); saveDb(); return { success: true } } catch (err: any) { return { error: err.message } }
})

// Dashboard
ipcMain.handle('dashboard:stats', () => {
  const totalAnggota = queryOne('SELECT COUNT(*) as c FROM anggota WHERE status="aktif"')?.c || 0
  const totalSimpanan = queryOne('SELECT COALESCE(SUM(nominal),0) as t FROM simpanan')?.t || 0
  const pinjamanAktif = queryOne('SELECT COUNT(*) as c FROM pinjaman WHERE status="aktif"')?.c || 0
  const totalPinjaman = queryOne('SELECT COALESCE(SUM(sisa_pinjaman),0) as t FROM pinjaman WHERE status="aktif"')?.t || 0
  const transaksiHariIni = queryOne("SELECT COUNT(*) as c FROM pembayaran WHERE date(created_at)=date('now')")?.c || 0
  const pinjamanMacet = queryOne('SELECT COUNT(*) as c FROM pinjaman WHERE status="macet"')?.c || 0
  const totalMacet = queryOne('SELECT COALESCE(SUM(sisa_pinjaman),0) as t FROM pinjaman WHERE status="macet"')?.t || 0
  const alerts: string[] = []
  if (pinjamanMacet > 0) alerts.push(`${pinjamanMacet} pinjaman MACET dengan total ${formatCurrency(totalMacet)}`)
  const overdueSoon = queryAll(`
    SELECT p.no_pinjaman, a.nama, p.sisa_pinjaman, p.tenor, p.tanggal_mulai
    FROM pinjaman p JOIN anggota a ON p.anggota_id=a.id
    WHERE p.status='aktif' AND date(p.tanggal_mulai, '+' || (p.tenor - 1) || ' months') <= date('now')
    AND date(p.tanggal_mulai, '+' || p.tenor || ' months') > date('now')
  `)
  if (overdueSoon.length > 0) alerts.push(`${overdueSoon.length} pinjaman akan jatuh tempo bulan ini`)
  return { totalAnggota, totalSimpanan, pinjamanAktif, totalPinjaman, transaksiHariIni, pinjamanMacet, totalMacet, alerts, overdueSoon }
})

// Laporan
ipcMain.handle('laporan:transaksi', (_e, from: string, to: string) => {
  const simpanan = queryAll('SELECT s.*, a.nama, a.no_anggota FROM simpanan s JOIN anggota a ON s.anggota_id=a.id WHERE date(s.created_at) BETWEEN ? AND ? ORDER BY s.created_at', [from, to])
  const pembayaran = queryAll('SELECT p.*, a.nama, a.no_anggota FROM pembayaran p JOIN anggota a ON p.anggota_id=a.id WHERE date(p.created_at) BETWEEN ? AND ? ORDER BY p.created_at', [from, to])
  const pinjaman = queryAll('SELECT p.*, a.nama, a.no_anggota FROM pinjaman p JOIN anggota a ON p.anggota_id=a.id WHERE date(p.created_at) BETWEEN ? AND ? ORDER BY p.created_at', [from, to])
  return { simpanan, pembayaran, pinjaman }
})

ipcMain.handle('laporan:per-anggota', (_e, anggotaId: number) => {
  const anggota = queryOne('SELECT * FROM anggota WHERE id=?', [anggotaId])
  if (!anggota) return null
  const simpanan = queryAll('SELECT * FROM simpanan WHERE anggota_id=? ORDER BY created_at', [anggotaId])
  const pinjaman = queryAll('SELECT * FROM pinjaman WHERE anggota_id=? ORDER BY created_at', [anggotaId])
  const totalSimpanan = queryOne('SELECT COALESCE(SUM(nominal),0) as t FROM simpanan WHERE anggota_id=?', [anggotaId])?.t || 0
  const totalAngsuran = queryOne('SELECT COALESCE(SUM(nominal),0) as t FROM pembayaran WHERE anggota_id=? AND jenis="angsuran"', [anggotaId])?.t || 0
  return { anggota, simpanan, pinjaman, totalSimpanan, totalAngsuran }
})

// Backup & Restore
ipcMain.handle('backup:database', async () => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: `koperasi-backup-${new Date().toISOString().split('T')[0]}.db`,
    filters: [{ name: 'SQLite Database', extensions: ['db'] }]
  })
  if (!result.canceled && result.filePath) {
    fs.copyFileSync(dbPath, result.filePath)
    return { success: true, path: result.filePath }
  }
  return { canceled: true }
})

ipcMain.handle('restore:database', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    properties: ['openFile']
  })
  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const backupPath = result.filePaths[0]
      const testDb = new (await initSqlJs()).Database(fs.readFileSync(backupPath))
      testDb.close()
      const currentDbPath = dbPath + '.backup'
      fs.copyFileSync(dbPath, currentDbPath)
      fs.copyFileSync(backupPath, dbPath)
      db.close()
      const SQL = await initSqlJs({ locateFile: () => path.join(__dirname, 'sql-wasm.wasm') })
      db = new SQL.Database(fs.readFileSync(dbPath))
      return { success: true }
    } catch (err: any) {
      return { error: 'File database tidak valid: ' + err.message }
    }
  }
  return { canceled: true }
})

// Export
ipcMain.handle('export:save', async (_e, content: string, defaultName: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, { defaultPath: defaultName, filters: [{ name: 'CSV Files', extensions: ['csv'] }] })
  if (!result.canceled && result.filePath) { fs.writeFileSync(result.filePath, content); return { success: true, path: result.filePath } }
  return { canceled: true }
})
