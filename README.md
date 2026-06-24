# Points of Curiosity (POC) — Knowledge Log + Perpustakaan

Catatan pribadi berisi pertanyaan yang sudah terjawab saat membaca buku,
dilengkapi perpustakaan pribadi yang menyimpan buku yang sudah/sedang/ingin
dibaca. Setiap catatan opsional bisa dikaitkan ke satu buku referensi.

Arsitektur hibrida: CRUD penuh di lokal (SQLite + upload gambar), tampilan
publik read-only di GitHub Pages (JSON statis + gambar hasil ekspor).

```
┌──────────────────────┐     export.js      ┌────────────────────────────────┐
│   database.sqlite      │ ──────────────────▶ │  dist/data/katalog.json          │
│   (tabel catatan, buku) │                     │  dist/data/artikel/<slug>.json    │
│   uploads/buku/*.jpg     │                     │  dist/data/buku-katalog.json       │
└──────────────────────┘                     │  dist/data/buku/<slug>.json          │
                                              └────────────────────────────────┘
                                                              │
                                                              ▼
                                      index.html / artikel.html / perpustakaan.html / buku.html
                                                  (statis, di-hosting GitHub Pages)
```

## Struktur folder

```
poc-project/
├── database.sqlite           (lokal saja — tidak di-commit, lihat .gitignore)
├── seed.js                    alat bantu: isi database.sqlite dengan data contoh
├── export.js                   BACKEND: SQLite -> JSON statis (catatan + buku)
├── server.js                    BACKEND: server CRUD lokal (Express) — tidak di-commit
├── lib/
│   ├── slugify.js                logika slug bersama, dipakai export.js & server.js
│   └── schema.js                  definisi tabel buku & catatan, dipakai seed.js & server.js
├── editor/                     FRONTEND CRUD: editor lokal (tab Catatan & Buku) — tidak di-commit
│   └── index.html
├── package.json
├── index.html                  FRONTEND PUBLIK: halaman utama (katalog/card + search)
├── artikel.html                 FRONTEND PUBLIK: halaman baca penuh satu catatan
├── perpustakaan.html             FRONTEND PUBLIK: grid buku (filter status baca)
├── buku.html                      FRONTEND PUBLIK: detail buku + catatan terkait
├── style.css                       token desain bersama (warna, font, animasi)
├── .gitignore
├── uploads/buku/                    (GAMBAR SAMPUL — wajib ikut di-push)
└── dist/data/                        (HASIL EKSPOR — wajib ikut di-push)
    ├── katalog.json
    ├── buku-katalog.json
    ├── artikel/<slug>.json
    └── buku/<slug>.json
```

## Skema database

**Tabel `buku`** — judul, subjudul, slug, penulis, editor, penerjemah,
ilustrator, penerbit, kota_terbit, tahun_terbit, edisi, cetakan, isbn,
jumlah_halaman, bahasa, seri, volume, kategori, subjek, **status_baca**
(`ingin_dibaca` / `sedang_dibaca` / `sudah_dibaca`), **deskripsi**, **gambar**
(nama file di `uploads/buku/`), tanggal_ditambahkan.

**Tabel `catatan`** — sama seperti sebelumnya (judul, slug, isi_catatan,
kategori, tanggal_dibuat), ditambah **`buku_id`** (boleh `NULL`, foreign key
ke `buku.id`). Kalau sebuah buku dihapus, `buku_id` pada catatan yang
merujuk ke buku itu otomatis jadi `NULL` (`ON DELETE SET NULL`) — **catatan
tidak ikut terhapus**.

Definisi lengkap ada di `lib/schema.js`, dipakai bersama oleh `seed.js` dan
`server.js` (termasuk migrasi ringan kalau kamu sudah punya
`database.sqlite` lama dari versi sebelum fitur perpustakaan ada).

## Mencatat & mengelola buku lewat Editor (lokal)

```bash
npm install
npm run editor
```

Lalu buka `http://localhost:4321`. Server otomatis membuat tabel `buku` &
`catatan` kalau belum ada — tidak wajib jalankan `npm run seed` dulu.

Editor punya dua tab:

