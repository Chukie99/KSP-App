# Koperasi Simpan Pinjam

Aplikasi lengkap Koperasi Simpin Pinjam: Desktop untuk Admin/Teller, Mobile untuk Anggota.

## Download

| Platform | Link Download | Untuk |
|----------|---------------|-------|
| **Windows (.exe)** | [Download Desktop App](https://github.com/Chukie99/KSP-App/releases) | Admin & Teller |
| **Android (.apk)** | [Download Android App](https://github.com/Chukie99/KSP-App/releases) | Anggota |

## Arsitektur

```
┌─────────────────────┐
│  DESKTOP (Admin)    │──── SQLite ──→ sync ──→ SUPABASE
│  Electron + React   │                                │
└─────────────────────┘                                │
                                                       │
┌─────────────────────┐         baca dari ──────────────┘
│  ANDROID (Anggota)  │←────────────────────────────────┘
│  Kotlin + OkHttp    │
└─────────────────────┘
```

---

## TUTORIAL SETUP SUPABASE (WAJIB DIBACA)

### Langkah 1: Buat Akun Supabase

1. Buka https://supabase.com
2. Klik **"Start your project"**
3. Login pakai **GitHub** (recommended) atau email
4. Setelah masuk, klik **"New Project"**
5. Isi form:
   - **Organization**: pilih atau buat baru
   - **Project name**: `ksp-app`
   - **Database Password**: buat password (ingat simpan!)
   - **Region**: pilih **Southeast Asia (Singapore)** atau terdekat
6. Klik **"Create new project"**
7. Tunggu 1-2 menit sampai project selesai dibuat

### Langkah 2: Jalankan Database Schema

1. Di dashboard Supabase, klik menu **"SQL Editor"** (di kiri)
2. Klik **"New query"**
3. Buka file `supabase/schema.sql` dari repository ini
4. Copy **seluruh isi** file tersebut
5. Paste ke SQL Editor di Supabase
6. Klik **"Run"** (tombol pojok kanan bawah)
7. Tunggu sampai selesai (harusnya 2-5 detik)
8. Kalau sukses, akan muncul tulisan "Success. No rows returned"

### Langkah 3: Ambil API URL & Anon Key

1. Di dashboard Supabase, klik menu **"Project Settings"** (ikon gear di kiri bawah)
2. Klik **"API"** di menu kiri
3. Di bagian **"Project URL"**, copy URL-nya. Contoh:
   ```
   https://abcdefg.supabase.co
   ```
4. Di bagian **"Project API keys"**, copy **"anon"** key. Contoh:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Langkah 4: Update Config Android App

1. Buka file `KSP-Mobile-Android/app/src/main/java/com/chukie99/kspmobile/ApiClient.kt`
2. Ganti bagian ini:
   ```kotlin
   const val SUPABASE_URL = "https://your-project.supabase.co"
   const val SUPABASE_KEY = "your-anon-key"
   ```
   Menjadi:
   ```kotlin
   const val SUPABASE_URL = "https://abcdefg.supabase.co"  // URL dari Langkah 3
   const val SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIs..."       // Anon Key dari Langkah 3
   ```
3. Save file

### Langkah 5: Build APK

```bash
cd "KSP-Mobile-Android"
gradlew.bat assembleDebug
```

APK jadi di: `app/build/outputs/apk/debug/app-debug.apk`

### Langkah 6: Install di HP Android

1. Copy file APK ke HP (via USB, Bluetooth, atau WhatsApp)
2. Buka file APK di HP
3. Kalau muncul peringatan "Install dari sumber tidak dikenal", klik **"Izinkan"**
4. Tunggu instalasi selesai
5. Buka aplikasi **KSP Simpan Pinjam**

### Langkah 7: Login di HP

Saat pertama kali buka app, anggota akan melihat 3 field:

| Field | Isi | Keterangan |
|-------|-----|------------|
| **Link Supabase** | `https://xxxxx.supabase.co` | Link dari admin |
| **NIK** | 16 digit NIK | NIK anggota |
| **Password** | `ksp123` | Default password |

**Link Supabase** akan otomatis tersimpan, jadi login berikutnya tinggal isi NIK & Password.

---

## Cara Login Anggota di HP

Anggota login dengan cara:
1. Buka app **KSP Simpan Pinjam**
2. Masukkan **Link Supabase** (dari admin): `https://xxxxx.supabase.co`
3. Masukkan **NIK** (16 digit)
4. Masukkan **Password**: `ksp123` (default)
5. Klik **Masuk**

**Catatan:**
- Link Supabase hanya perlu dimasukkan sekali saja, akan tersimpan otomatis
- Password default adalah `ksp123`
- Anggota hanya bisa melihat data sendiri

---

## Folder Struktur

```
KSP-App/
├── src/                    # Desktop App (Admin/Teller)
│   ├── main/              # Electron main process
│   └── renderer/          # React UI
├── KSP-Mobile-Android/    # Android App (Anggota) - Kotlin
│   └── app/src/main/
│       ├── java/          # Kotlin source
│       └── res/           # Layout & drawable
├── supabase/
│   └── schema.sql         # Database schema
└── README.md
```

## Desktop App (Admin/Teller)

### Teknologi
- React 18 + TypeScript + Tailwind CSS
- Electron + SQLite (sql.js)
- UI: Windows 11 Fluent Design

### Fitur
- Manajemen Anggota (CRUD)
- Simpanan (Pokok, Wajib, Sukarela)
- Pinjaman (Pengajuan, Angsuran, Denda)
- Transaksi & Riwayat
- Dashboard & Laporan
- Export ke Excel
- Backup & Restore Database
- 3 Role: Admin, Teller, Anggota

### Build Desktop App

```bash
npm install
npm run build:win
```

File `.exe` tersimpan di folder `build/`.

## Akun Demo (Desktop)

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Teller | teller1 | teller123 |

## Konfigurasi Default

| Setting | Default | Deskripsi |
|---------|---------|-----------|
| Simpanan Pokok | Rp100.000 | Sekali bayar |
| Simpanan Wajib | Rp50.000/bulan | Wajib setoran |
| Bunga Pinjaman | 12%/tahun | Flat |
| Denda Keterlambatan | 0.5%/hari | Dari pokok angsuran |
