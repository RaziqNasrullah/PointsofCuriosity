/**
 * export.js
 * ---------------------------------------------------------------------------
 * Mengekspor isi tabel `catatan` dan `buku` dari database.sqlite menjadi
 * file-file JSON statis di data/, supaya bisa dibaca oleh frontend
 * read-only di GitHub Pages.
 *
 * Output:
 *   data/katalog.json          -> index catatan (untuk list & search)
 *   data/artikel/<slug>.json   -> data lengkap per catatan (+ info buku referensi)
 *   data/buku-katalog.json     -> index buku (untuk grid perpustakaan)
 *   data/buku/<slug>.json      -> data lengkap per buku (+ daftar catatan terkait)
 *
 * Jalankan:
 *   npm install
 *   npm run export
 * ---------------------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");
const { slugify } = require("./lib/slugify");

const DB_PATH = path.join(__dirname, "database.sqlite");
const OUTPUT_DIR = path.join(__dirname, "data");
const ARTIKEL_DIR = path.join(OUTPUT_DIR, "artikel");
const BUKU_DIR = path.join(OUTPUT_DIR, "buku");

// Path gambar sampul disusun relatif terhadap root project, supaya bisa
// dipakai langsung sebagai <img src="..."> dari index.html / perpustakaan.html
// yang sama-sama berada di root (folder uploads/ ikut di-commit ke git).
const GAMBAR_BASE_URL = "uploads/buku";

function sanitizeSlug(rawSlug, id, prefix = "catatan") {
  return slugify(rawSlug, `${prefix}-${id}`);
}

/**
 * Membuat ringkasan teks polos dari markdown untuk ditampilkan di mode "Card"
 * tanpa harus fetch file lengkap. Dipakai untuk isi_catatan maupun deskripsi buku.
 */
function buildRingkasan(markdown, maxLength = 160) {
  if (!markdown) return "";

  const plainText = String(markdown)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (plainText.length <= maxLength) return plainText;
  return plainText.slice(0, maxLength).trim() + "...";
}

function prepareOutputDir() {
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(ARTIKEL_DIR, { recursive: true });
  fs.mkdirSync(BUKU_DIR, { recursive: true });
}

/**
 * Membuat map slug unik dari sebuah daftar baris (catatan ATAU buku),
 * dengan fallback "<prefix>-<id>" kalau slug kosong, dan disambiguasi
 * "-<id>" kalau dua slug berbeda jadi sama setelah disanitasi.
 * Mengembalikan Map<id, slug>.
 */
function buildSlugMap(rows, prefix) {
  const map = new Map();
  const used = new Set();

  for (const row of rows) {
    let slug = sanitizeSlug(row.slug, row.id, prefix);
    if (used.has(slug)) slug = `${slug}-${row.id}`;
    used.add(slug);
    map.set(row.id, slug);
  }

  return map;
}

/**
 * Inti proses tulis-file. Dipisah dari logika baca-database supaya bisa
 * diuji secara independen dengan data tiruan.
 *
 * @param {Array} catatanRows - baris dari tabel catatan
 * @param {Array} bukuRows - baris dari tabel buku
 */
