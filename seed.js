/**
 * seed.js (OPSIONAL — alat bantu development)
 * ---------------------------------------------------------------------------
 * Membuat database.sqlite contoh berisi tabel `buku` + `catatan`, lengkap
 * dengan beberapa baris dummy yang SUDAH saling terkait (beberapa catatan
 * punya buku_id, beberapa tidak) — supaya fitur relasi catatan<->buku bisa
 * langsung dicoba tanpa input manual dulu.
 *
 * Jalankan:
 *   npm run seed
 * ---------------------------------------------------------------------------
 */

const path = require("path");
const Database = require("better-sqlite3");
const { ensureSchema } = require("./lib/schema");

const DB_PATH = path.join(__dirname, "database.sqlite");
const db = new Database(DB_PATH);
ensureSchema(db);

const bukuList = [
  {
    judul: "Sapiens: Riwayat Singkat Umat Manusia",
    slug: "sapiens-riwayat-singkat-umat-manusia",
    penulis: "Yuval Noah Harari",
    penerjemah: "Damaring Tyas Wulandari Palar",
    penerbit: "KPG (Kepustakaan Populer Gramedia)",
    kota_terbit: "Jakarta",
    tahun_terbit: 2017,
    cetakan: "Cetakan ke-5",
    jumlah_halaman: 588,
    bahasa: "Indonesia",
    kategori: "Sejarah",
    subjek: "antropologi, evolusi, peradaban",
    status_baca: "sudah_dibaca",
    deskripsi:
      "Menelusuri perjalanan Homo sapiens dari pemburu-pengumpul hingga penguasa planet, menyoroti bagaimana mitos bersama, pertanian, dan ilmu pengetahuan membentuk peradaban manusia.",
  },
  {
    judul: "Thinking, Fast and Slow",
    slug: "thinking-fast-and-slow",
    penulis: "Daniel Kahneman",
    penerbit: "Farrar, Straus and Giroux",
    kota_terbit: "New York",
    tahun_terbit: 2011,
    jumlah_halaman: 499,
    bahasa: "Inggris",
    kategori: "Psikologi",
    subjek: "psikologi kognitif, pengambilan keputusan",
    status_baca: "sudah_dibaca",
    deskripsi:
      "Membedah dua sistem berpikir manusia — cepat-intuitif dan lambat-analitis — serta bagaimana keduanya memengaruhi keputusan sehari-hari, lengkap dengan bias kognitif yang sering tidak disadari.",
  },
  {
    judul: "Clean Code: A Handbook of Agile Software Craftsmanship",
    slug: "clean-code-a-handbook-of-agile-software-craftsmanship",
    penulis: "Robert C. Martin",
    penerbit: "Prentice Hall",
    kota_terbit: "Upper Saddle River",
    tahun_terbit: 2008,
    jumlah_halaman: 464,
    bahasa: "Inggris",
    kategori: "Teknologi",
    subjek: "rekayasa perangkat lunak, praktik baik pemrograman",
    status_baca: "sedang_dibaca",
    deskripsi:
      "Panduan praktis menulis kode yang mudah dibaca dan dirawat, dengan studi kasus refactoring dan prinsip-prinsip clean code dari pengalaman puluhan tahun di industri.",
  },
  {
    judul: "Cosmos",
    slug: "cosmos",
    penulis: "Carl Sagan",
    penerbit: "Random House",
    tahun_terbit: 1980,
    jumlah_halaman: 365,
    bahasa: "Inggris",
    kategori: "Sains",
    subjek: "astronomi, kosmologi, sejarah sains",
    status_baca: "ingin_dibaca",
    deskripsi:
      "Menjelajahi alam semesta dan sejarah sains lewat narasi yang puitis, menghubungkan astronomi, biologi, dan sejarah peradaban manusia dalam satu pandangan kosmis.",
  },
];

