/**
 * lib/schema.js
 * ---------------------------------------------------------------------------
 * Satu sumber kebenaran untuk struktur tabel `buku` dan `catatan`, dipakai
 * bersama oleh seed.js dan server.js supaya tidak ada dua definisi skema
 * yang bisa saling tidak sinkron.
 *
 * Juga menangani migrasi ringan untuk database.sqlite yang dibuat SEBELUM
 * fitur perpustakaan ini ada (yaitu yang tabel catatan-nya belum punya
 * kolom buku_id).
 * ---------------------------------------------------------------------------
 */

function ensureSchema(db) {
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS buku (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judul TEXT NOT NULL,
      subjudul TEXT,
      slug TEXT UNIQUE NOT NULL,
      penulis TEXT,
      editor TEXT,
      penerjemah TEXT,
      ilustrator TEXT,
      penerbit TEXT,
      kota_terbit TEXT,
      tahun_terbit INTEGER,
      edisi TEXT,
      cetakan TEXT,
      isbn TEXT,
      jumlah_halaman INTEGER,
      bahasa TEXT,
      seri TEXT,
      volume TEXT,
      kategori TEXT,
      subjek TEXT,
      status_baca TEXT NOT NULL DEFAULT 'ingin_dibaca',
      deskripsi TEXT,
      gambar TEXT,
      tanggal_ditambahkan DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS catatan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judul TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      isi_catatan TEXT,
      kategori TEXT,
      tanggal_dibuat DATETIME DEFAULT CURRENT_TIMESTAMP,
      buku_id INTEGER REFERENCES buku(id) ON DELETE SET NULL
    );
  `);

  // --- Migrasi untuk database.sqlite lama (dibuat sebelum fitur perpustakaan) ---
  const kolomCatatan = db.prepare("PRAGMA table_info(catatan)").all().map((c) => c.name);
  if (!kolomCatatan.includes("buku_id")) {
    db.exec(`ALTER TABLE catatan ADD COLUMN buku_id INTEGER REFERENCES buku(id) ON DELETE SET NULL`);
  }
}

const STATUS_BACA_VALID = ["ingin_dibaca", "sedang_dibaca", "sudah_dibaca"];

module.exports = { ensureSchema, STATUS_BACA_VALID };