**Tab Catatan** — sama seperti sebelumnya (daftar, form dengan slug
otomatis, kategori dengan saran, preview Markdown real-time), ditambah:
- Radio button **"Referensi ke buku?"** (Ya/Tidak). Pilih "Ya" untuk
  memunculkan kotak pencarian buku — ketik judul atau nama penulis, hasil
  pencarian muncul dari buku yang sudah ada di database (bukan input
  bebas). Klik salah satu hasil untuk memilihnya; buku yang dipilih
  ditampilkan sebagai chip dengan tombol ✕ untuk membatalkan.

**Tab Buku** — daftar buku dengan thumbnail sampul, status baca, tombol
Edit/Hapus, dan form lengkap mencakup semua field biodata yang kamu
sebutkan (judul, subjudul, penulis, editor, penerjemah, ilustrator,
penerbit, kota terbit, tahun terbit, edisi, cetakan, ISBN, jumlah halaman,
bahasa, seri, volume, kategori, subjek, status baca) plus deskripsi dan
upload gambar sampul (JPG/PNG/WEBP, maks 5MB) dengan pratinjau langsung.

Tombol **"Ekspor ke dist/data"** di pojok kanan atas memicu ekspor catatan
maupun buku sekaligus.

### API yang disediakan `server.js`

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/catatan` | Daftar ringan, termasuk nama buku referensi (join) |
| GET | `/api/catatan/:id` | Detail lengkap, untuk form edit |
| POST/PUT | `/api/catatan(/:id)` | Body JSON, terima `buku_id` (boleh `null`) |
| DELETE | `/api/catatan/:id` | — |
| GET | `/api/buku` | Daftar ringan untuk tab Buku |
| GET | `/api/buku/search?q=...` | Pencarian ringan, dipakai picker di form catatan |
| GET | `/api/buku/:id` | Detail lengkap, untuk form edit |
| POST/PUT | `/api/buku(/:id)` | **multipart/form-data**, field file bernama `gambar` |
| DELETE | `/api/buku/:id` | Turut menghapus file gambar terkait dari `uploads/buku/` |
| POST | `/api/export` | Memicu `writeExport()` dari `export.js` |

**Penting:** `server.js` dan folder `editor/` sengaja dimasukkan ke
`.gitignore` (sesuai permintaan awal supaya tooling CRUD tidak ter-push ke
GitHub publik). Konsekuensinya, kode ini **tidak punya riwayat git** di
repo publikmu. Kalau ingin tetap punya backup/versioning untuk kode editor
ini, pertimbangkan menyimpannya di repository privat terpisah.

## Setup & menjalankan (situs publik)

```bash
npm install

# Opsional: kalau belum punya database.sqlite asli dan cuma mau coba-coba
# (sekalian mengisi 4 buku contoh + mengaitkan beberapa catatan ke buku)
npm run seed

# Ekspor SQLite -> JSON statis (catatan + buku)
npm run export
```

Untuk melihat frontend, **jangan** buka `index.html` langsung lewat
klik dua kali (`file://`) — fetch ke `data/katalog.json` akan diblokir
browser karena CORS. Jalankan server statis ringan di folder ini:

```bash
npx serve . -p 8080
# atau
python3 -m http.server 8080
```

Lalu buka `http://localhost:8080`. Kalau `dist/data/` belum ada / fetch
gagal, semua halaman otomatis jatuh ke data contoh bawaan (mode demo) —
jadi UI tetap bisa didemokan tanpa database sama sekali.

Port `8080` ini bukan sembarang angka — link "Lihat tampilan publik" di
editor (`http://localhost:4321`) sengaja mengarah ke `localhost:8080`.

## Publish ke GitHub Pages

1. `npm run export` setiap kali ada perubahan data di `database.sqlite`.
2. Commit & push **termasuk** folder `dist/data/` **dan** `uploads/buku/`
   (lihat catatan di `.gitignore` — keduanya sengaja TIDAK diabaikan,
   karena itulah yang dibaca publik).