const insertBuku = db.prepare(`
  INSERT OR IGNORE INTO buku (
    judul, subjudul, slug, penulis, editor, penerjemah, ilustrator, penerbit,
    kota_terbit, tahun_terbit, edisi, cetakan, isbn, jumlah_halaman, bahasa,
    seri, volume, kategori, subjek, status_baca, deskripsi, gambar
  ) VALUES (
    @judul, @subjudul, @slug, @penulis, @editor, @penerjemah, @ilustrator, @penerbit,
    @kota_terbit, @tahun_terbit, @edisi, @cetakan, @isbn, @jumlah_halaman, @bahasa,
    @seri, @volume, @kategori, @subjek, @status_baca, @deskripsi, @gambar
  )
`);

const defaults = {
  subjudul: null, editor: null, penerjemah: null, ilustrator: null,
  edisi: null, cetakan: null, isbn: null, seri: null, volume: null, gambar: null,
};

const insertManyBuku = db.transaction((items) => {
  for (const item of items) insertBuku.run({ ...defaults, ...item });
});
insertManyBuku(bukuList);

const getBukuIdBySlug = db.prepare(`SELECT id FROM buku WHERE slug = ?`);
const idSapiens = getBukuIdBySlug.get("sapiens-riwayat-singkat-umat-manusia")?.id ?? null;
const idKahneman = getBukuIdBySlug.get("thinking-fast-and-slow")?.id ?? null;
const idCleanCode = getBukuIdBySlug.get("clean-code-a-handbook-of-agile-software-craftsmanship")?.id ?? null;
const idCosmos = getBukuIdBySlug.get("cosmos")?.id ?? null;

