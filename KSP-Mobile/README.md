# KSP Simpan Pinjam - Mobile App

Aplikasi Android untuk anggota koperasi guna melihat data simpanan, pinjaman, dan riwayat transaksi.

## Teknologi

- **Framework**: React Native (Expo)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Navigation**: React Navigation

## Fitur

- **Dashboard**: Ringkasan saldo simpanan dan pinjaman aktif
- **Simpanan**: Lihat detail simpanan (pokok, wajib, sukarela)
- **Pinjaman**: Lihat detail pinjaman dan progress pembayaran
- **Riwayat**: Semua riwayat transaksi
- **Profil**: Data diri anggota

## Setup

### 1. Install Dependencies

```bash
cd KSP-Mobile
npm install
```

### 2. Setup Supabase

1. Buat akun di [supabase.com](https://supabase.com)
2. Buat project baru
3. Jalankan SQL schema dari `../supabase/schema.sql` di SQL Editor
4. Copy URL dan Anon Key dari Project Settings > API

### 3. Konfigurasi

Edit file `src/lib/supabase.ts`:

```typescript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 4. Run

```bash
# Development
npx expo start

# Build APK
eas build -p android --profile preview
```

## Struktur Folder

```
KSP-Mobile/
├── App.tsx                 # Entry point
├── src/
│   ├── lib/
│   │   └── supabase.ts    # Supabase config
│   └── screens/
│       ├── LoginScreen.tsx
│       ├── DashboardScreen.tsx
│       ├── SimpananScreen.tsx
│       ├── PinjamanScreen.tsx
│       ├── RiwayatScreen.tsx
│       └── ProfileScreen.tsx
└── package.json
```

## Sinkronisasi Data

Desktop app (Electron) akan sync data ke Supabase. Mobile app membaca langsung dari Supabase.

Untuk mengaktifkan sync, tambahkan environment variable di desktop app:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## Catatan

- Hanya anggota yang bisa login (role = 'anggota')
- Admin dan Teller menggunakan desktop app
- Data yang di-sync: anggota, simpanan, pinjaman, pembayaran