function writeExport(catatanRows, bukuRows = []) {
  prepareOutputDir();

  const bukuSlugMap = buildSlugMap(bukuRows, "buku");
  const catatanSlugMap = buildSlugMap(catatanRows, "catatan");

  // Kelompokkan catatan per buku_id, supaya halaman detail buku bisa langsung
  // menyertakan daftar catatan terkait tanpa query tambahan di frontend.
  const catatanByBukuId = new Map();
  for (const row of catatanRows) {
    if (!row.buku_id) continue;
    if (!catatanByBukuId.has(row.buku_id)) catatanByBukuId.set(row.buku_id, []);
    catatanByBukuId.get(row.buku_id).push(row);
  }

  // --- Tulis data buku ---
  const bukuKatalog = [];
  for (const row of bukuRows) {
    const slug = bukuSlugMap.get(row.id);

    bukuKatalog.push({
      id: row.id,
      judul: row.judul,
      subjudul: row.subjudul || null,
      slug,
      penulis: row.penulis || null,
      kategori: row.kategori || null,
      status_baca: row.status_baca,
      gambar_url: row.gambar ? `${GAMBAR_BASE_URL}/${row.gambar}` : null,
      tahun_terbit: row.tahun_terbit || null,
      ringkasan: buildRingkasan(row.deskripsi),
      tanggal_ditambahkan: row.tanggal_ditambahkan,
    });

    const catatanTerkait = (catatanByBukuId.get(row.id) || [])
      .map((c) => ({
        id: c.id,
        judul: c.judul,
        slug: catatanSlugMap.get(c.id),
        kategori: c.kategori,
        tanggal_dibuat: c.tanggal_dibuat,
      }))
      .sort((a, b) => new Date(b.tanggal_dibuat) - new Date(a.tanggal_dibuat));

    const bukuDetail = {
      id: row.id,
      judul: row.judul,
      subjudul: row.subjudul || null,
      slug,
      penulis: row.penulis || null,
      editor: row.editor || null,
      penerjemah: row.penerjemah || null,
      ilustrator: row.ilustrator || null,
      penerbit: row.penerbit || null,
      kota_terbit: row.kota_terbit || null,
      tahun_terbit: row.tahun_terbit || null,
      edisi: row.edisi || null,
      cetakan: row.cetakan || null,
      isbn: row.isbn || null,
      jumlah_halaman: row.jumlah_halaman || null,
      bahasa: row.bahasa || null,
      seri: row.seri || null,
      volume: row.volume || null,
      kategori: row.kategori || null,
      subjek: row.subjek || null,
      status_baca: row.status_baca,
      deskripsi: row.deskripsi || "",
      gambar_url: row.gambar ? `${GAMBAR_BASE_URL}/${row.gambar}` : null,
      tanggal_ditambahkan: row.tanggal_ditambahkan,
      catatan_terkait: catatanTerkait,
    };

    fs.writeFileSync(path.join(BUKU_DIR, `${slug}.json`), JSON.stringify(bukuDetail, null, 2), "utf-8");
  }

  bukuKatalog.sort((a, b) => new Date(b.tanggal_ditambahkan) - new Date(a.tanggal_ditambahkan));
  fs.writeFileSync(path.join(OUTPUT_DIR, "buku-katalog.json"), JSON.stringify(bukuKatalog, null, 2), "utf-8");

  // --- Tulis data catatan (dengan referensi ringan ke buku, kalau ada) ---
  const bukuById = new Map(bukuRows.map((b) => [b.id, b]));
  const katalog = [];

  for (const row of catatanRows) {
    const slug = catatanSlugMap.get(row.id);
    const bukuRef = row.buku_id && bukuById.has(row.buku_id)
      ? { slug: bukuSlugMap.get(row.buku_id), judul: bukuById.get(row.buku_id).judul }
      : null;

    katalog.push({
      id: row.id,
      judul: row.judul,
      slug,
      kategori: row.kategori,
      tanggal_dibuat: row.tanggal_dibuat,
      ringkasan: buildRingkasan(row.isi_catatan),
      buku: bukuRef,
    });

    const artikelData = {
      id: row.id,
      judul: row.judul,
      slug,
      kategori: row.kategori,
      tanggal_dibuat: row.tanggal_dibuat,
      isi_catatan: row.isi_catatan,
      buku: bukuRef,
    };

    fs.writeFileSync(path.join(ARTIKEL_DIR, `${slug}.json`), JSON.stringify(artikelData, null, 2), "utf-8");
  }

  katalog.sort((a, b) => new Date(b.tanggal_dibuat) - new Date(a.tanggal_dibuat));
  fs.writeFileSync(path.join(OUTPUT_DIR, "katalog.json"), JSON.stringify(katalog, null, 2), "utf-8");

  return {
    totalCatatan: catatanRows.length,
    totalBuku: bukuRows.length,
    katalogPath: path.join(OUTPUT_DIR, "katalog.json"),
    bukuKatalogPath: path.join(OUTPUT_DIR, "buku-katalog.json"),
  };
}

function run() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`[export.js] database.sqlite tidak ditemukan di ${DB_PATH}`);
    console.error('Jalankan "npm run seed" dulu kalau cuma mau coba-coba, atau pastikan database.sqlite ada di folder ini.');
    process.exit(1);
  }

  const Database = require("better-sqlite3");
  const db = new Database(DB_PATH, { readonly: true });

  try {
    const catatanRows = db
      .prepare(`SELECT id, judul, slug, isi_catatan, kategori, tanggal_dibuat, buku_id FROM catatan ORDER BY tanggal_dibuat DESC`)
      .all();
    const bukuRows = db
      .prepare(`SELECT * FROM buku ORDER BY tanggal_ditambahkan DESC`)
      .all();

    const result = writeExport(catatanRows, bukuRows);

    console.log(`[export.js] Berhasil. ${result.totalCatatan} catatan & ${result.totalBuku} buku diekspor.`);
    console.log(`[export.js] Katalog catatan -> ${path.relative(__dirname, result.katalogPath)}`);
    console.log(`[export.js] Katalog buku    -> ${path.relative(__dirname, result.bukuKatalogPath)}`);
    console.log(`[export.js] Artikel         -> data/artikel/`);
    console.log(`[export.js] Detail buku     -> data/buku/`);
  } finally {
    db.close();
  }
}

module.exports = { sanitizeSlug, buildRingkasan, writeExport };

if (require.main === module) {
  run();
}