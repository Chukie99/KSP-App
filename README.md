# Koperasi Simpan Pinjam

Aplikasi desktop Koperasi Simpan Pinjam berbasis Electron + React + Tailwind CSS dengan SQLite portable.

## Teknologi

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Recharts
- **Backend**: Electron + vite-plugin-electron + sql.js (SQLite pure-JS)
- **Database**: SQLite (portable, tersimpan di folder aplikasi)
- **UI**: Windows 11 Fluent Design (Acrylic, Rounded Corner, Shadow)

## Fitur

- **Manajemen Anggota**: CRUD anggota dengan nomor otomatis KSP-001
- **Simpanan**: Pokok, Wajib, Sukarela dengan mutasi lengkap
- **Pinjaman**: Pengajuan, persetujuan, angsuran dengan denda keterlambatan
- **Transaksi**: Riwayat lengkap semua transaksi
- **Dashboard**: Grafik keuangan bulanan (Admin), saldo anggota
- **Laporan**: Export ke Excel (XLSX)
- **Pengaturan**: Konfigurasi simpanan, bunga, denda
- **Autentikasi**: 3 role (Admin, Teller, Anggota)

## Akun Demo

| Role     | Username  | Password   |
|----------|-----------|------------|
| Admin    | admin     | admin123   |
| Admin    | admin2    | admin123   |
| Teller   | teller1   | teller123  |
| Teller   | teller2   | teller123  |
| Anggota  | anggota1  | anggota123 |
| Anggota  | anggota2  | anggota123 |

## Cara Menjalankan (Development)

```bash
# Install dependencies
npm install

# Jalankan development mode
npm run dev

# Jalankan dengan Electron (setelah dev server start)
npm start
```

## Build Portable .exe (Windows)

```bash
# Build aplikasi
npm run electron:build
```

File `.exe` portable akan tersimpan di folder `dist-electron-out/`. Aplikasi bisa dijalankan langsung tanpa installer.

## Struktur Database

Database SQLite (`koperasi.db`) otomatis dibuat dengan struktur:

- `users` - Pengguna sistem (Admin, Teller, Anggota)
- `members` - Data anggota koperasi
- `settings` - Pengaturan sistem
- `savings` - Saldo simpanan per anggota
- `savings_transactions` - Mutasi simpanan
- `loans` - Data pinjaman
- `loan_payments` - Jadwal angsuran
- `transactions` - Log semua transaksi

## Konfigurasi Default

| Setting | Default | Deskripsi |
|---------|---------|-----------|
| Simpanan Pokok | Rp100.000 | Dibayarkan sekali |
| Simpanan Wajib | Rp50.000/bulan | Setoran wajib bulanan |
| Bunga Pinjaman | 12%/tahun | Flat |
| Denda Keterlambatan | 0.5%/hari | Dari pokok angsuran |
