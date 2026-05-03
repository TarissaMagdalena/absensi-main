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
        pj.tanggal,
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

// APPROVE
router.put("/:id/approve", async (req, res) => {
  try {
    await db.query("UPDATE pengajuan SET status = 'Disetujui' WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ message: "Pengajuan disetujui" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// REJECT
router.put("/:id/reject", async (req, res) => {
  try {
    await db.query("UPDATE pengajuan SET status = 'Ditolak' WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ message: "Pengajuan ditolak" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