const catatanList = [
  {
    judul: "Mengapa Kita Lupa Apa yang Baru Dibaca?",
    slug: "mengapa-kita-lupa-apa-yang-baru-dibaca",
    kategori: "Psikologi",
    tanggal_dibuat: "2026-05-02 09:15:00",
    buku_id: idKahneman,
    isi_catatan:
      "# Pertanyaan\nKenapa otak cenderung membuang detail bacaan padahal baru beberapa jam lalu dibaca?\n\n## Jawaban Singkat\nIni berkaitan dengan **kurva lupa Ebbinghaus**. Tanpa pengulangan aktif (active recall), memori jangka pendek tidak dipindahkan ke memori jangka panjang.\n\n- Solusi praktis: catat pertanyaan + jawaban (seperti yang sedang kamu bangun ini)\n- Ulangi dalam interval (spaced repetition)\n\n> \"Membaca tanpa mencatat seperti menuang air ke gelas berlubang.\"",
  },
  {
    judul: "Apa Itu Idempoten dalam Pemrograman?",
    slug: "apa-itu-idempoten-dalam-pemrograman",
    kategori: "Teknologi",
    tanggal_dibuat: "2026-05-10 14:30:00",
    buku_id: idCleanCode,
    isi_catatan:
      "Operasi disebut **idempoten** kalau dijalankan berkali-kali hasilnya tetap sama seperti dijalankan sekali.\n\nContoh: `PUT /user/1 {name: 'Budi'}` -> idempoten.\nContoh bukan idempoten: `POST /order` yang setiap kali dipanggil membuat order baru.\n\nIni penting di desain API supaya retry otomatis aman dilakukan.",
  },
  {
    judul: "Asal Mula Sistem Penanggalan Gregorian",
    slug: "asal-mula-sistem-penanggalan-gregorian",
    kategori: "Sejarah",
    tanggal_dibuat: "2026-05-18 20:00:00",
    buku_id: idSapiens,
    isi_catatan:
      "Kalender Gregorian diperkenalkan Paus Gregorius XIII pada 1582 untuk memperbaiki pergeseran kalender Julian terhadap musim semi (equinox).\n\nPergeseran ini terjadi karena kalender Julian menghitung satu tahun = 365.25 hari, padahal panjang tahun tropis sebenarnya sedikit lebih pendek.",
  },
  {
    judul: "Kenapa Air Laut Asin tapi Air Hujan Tidak?",
    slug: "kenapa-air-laut-asin-tapi-air-hujan-tidak",
    kategori: "Sains",
    tanggal_dibuat: "2026-06-01 08:45:00",
    buku_id: null,
    isi_catatan:
      "Air hujan berasal dari penguapan, proses yang meninggalkan garam dan mineral di belakang. Air sungai yang mengalir ke laut membawa mineral dari batuan, dan karena laut tidak punya jalan keluar, mineral itu terus terakumulasi selama jutaan tahun.",
  },
  {
    judul: "Apa Bedanya Resesi dan Depresi Ekonomi?",
    slug: "apa-bedanya-resesi-dan-depresi-ekonomi",
    kategori: "Ekonomi",
    tanggal_dibuat: "2026-06-10 11:00:00",
    buku_id: null,
    isi_catatan:
      "Resesi umumnya didefinisikan sebagai penurunan PDB dua kuartal berturut-turut. Depresi adalah resesi yang jauh lebih parah, berlangsung lebih lama (bisa bertahun-tahun), dengan pengangguran sangat tinggi — contoh historisnya Depresi Besar 1929.",
  },
  {
    judul: "Kenapa Langit Berwarna Biru, Bukan Hijau?",
    slug: "kenapa-langit-berwarna-biru-bukan-hijau",
    kategori: "Sains",
    tanggal_dibuat: "2026-06-12 09:05:00",
    buku_id: idCosmos,
    isi_catatan:
      "# Pertanyaan\nKalau cahaya matahari berisi semua warna, kenapa langit yang kita lihat selalu biru, bukan hijau atau ungu?\n\n## Jawaban Singkat\nIni karena **hamburan Rayleigh** — partikel kecil di atmosfer menghamburkan cahaya gelombang pendek (biru) jauh lebih kuat daripada gelombang panjang (merah).\n\nUngu sebenarnya dihamburkan lebih kuat lagi dari biru, tapi mata manusia kurang sensitif terhadap ungu, dan sebagian ungu diserap di atmosfer atas. Hasilnya, kombinasi sensitivitas mata + intensitas hamburan membuat kita melihat langit sebagai **biru**, bukan ungu atau hijau.",
  },
  {
    judul: "Apa Beda Logika Deduktif dan Induktif?",
    slug: "apa-beda-logika-deduktif-dan-induktif",
    kategori: "Filsafat",
    tanggal_dibuat: "2026-06-14 16:40:00",
    buku_id: null,
    isi_catatan:
      "# Pertanyaan\nDi buku-buku filsafat sering disebut 'deduktif' dan 'induktif' — apa bedanya secara praktis?\n\n## Jawaban Singkat\n**Deduktif**: dari premis umum ke kesimpulan khusus yang pasti benar jika premisnya benar. Contoh: 'Semua manusia mati. Socrates manusia. Maka Socrates mati.'\n\n**Induktif**: dari observasi khusus ke generalisasi yang *mungkin* benar, bukan pasti.",
  },
  {
    judul: "Dari Mana Asal Kata 'Kuliah'?",
    slug: "dari-mana-asal-kata-kuliah",
    kategori: "Bahasa",
    tanggal_dibuat: "2026-06-16 19:20:00",
    buku_id: null,
    isi_catatan:
      "# Pertanyaan\nKata 'kuliah' kedengarannya bukan asli bahasa Indonesia — dari mana asalnya?\n\n## Jawaban Singkat\n'Kuliah' diserap dari bahasa Arab kulliyah (كلية), yang berarti 'fakultas' atau 'lembaga pendidikan tinggi'. Kata ini masuk ke bahasa Melayu/Indonesia lewat jalur pendidikan Islam.",
  },
];

const insertCatatan = db.prepare(`
  INSERT OR IGNORE INTO catatan (judul, slug, isi_catatan, kategori, tanggal_dibuat, buku_id)
  VALUES (@judul, @slug, @isi_catatan, @kategori, @tanggal_dibuat, @buku_id)
`);

const insertManyCatatan = db.transaction((items) => {
  for (const item of items) insertCatatan.run(item);
});
insertManyCatatan(catatanList);

console.log(`[seed.js] Selesai. ${bukuList.length} buku & ${catatanList.length} catatan contoh ditulis ke database.sqlite`);
db.close();