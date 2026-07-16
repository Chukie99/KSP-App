package com.chukie99.kspmobile

data class User(
    val id: Long,
    val username: String,
    val password: String,
    val role: String,
    val nama_lengkap: String,
    val is_active: Long,
    val created_at: String,
    val updated_at: String
)

data class Anggota(
    val id: Long,
    val no_anggota: String,
    val user_id: Long?,
    val nama: String,
    val nik: String,
    val alamat: String?,
    val telepon: String?,
    val email: String?,
    val tanggal_lahir: String?,
    val pekerjaan: String?,
    val foto: String?,
    val status: String,
    val simpanan_pokok_bayar: Long,
    val created_at: String,
    val updated_at: String
)

data class Simpanan(
    val id: Long,
    val anggota_id: Long,
    val jenis: String,
    val nominal: Double,
    val keterangan: String?,
    val created_at: String
)

data class Pinjaman(
    val id: Long,
    val anggota_id: Long,
    val no_pinjaman: String,
    val jumlah: Double,
    val tenor: Long,
    val bunga_persen: Double,
    val cicilan_per_bulan: Double,
    val sisa_pinjaman: Double,
    val status: String,
    val tanggal_mulai: String,
    val keterangan: String?,
    val created_at: String
)

data class Pembayaran(
    val id: Long,
    val pinjaman_id: Long?,
    val anggota_id: Long,
    val jenis: String,
    val nominal: Double,
    val keterangan: String?,
    val petugas_id: Long?,
    val created_at: String
)

data class DashboardData(
    val anggota: Anggota?,
    val totalSimpanan: Double,
    val simpananPokok: Double,
    val simpananWajib: Double,
    val simpananSukarela: Double,
    val pinjamanAktif: Int,
    val totalSisaPinjaman: Double
)
