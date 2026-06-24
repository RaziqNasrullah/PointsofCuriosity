/**
 * lib/slugify.js
 * ---------------------------------------------------------------------------
 * Logika sanitasi slug yang dipakai bersama oleh export.js (saat ekspor data
 * lama) dan server.js (saat CRUD menyimpan data baru). Dipisah ke satu tempat
 * supaya aturan "apa itu slug yang valid" tidak bisa drift antara dua skrip.
 * ---------------------------------------------------------------------------
 */

/**
 * @param {string} rawText - judul atau slug mentah dari input user
 * @param {string} fallback - dipakai kalau hasil sanitasi kosong
 * @returns {string} slug yang aman dipakai sebagai nama file & URL
 */
function slugify(rawText, fallback = "") {
  const cleaned = String(rawText || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_\s]/g, "")   // buang karakter yang bukan huruf/angka/spasi/-/_
    .replace(/[\s_]+/g, "-")          // spasi & underscore -> tanda hubung
    .replace(/-+/g, "-")              // rapatkan tanda hubung berulang
    .replace(/^-|-$/g, "");           // buang tanda hubung di awal/akhir

  return cleaned.length > 0 ? cleaned : fallback;
}

module.exports = { slugify };