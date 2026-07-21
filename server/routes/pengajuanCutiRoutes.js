import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../db.js";

const router = express.Router();

// ─── Multer setup untuk surat cuti ───────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/surat_cuti";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `cuti-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("File harus JPG, PNG, atau PDF"));
  },
});

// ─── GET /api/pengajuan-cuti ──────────────────────────────────────────────────
// Ambil semua pengajuan (admin) atau per pegawai (pegawai)
router.get("/", async (req, res) => {
  const { pegawai_id } = req.query;
  try {
    let query = `
      SELECT
        pc.id,
        pc.pegawai_id,
        p.nama,
        p.nik,
        DATE_FORMAT(pc.tanggal_mulai,   '%Y-%m-%d') AS tanggal_mulai,
        DATE_FORMAT(pc.tanggal_selesai, '%Y-%m-%d') AS tanggal_selesai,
        pc.alasan,
        pc.surat_cuti,
        pc.status,
        pc.catatan_admin,
        DATE_FORMAT(pc.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
        DATE_FORMAT(pc.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
      FROM pengajuan_cuti pc
      JOIN pegawai p ON p.id = pc.pegawai_id
    `;
    const params = [];

    // Filter per pegawai jika ada query param
    if (pegawai_id) {
      query += " WHERE pc.pegawai_id = ?";
      params.push(pegawai_id);
    }

    query += " ORDER BY pc.created_at DESC";

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("[PengajuanCuti] GET error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── GET /api/pengajuan-cuti/:id ─────────────────────────────────────────────
// Detail satu pengajuan
router.get("/:id", async (req, res) => {
  try {
    const [[row]] = await db.query(
      `SELECT
         pc.id,
         pc.pegawai_id,
         p.nama,
         p.nik,
         DATE_FORMAT(pc.tanggal_mulai,   '%Y-%m-%d') AS tanggal_mulai,
         DATE_FORMAT(pc.tanggal_selesai, '%Y-%m-%d') AS tanggal_selesai,
         pc.alasan,
         pc.surat_cuti,
         pc.status,
         pc.catatan_admin,
         DATE_FORMAT(pc.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
       FROM pengajuan_cuti pc
       JOIN pegawai p ON p.id = pc.pegawai_id
       WHERE pc.id = ?`,
      [req.params.id],
    );
    if (!row)
      return res.status(404).json({ message: "Pengajuan tidak ditemukan" });
    res.json(row);
  } catch (err) {
    console.error("[PengajuanCuti] GET/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── POST /api/pengajuan-cuti ─────────────────────────────────────────────────
// Pegawai mengajukan cuti baru
router.post("/", upload.single("surat_cuti"), async (req, res) => {
  const { pegawai_id, tanggal_mulai, tanggal_selesai, alasan } = req.body;

  if (!pegawai_id || !tanggal_mulai || !tanggal_selesai || !alasan?.trim())
    return res.status(400).json({ message: "Semua field wajib diisi" });

  if (tanggal_selesai < tanggal_mulai)
    return res
      .status(400)
      .json({ message: "Tanggal selesai tidak boleh sebelum tanggal mulai" });

  try {
    // Cek apakah ada pengajuan yang overlap (menunggu atau disetujui)
    const [overlap] = await db.query(
      `SELECT id FROM pengajuan_cuti
       WHERE pegawai_id = ?
         AND status IN ('Menunggu', 'Disetujui')
         AND tanggal_mulai   <= ?
         AND tanggal_selesai >= ?`,
      [pegawai_id, tanggal_selesai, tanggal_mulai],
    );
    if (overlap.length > 0)
      return res.status(400).json({
        message:
          "Kamu sudah memiliki pengajuan cuti yang overlap pada periode tersebut",
      });

    // Cek sisa jatah cuti
    const tahun = new Date(tanggal_mulai).getFullYear();
    const [[jatah]] = await db.query(
      "SELECT jatah, terpakai FROM jatah_cuti WHERE pegawai_id = ? AND tahun = ?",
      [pegawai_id, tahun],
    );

    if (jatah) {
      const sisa = (jatah.jatah || 0) - (jatah.terpakai || 0);
      const jumlahHari =
        Math.round(
          (new Date(tanggal_selesai) - new Date(tanggal_mulai)) / 86400000,
        ) + 1;
      if (jumlahHari > sisa)
        return res.status(400).json({
          message: `Sisa jatah cuti tidak cukup. Sisa: ${sisa} hari, dibutuhkan: ${jumlahHari} hari`,
        });
    }

    const suratCuti = req.file ? req.file.filename : null;

    const [result] = await db.query(
      `INSERT INTO pengajuan_cuti
         (pegawai_id, tanggal_mulai, tanggal_selesai, alasan, surat_cuti, status)
       VALUES (?, ?, ?, ?, ?, 'Menunggu')`,
      [pegawai_id, tanggal_mulai, tanggal_selesai, alasan.trim(), suratCuti],
    );

    res.status(201).json({
      message: "Pengajuan cuti berhasil dikirim",
      id: result.insertId,
    });
  } catch (err) {
    // Hapus file jika query gagal
    if (req.file) fs.unlink(req.file.path, () => {});
    console.error("[PengajuanCuti] POST error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── PUT /api/pengajuan-cuti/:id/approve ─────────────────────────────────────
// Admin menyetujui pengajuan → update jadwal_pegawai shift = CT
// ─── PUT /api/pengajuan-cuti/:id/approve ─────────────────────────────────────
router.put("/:id/approve", async (req, res) => {
  const { catatan_admin } = req.body;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Ambil data pengajuan
    const [[pengajuan]] = await conn.query(
      `SELECT
         pegawai_id,
         DATE_FORMAT(tanggal_mulai,   '%Y-%m-%d') AS tanggal_mulai,
         DATE_FORMAT(tanggal_selesai, '%Y-%m-%d') AS tanggal_selesai,
         alasan,
         status
       FROM pengajuan_cuti WHERE id = ?`,
      [req.params.id],
    );

    if (!pengajuan)
      return res.status(404).json({ message: "Pengajuan tidak ditemukan" });
    if (pengajuan.status !== "Menunggu")
      return res
        .status(400)
        .json({ message: "Pengajuan sudah diproses sebelumnya" });

    // Update status pengajuan
    await conn.query(
      `UPDATE pengajuan_cuti
       SET status = 'Disetujui', catatan_admin = ?, updated_at = NOW()
       WHERE id = ?`,
      [catatan_admin || null, req.params.id],
    );

    // ── Update jadwal_pegawai: semua tanggal dalam range → shift CT ──────────
    // Gunakan string tanggal langsung, bukan new Date() agar tidak NaN
    const [tMulaiY, tMulaiM, tMulaiD] = pengajuan.tanggal_mulai
      .split("-")
      .map(Number);
    const [tSelesaiY, tSelesaiM, tSelesaiD] = pengajuan.tanggal_selesai
      .split("-")
      .map(Number);

    const mulai = new Date(tMulaiY, tMulaiM - 1, tMulaiD);
    const selesai = new Date(tSelesaiY, tSelesaiM - 1, tSelesaiD);

    // Ambil tahun dari bagian string — tidak bergantung parsing Date
    const tahun = tMulaiY; // ← langsung dari split, sudah Number, pasti valid

    let current = new Date(mulai);
    while (current <= selesai) {
      const tglStr = current.toLocaleDateString("en-CA"); // format YYYY-MM-DD

      // Cek apakah sudah ada jadwal di tanggal tersebut
      const [[existingJadwal]] = await conn.query(
        "SELECT id FROM jadwal_pegawai WHERE pegawai_id = ? AND tanggal = ?",
        [pengajuan.pegawai_id, tglStr],
      );

      if (existingJadwal) {
        await conn.query(
          `UPDATE jadwal_pegawai
           SET shift_kode = 'CT', keterangan = ?
           WHERE pegawai_id = ? AND tanggal = ?`,
          [pengajuan.alasan || "Cuti disetujui", pengajuan.pegawai_id, tglStr],
        );
      } else {
        await conn.query(
          `INSERT INTO jadwal_pegawai (pegawai_id, tanggal, shift_kode, keterangan)
           VALUES (?, ?, 'CT', ?)`,
          [pengajuan.pegawai_id, tglStr, pengajuan.alasan || "Cuti disetujui"],
        );
      }

      // Hapus absensi Alfa di tanggal cuti jika ada
      await conn.query(
        `DELETE FROM absensi
         WHERE pegawai_id = ? AND tanggal = ? AND status = 'Alfa'`,
        [pengajuan.pegawai_id, tglStr],
      );

      // Insert absensi Cuti jika belum ada
      await conn.query(
        `INSERT IGNORE INTO absensi
           (pegawai_id, tanggal, status, keterangan, is_from_jadwal)
         VALUES (?, ?, 'Cuti', ?, 1)`,
        [pengajuan.pegawai_id, tglStr, pengajuan.alasan || "Cuti disetujui"],
      );

      current.setDate(current.getDate() + 1);
    }

    // ── Update jatah cuti terpakai ────────────────────────────────────────────
    const jumlahHari = Math.round((selesai - mulai) / 86400000) + 1;

    const [[jatah]] = await conn.query(
      "SELECT id FROM jatah_cuti WHERE pegawai_id = ? AND tahun = ?",
      [pengajuan.pegawai_id, tahun],
    );

    if (jatah) {
      await conn.query(
        "UPDATE jatah_cuti SET terpakai = terpakai + ? WHERE pegawai_id = ? AND tahun = ?",
        [jumlahHari, pengajuan.pegawai_id, tahun],
      );
    } else {
      await conn.query(
        "INSERT INTO jatah_cuti (pegawai_id, tahun, jatah, terpakai) VALUES (?, ?, 12, ?)",
        [pengajuan.pegawai_id, tahun, jumlahHari],
      );
    }

    await conn.commit();
    res.json({
      message: "Pengajuan cuti disetujui dan jadwal berhasil diperbarui",
    });
  } catch (err) {
    await conn.rollback();
    console.error("[PengajuanCuti] APPROVE error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }
});

// ─── PUT /api/pengajuan-cuti/:id/reject ──────────────────────────────────────
// Admin menolak pengajuan
router.put("/:id/reject", async (req, res) => {
  const { catatan_admin } = req.body;

  if (!catatan_admin?.trim())
    return res.status(400).json({ message: "Alasan penolakan wajib diisi" });

  try {
    const [[pengajuan]] = await db.query(
      "SELECT status FROM pengajuan_cuti WHERE id = ?",
      [req.params.id],
    );

    if (!pengajuan)
      return res.status(404).json({ message: "Pengajuan tidak ditemukan" });
    if (pengajuan.status !== "Menunggu")
      return res
        .status(400)
        .json({ message: "Pengajuan sudah diproses sebelumnya" });

    await db.query(
      `UPDATE pengajuan_cuti
       SET status = 'Ditolak', catatan_admin = ?, updated_at = NOW()
       WHERE id = ?`,
      [catatan_admin.trim(), req.params.id],
    );

    res.json({ message: "Pengajuan cuti ditolak" });
  } catch (err) {
    console.error("[PengajuanCuti] REJECT error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── DELETE /api/pengajuan-cuti/:id ──────────────────────────────────────────
// Pegawai membatalkan pengajuan (hanya yang masih Menunggu)
router.delete("/:id", async (req, res) => {
  try {
    const [[row]] = await db.query(
      "SELECT status, surat_cuti FROM pengajuan_cuti WHERE id = ?",
      [req.params.id],
    );

    if (!row)
      return res.status(404).json({ message: "Pengajuan tidak ditemukan" });
    if (row.status !== "Menunggu")
      return res.status(400).json({
        message: "Hanya pengajuan dengan status Menunggu yang dapat dibatalkan",
      });

    // Hapus file surat jika ada
    if (row.surat_cuti) {
      const filePath = `uploads/surat_cuti/${row.surat_cuti}`;
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.query("DELETE FROM pengajuan_cuti WHERE id = ?", [req.params.id]);
    res.json({ message: "Pengajuan cuti berhasil dibatalkan" });
  } catch (err) {
    console.error("[PengajuanCuti] DELETE error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
