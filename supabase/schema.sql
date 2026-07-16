-- KSP Simpan Pinjam - Supabase Schema
-- Jalankan ini di Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','teller','anggota')),
  nama_lengkap TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anggota table
CREATE TABLE IF NOT EXISTS anggota (
  id BIGSERIAL PRIMARY KEY,
  no_anggota TEXT UNIQUE NOT NULL,
  user_id BIGINT REFERENCES users(id),
  nama TEXT NOT NULL,
  nik TEXT UNIQUE NOT NULL,
  alamat TEXT,
  telepon TEXT,
  email TEXT,
  tanggal_lahir TEXT,
  pekerjaan TEXT,
  foto TEXT,
  status TEXT DEFAULT 'aktif' CHECK(status IN ('aktif','nonaktif')),
  simpanan_pokok_bayar INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pengaturan table
CREATE TABLE IF NOT EXISTS pengaturan (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  deskripsi TEXT
);

-- Simpanan table
CREATE TABLE IF NOT EXISTS simpanan (
  id BIGSERIAL PRIMARY KEY,
  anggota_id BIGINT NOT NULL REFERENCES anggota(id),
  jenis TEXT NOT NULL CHECK(jenis IN ('pokok','wajib','sukarela')),
  nominal REAL NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pinjaman table
CREATE TABLE IF NOT EXISTS pinjaman (
  id BIGSERIAL PRIMARY KEY,
  anggota_id BIGINT NOT NULL REFERENCES anggota(id),
  no_pinjaman TEXT UNIQUE NOT NULL,
  jumlah REAL NOT NULL,
  tenor INTEGER NOT NULL,
  bunga_persen REAL NOT NULL DEFAULT 0,
  cicilan_per_bulan REAL NOT NULL,
  sisa_pinjaman REAL NOT NULL,
  status TEXT DEFAULT 'aktif' CHECK(status IN ('aktif','lunas','macet')),
  tanggal_mulai TEXT NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pembayaran table
CREATE TABLE IF NOT EXISTS pembayaran (
  id BIGSERIAL PRIMARY KEY,
  pinjaman_id BIGINT REFERENCES pinjaman(id),
  anggota_id BIGINT NOT NULL REFERENCES anggota(id),
  jenis TEXT NOT NULL CHECK(jenis IN ('angsuran','simpanan')),
  nominal REAL NOT NULL,
  keterangan TEXT,
  petugas_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_simpanan_anggota ON simpanan(anggota_id);
CREATE INDEX IF NOT EXISTS idx_simpanan_jenis ON simpanan(jenis);
CREATE INDEX IF NOT EXISTS idx_pinjaman_anggota ON pinjaman(anggota_id);
CREATE INDEX IF NOT EXISTS idx_pinjaman_status ON pinjaman(status);
CREATE INDEX IF NOT EXISTS idx_pembayaran_anggota ON pembayaran(anggota_id);
CREATE INDEX IF NOT EXISTS idx_pembayaran_pinjaman ON pembayaran(pinjaman_id);
CREATE INDEX IF NOT EXISTS idx_pembayaran_jenis ON pembayaran(jenis);
CREATE INDEX IF NOT EXISTS idx_anggota_user ON anggota(user_id);

-- Row Level Security Policies

-- Anggota can only read their own data
ALTER TABLE simpanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinjaman ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE anggota ENABLE ROW LEVEL SECURITY;

-- Policy: Anggota can read their own simpanan
CREATE POLICY "Anggota can view own simpanan" ON simpanan
  FOR SELECT USING (
    anggota_id IN (
      SELECT id FROM anggota WHERE user_id = auth.uid()
    )
  );

-- Policy: Anggota can read their own pinjaman
CREATE POLICY "Anggota can view own pinjaman" ON pinjaman
  FOR SELECT USING (
    anggota_id IN (
      SELECT id FROM anggota WHERE user_id = auth.uid()
    )
  );

-- Policy: Anggota can read their own pembayaran
CREATE POLICY "Anggota can view own pembayaran" ON pembayaran
  FOR SELECT USING (
    anggota_id IN (
      SELECT id FROM anggota WHERE user_id = auth.uid()
    )
  );

-- Policy: Anggota can read their own profile
CREATE POLICY "Anggota can view own profile" ON anggota
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Policy: Admin/Teller can read all data
CREATE POLICY "Admin/Teller can view all simpanan" ON simpanan
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'teller')
    )
  );

CREATE POLICY "Admin/Teller can view all pinjaman" ON pinjaman
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'teller')
    )
  );

CREATE POLICY "Admin/Teller can view all pembayaran" ON pembayaran
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'teller')
    )
  );

CREATE POLICY "Admin/Teller can view all anggota" ON anggota
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'teller')
    )
  );

-- Function to sync data from SQLite to Supabase
CREATE OR REPLACE FUNCTION sync_data_from_local(
  p_table_name TEXT,
  p_data JSONB
)
RETURNS void AS $$
BEGIN
  -- This function will be called from the Electron app
  -- to sync local SQLite data to Supabase
  RAISE NOTICE 'Sync data for table: %', p_table_name;
END;
$$ LANGUAGE plpgsql;

-- View for member dashboard
CREATE OR REPLACE VIEW member_dashboard AS
SELECT
  a.id as anggota_id,
  a.no_anggota,
  a.nama,
  a.status,
  COALESCE(SUM(CASE WHEN s.jenis = 'pokok' THEN s.nominal ELSE 0 END), 0) as simpanan_pokok,
  COALESCE(SUM(CASE WHEN s.jenis = 'wajib' THEN s.nominal ELSE 0 END), 0) as simpanan_wajib,
  COALESCE(SUM(CASE WHEN s.jenis = 'sukarela' THEN s.nominal ELSE 0 END), 0) as simpanan_sukarela,
  COALESCE(SUM(s.nominal), 0) as total_simpanan,
  (SELECT COUNT(*) FROM pinjaman p WHERE p.anggota_id = a.id AND p.status = 'aktif') as pinjaman_aktif,
  (SELECT COALESCE(SUM(p.sisa_pinjaman), 0) FROM pinjaman p WHERE p.anggota_id = a.id AND p.status = 'aktif') as total_sisa_pinjaman
FROM anggota a
LEFT JOIN simpanan s ON a.id = s.anggota_id
GROUP BY a.id, a.no_anggota, a.nama, a.status;
