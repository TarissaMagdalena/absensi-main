// server/services/AlfaService.js
import { db } from "../db.js";

export async function processAlfa(
  tanggal,
  hariIni = false,
  toleransiMenit = 30,
) {
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

  const sekarang = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );

  const toInsert = kandidat.filter((k) => {
    if (hariIni) {
      // Gunakan jam PULANG + toleransi, bukan jam masuk
      // Alfa hanya ditandai setelah shift benar-benar selesai
      if (!k.jam_pulang) return false;

      const [hh, mm] = k.jam_pulang.slice(0, 5).split(":").map(Number);
      const batas = new Date(sekarang);
      batas.setHours(hh, mm + toleransiMenit, 0, 0);

      // Handle shift malam: jam pulang < jam masuk (misal masuk 19:00, pulang 07:00)
      // Jam pulang dini hari berarti shift selesai besok paginya
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
