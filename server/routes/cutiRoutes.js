import express from "express";
import { db } from "../db.js";

const router = express.Router();

// GET /api/cuti?tahun=2026
// Ambil semua jatah cuti pegawai per tahun
router.get("/", async (req, res) => {
  const tahun = req.query.tahun || new Date().getFullYear();
  try {
    const [data] = await db.query(
      `SELECT 
        p.id as pegawai_id,
        p.nama,
        COALESCE(j.jatah, 12) as jatah,
        COALESCE(j.terpakai, 0) as terpakai,
        COALESCE(j.jatah, 12) - COALESCE(j.terpakai, 0) as sisa
       FROM pegawai p
       LEFT JOIN jatah_cuti j ON p.id = j.pegawai_id AND j.tahun = ?
       ORDER BY p.nama ASC`,
      [tahun],
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/cuti
// Simpan jatah cuti (upsert)
// body: [{ pegawai_id, jatah, tahun }]
router.put("/", async (req, res) => {
  const { tahun, data } = req.body;

  if (!tahun || !Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ message: "Data tidak lengkap" });
  }

  try {
    for (const item of data) {
      await db.query(
        `INSERT INTO jatah_cuti (pegawai_id, tahun, jatah)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE jatah = VALUES(jatah)`,
        [item.pegawai_id, tahun, item.jatah],
      );
    }
    res.json({ message: "Jatah cuti berhasil disimpan" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/cuti/pegawai/:pegawai_id?tahun=2026
// Untuk ditampilkan di summary riwayat absensi pegawai
router.get("/pegawai/:pegawai_id", async (req, res) => {
  const { pegawai_id } = req.params;
  const tahun = req.query.tahun || new Date().getFullYear();
  try {
    const [rows] = await db.query(
      `SELECT 
        COALESCE(j.jatah, 12) as jatah,
        COALESCE(j.terpakai, 0) as terpakai,
        COALESCE(j.jatah, 12) - COALESCE(j.terpakai, 0) as sisa
       FROM pegawai p
       LEFT JOIN jatah_cuti j ON p.id = j.pegawai_id AND j.tahun = ?
       WHERE p.id = ?`,
      [tahun, pegawai_id],
    );
    res.json(rows[0] || { jatah: 12, terpakai: 0, sisa: 12 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