3. Di Settings → Pages, set source ke branch yang sesuai, root folder ini.
4. `npm run deploy` sudah disediakan sebagai shortcut
   `export → commit → push`, tinggal sesuaikan pesan commit-nya kalau perlu
   menyertakan `uploads/buku/` juga (`git add dist/data uploads/buku`).

## Keputusan desain yang perlu kamu tahu

- **Field `deskripsi` ditambahkan di luar daftar field yang kamu sebutkan**,
  karena brief awal menyebut card buku harus menampilkan gambar, deskripsi,
  *dan* biodata secara terpisah — deskripsi/sinopsis butuh kolom sendiri,
  beda dari field-field biodata teknis.
- **Field `status_baca` ditambahkan** (ingin/sedang/sudah dibaca) sesuai
  konfirmasi, dengan default `ingin_dibaca` kalau tidak diisi.
- **Gambar sampul disimpan di `uploads/buku/`** (bukan di `dist/`), dengan
  nama file mengikuti slug buku (mis. `sapiens-riwayat-singkat-umat-manusia.jpg`).
  Folder ini ikut di-commit ke git, sama seperti `dist/data/` — keduanya
  konten publik, bukan data sensitif.
- **Saat buku dihapus, catatan yang merujuk ke buku itu TIDAK ikut
  terhapus** — hanya `buku_id`-nya yang otomatis jadi `NULL`
  (`ON DELETE SET NULL` di skema, lihat `lib/schema.js`). Editor juga
  menampilkan konfirmasi yang menjelaskan ini sebelum menghapus.
- **Pencarian buku di form catatan murni memilih dari data yang sudah ada**
  (`GET /api/buku/search`), bukan input bebas — sesuai permintaan, supaya
  setiap catatan hanya bisa merujuk ke buku yang benar-benar terdaftar di
  perpustakaan.
- **`export.js` mengelompokkan catatan per buku saat ekspor**
  (`catatan_terkait` di `dist/data/buku/<slug>.json`), supaya halaman
  detail buku publik tidak perlu query tambahan — semua data yang
  dibutuhkan sudah ada dalam satu file JSON.
- **Slug buku & catatan disanitasi dengan modul yang sama** (`lib/slugify.js`),
  dengan prefix berbeda sebagai fallback (`buku-<id>` vs `catatan-<id>`)
  supaya tidak pernah saling tabrakan namespace file walau disimpan di
  folder ekspor yang berbeda (`dist/data/buku/` vs `dist/data/artikel/`).
- **Slug ditata ulang otomatis kalau berubah saat edit buku** — kalau kamu
  mengubah judul/slug buku yang sudah punya gambar, `server.js` ikut
  me-rename file gambar lama supaya nama file tetap konsisten dengan slug
  terbaru (lihat fungsi di `app.put("/api/buku/:id", ...)`).
- **Icon "Cari" (sidebar/bottom bar) tidak membuka halaman baru** — ia
  men-toggle search bar yang collapsible di halaman utama. Dari halaman
  lain, link ini mengarah ke `index.html#search`.
- **Icon CRUD lama (`square-pen`) sudah dihapus dari tampilan publik**,
  digantikan icon **Perpustakaan** (`library`) yang mengarah ke
  `perpustakaan.html`. Editor CRUD tetap ada, tapi sekarang hanya diakses
  lewat `npm run editor` (`http://localhost:4321`) — tidak ditautkan dari
  halaman publik manapun.

## Yang belum dibuat (next steps)

- Filter berdasarkan kategori di halaman katalog catatan (saat ini search
  sudah bisa mencocokkan teks kategori, tapi belum ada filter chip
  terpisah). Perpustakaan sudah punya filter status baca.
- Mode gelap (dark mode) — belum diminta, jadi belum dibuat.
- Autentikasi untuk editor — saat ini tidak ada, karena editor memang
  hanya didesain untuk dijalankan di `localhost` milikmu sendiri. Kalau
  suatu saat editor ini perlu diakses dari luar laptopmu, wajib ditambah
  autentikasi dulu sebelum dibuka ke jaringan manapun selain `localhost`.
- Validasi format ISBN, atau pencarian otomatis metadata buku dari ISBN
  (mis. lewat API Open Library) — saat ini ISBN cuma field teks bebas.