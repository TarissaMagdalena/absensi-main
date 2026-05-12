import express from "express";
import { db } from "../db.js";

const router = express.Router();

// GET ALL PENGAJUAN
router.get("/", async (req, res) => {
  try {
    const [data] = await db.query(`
      SELECT 
        pj.id,
        p.nama,
        pj.tipe,
        DATE_FORMAT(pj.tanggal, '%Y-%m-%d') as tanggal,
        pj.keterangan,
        pj.status,
        pj.created_at
      FROM pengajuan pj
      JOIN pegawai p ON pj.pegawai_id = p.id
      ORDER BY pj.created_at DESC
    `);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= APPROVE =================
router.put("/:id/approve", async (req, res) => {
  try {
    // Update status pengajuan
    await db.query("UPDATE pengajuan SET status = 'Disetujui' WHERE id = ?", [
      req.params.id,
    ]);

    // Ambil data pengajuan
    const [pj] = await db.query("SELECT * FROM pengajuan WHERE id = ?", [
      req.params.id,
    ]);
    const p = pj[0];

    // Cek apakah sudah ada absensi di tanggal itu
    const [cekAbsen] = await db.query(
      "SELECT * FROM absensi WHERE pegawai_id = ? AND tanggal = ?",
      [p.pegawai_id, p.tanggal],
    );

    // 🔥 Insert ke absensi kalau belum ada
    if (cekAbsen.length === 0) {
      await db.query(
        `INSERT INTO absensi 
        (pegawai_id, tanggal, status, tipe, keterangan, status_area)
        VALUES (?, ?, ?, ?, ?, 'LUAR')`,
        [p.pegawai_id, p.tanggal, p.tipe, p.tipe, p.keterangan],
      );
    }

    console.log("✅ Pengajuan disetujui:", p);

    res.json({ message: "Pengajuan disetujui dan absensi tercatat" });
  } catch (err) {
    console.error("❌ Error approve:", err);
    res.status(500).json({ message: err.message });
  }
});

// ================= REJECT =================
router.put("/:id/reject", async (req, res) => {
  try {
    // Update status pengajuan
    await db.query("UPDATE pengajuan SET status = 'Ditolak' WHERE id = ?", [
      req.params.id,
    ]);

    // Ambil data pengajuan
    const [pj] = await db.query("SELECT * FROM pengajuan WHERE id = ?", [
      req.params.id,
    ]);
    const p = pj[0];

    // Cek apakah sudah ada absensi di tanggal itu
    const [cekAbsen] = await db.query(
      "SELECT * FROM absensi WHERE pegawai_id = ? AND tanggal = ?",
      [p.pegawai_id, p.tanggal],
    );

    // 🔥 Insert Alpha kalau belum ada absensi
    if (cekAbsen.length === 0) {
      await db.query(
        `INSERT INTO absensi 
        (pegawai_id, tanggal, status, tipe, keterangan, status_area)
        VALUES (?, ?, 'Alpha', ?, ?, 'LUAR')`,
        [p.pegawai_id, p.tanggal, p.tipe, `Pengajuan ${p.tipe} ditolak`],
      );
    }

    console.log("❌ Pengajuan ditolak:", p);

    res.json({ message: "Pengajuan ditolak, absensi tercatat sebagai Alpha" });
  } catch (err) {
    console.error("❌ Error reject:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
