# Koperasi Simpan Pinjam

Aplikasi lengkap Koperasi Simpan Pinjam: Desktop untuk Admin/Teller, Mobile untuk Anggota.

## Download

| Platform | Link Download | Untuk |
|----------|---------------|-------|
| **Windows (.exe)** | [Download Desktop App](https://github.com/Chukie99/KSP-App/releases) | Admin & Teller |
| **Android (.apk)** | [Download Android App](https://github.com/Chukie99/KSP-App/releases) | Anggota |
| **iPhone (.ipa)** | [Download iOS App](https://github.com/Chukie99/KSP-App/releases) | Anggota |

## Arsitektur

```
┌─────────────────────┐
│  DESKTOP (Admin)    │──── SQLite ──→ sync ──→ SUPABASE
│  Electron + React   │                                │
└─────────────────────┘                                │
                                                       │
┌─────────────────────┐         baca dari ──────────────┘
│  ANDROID (Anggota)  │←────────────────────────────────┘
│  React Native       │
└─────────────────────┘

┌─────────────────────┐         baca dari ──────────────┘
│  iPHONE (Anggota)   │←────────────────────────────────┘
│  React Native       │
└─────────────────────┘
```

## Folder Struktur

```
KSP-App/
├── src/                    # Desktop App (Admin/Teller)
│   ├── main/              # Electron main process
│   └── renderer/          # React UI
├── KSP-Mobile/            # Mobile App (Anggota) - Android & iOS
│   ├── src/
│   │   ├── lib/           # Supabase config
│   │   └── screens/       # All screens
│   └── package.json
├── supabase/              # Database schema
│   └── schema.sql
└── package.json
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

## Mobile App (Anggota)

### Teknologi
- React Native + Expo
- Supabase (PostgreSQL)
- React Navigation

### Fitur
- Login dengan akun anggota
- Dashboard saldo simpanan
- Lihat detail simpanan (pokok, wajib, sukarela)
- Lihat detail pinjaman & progress
- Riwayat transaksi
- Profil anggota

### Build Mobile App

```bash
cd KSP-Mobile
npm install
eas build -p android --profile preview   # Android
eas build -p ios --profile preview       # iOS
```

## Setup Supabase

1. Buat akun di [supabase.com](https://supabase.com)
2. Buat project baru
3. Jalankan `supabase/schema.sql` di SQL Editor
4. Copy URL & Anon Key ke `KSP-Mobile/src/lib/supabase.ts`
5. Set environment variable untuk sync:
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=eyJxxx...
   ```

## Akun Demo (Desktop)

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Teller | teller1 | teller123 |
| Anggota | anggota1 | anggota123 |

## Konfigurasi Default

| Setting | Default | Deskripsi |
|---------|---------|-----------|
| Simpanan Pokok | Rp100.000 | Sekali bayar |
| Simpanan Wajib | Rp50.000/bulan | Wajib setoran |
| Bunga Pinjaman | 12%/tahun | Flat |
| Denda Keterlambatan | 0.5%/hari | Dari pokok angsuran |
