// server/services/alphaService.js
import { db } from "../db.js";

/**
 * Proses Alpha untuk satu tanggal tertentu.
 *
 * @param {string} tanggal        - format YYYY-MM-DD
 * @param {boolean} hariIni       - true = cek jam masuk shift + toleransi sebelum insert
 * @param {number} toleransiMenit - menit toleransi setelah jam masuk (default 30)
 */
export async function processAlpha(
  tanggal,
  hariIni = false,
  toleransiMenit = 30,
) {
  // ── 1. Ambil semua jadwal kerja yang belum ada absensinya ─────────────────
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

  // ── 2. Waktu sekarang (WIB) ───────────────────────────────────────────────
  const sekarang = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );

  // ── 3. Filter berdasarkan kondisi ─────────────────────────────────────────
  const toInsert = kandidat.filter((k) => {
    if (hariIni) {
      // Hari ini: sudah lewat jam PULANG + toleransiMenit (default 30 menit)
      // Kalau tidak ada jam_pulang, pakai jam_masuk + 8 jam sebagai fallback
      const jamAcuan = k.jam_pulang || null;
      if (!jamAcuan) return false; // belum bisa ditentukan, skip dulu

      const [hh, mm] = jamAcuan.slice(0, 5).split(":").map(Number);
      const batas = new Date(sekarang);
      batas.setHours(hh, mm + toleransiMenit, 0, 0);

      // Handle shift malam: jam pulang < jam masuk → pulang dini hari besok
      if (k.jam_masuk) {
        const [hm] = k.jam_masuk.slice(0, 5).split(":").map(Number);
        if (hh < hm) {
          batas.setDate(batas.getDate() + 1);
        }
      }

      return sekarang >= batas;
    } else {
      // Kemarin: sudah lewat jam PULANG shift + 3 jam
      if (!k.jam_pulang) return true;
      const [hp, mp] = k.jam_pulang.slice(0, 5).split(":").map(Number);

      // Rekonstruksi datetime jam pulang
      const jamPulang = new Date(sekarang);
      jamPulang.setDate(jamPulang.getDate() - 1); // mulai dari kemarin
      jamPulang.setHours(hp, mp, 0, 0);

      // Shift malam: jam pulang < jam masuk → pulang dini hari INI
      if (k.jam_masuk) {
        const [hm] = k.jam_masuk.slice(0, 5).split(":").map(Number);
        if (hp < hm) {
          jamPulang.setDate(jamPulang.getDate() + 1);
        }
      }

      // Alpha jika sekarang sudah lewat jam pulang + 3 jam
      const batasAlpha = new Date(jamPulang);
      batasAlpha.setHours(batasAlpha.getHours() + 3);
      return sekarang >= batasAlpha;
    }
  });

  if (toInsert.length === 0) return { inserted: 0, detail: [] };

  // ── 4. Insert Alpha ───────────────────────────────────────────────────────
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
         VALUES (?, ?, 'Alpha', 'Tidak hadir tanpa keterangan', ?, 0)`,
        [k.pegawai_id, tanggal, k.shift_kode],
      );
      inserted.push({
        pegawai_id: k.pegawai_id,
        nama: k.nama,
        shift_kode: k.shift_kode,
      });
    }

    await conn.commit();
    console.log(
      `[Alpha] ${tanggal} → ${inserted.length} Alpha diinsert:`,
      inserted.map((i) => i.nama).join(", ") || "-",
    );
    return { inserted: inserted.length, detail: inserted };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
