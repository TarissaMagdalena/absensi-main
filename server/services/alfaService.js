// ═══════════════════════════════════════════════════════════════
// ALFA SERVICE — Deteksi dan penandaan ketidakhadiran otomatis
// Parameter:
//   tanggal        = "YYYY-MM-DD" tanggal yang akan diproses
//   hariIni        = boolean, true = hari ini (ada filter waktu)
//                             false = tanggal lalu (langsung insert semua)
//   toleransiMenit = menit setelah jam pulang sebelum ditandai Alfa (default 30)
// ═══════════════════════════════════════════════════════════════

import { db } from "../db.js";

export async function processAlfa(
  tanggal,
  hariIni = false,
  toleransiMenit = 30, // ← default: tunggu 30 menit setelah jam pulang
) {
  // ════════════════════════════════════════════════════════════
  // LANGKAH 1: Cari kandidat Alfa
  // Kandidat = punya jadwal kerja TAPI belum ada di tabel absensi
  // ════════════════════════════════════════════════════════════
  const [kandidat] = await db.query(
    `SELECT
       j.pegawai_id,
       p.nama,
       j.shift_kode,
       s.jam_masuk,
       s.jam_pulang
     FROM jadwal_pegawai j
     JOIN pegawai p ON j.pegawai_id = p.id
     LEFT JOIN shift s ON j.shift_kode = s.kode
     WHERE DATE(j.tanggal) = ?
       AND j.shift_kode NOT IN ('L', 'CT')
       AND j.pegawai_id NOT IN (
         SELECT pegawai_id FROM absensi WHERE tanggal = ?
       )`,
    [tanggal, tanggal],
  );

  if (kandidat.length === 0) return { inserted: 0, detail: [] };

  // ════════════════════════════════════════════════════════════
  // LANGKAH 2: Filter kandidat yang memenuhi syarat waktu
  //   Hari ini:    hanya insert jika sudah lewat jam pulang + toleransi
  //   Tanggal lalu: langsung insert semua (tidak perlu filter waktu)
  // ════════════════════════════════════════════════════════════
  const sekarang = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );

  const toInsert = kandidat.filter((k) => {
    if (hariIni) {
      // ── Filter waktu untuk hari ini ────────────────────────────
      // Alfa hanya ditandai SETELAH shift selesai + toleransi
      if (!k.jam_pulang) return false;
      // Hitung batas waktu: jam_pulang + toleransiMenit
      const [hh, mm] = k.jam_pulang.slice(0, 5).split(":").map(Number);
      const batas = new Date(sekarang);
      batas.setHours(hh, mm + toleransiMenit, 0, 0);
      // ── Handle shift malam ──────────────────────────────────────
      if (k.jam_masuk) {
        const [hm] = k.jam_masuk.slice(0, 5).split(":").map(Number);
        if (hh < hm) {
          // Shift malam: jam pulang di hari berikutnya
          batas.setDate(batas.getDate() + 1);
        }
      }

      return sekarang >= batas;
    } else {
      // Tanggal masa lalu: langsung insert semua kandidat
      return true;
    }
  });

  if (toInsert.length === 0) return { inserted: 0, detail: [] };

  // ════════════════════════════════════════════════════════════
  // LANGKAH 3: INSERT Alfa dengan transaction
  // Menggunakan transaction untuk:
  //   1. Double-check race condition sebelum insert
  //   2. Rollback jika terjadi error di tengah proses
  // ════════════════════════════════════════════════════════════
  const conn = await db.getConnection();
  await conn.beginTransaction();
  const inserted = [];

  try {
    for (const k of toInsert) {
      // Double-check race condition
      const [cek] = await conn.query(
        "SELECT id FROM absensi WHERE pegawai_id = ? AND tanggal = ? LIMIT 1",
        [k.pegawai_id, tanggal],
      );
      if (cek.length > 0) continue;

      await conn.query(
        `INSERT IGNORE INTO absensi
         (pegawai_id, tanggal, status, keterangan, shift_kode, is_from_jadwal)
         VALUES (?, ?, 'Alfa', 'Tidak hadir tanpa keterangan', ?, 0)`,
        [k.pegawai_id, tanggal, k.shift_kode],
      );
      inserted.push({
        pegawai_id: k.pegawai_id,
        nama: k.nama,
        shift_kode: k.shift_kode,
      });
    }
    // ── INSERT Alfa ───────────────────────────────────────────
    await conn.commit();
    if (inserted.length > 0) {
      console.log(
        `[Alfa] ${tanggal} → ${inserted.length} diinsert:`,
        inserted.map((i) => i.nama).join(", "),
      );
    }
    return { inserted: inserted.length, detail: inserted };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
