import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../db.js";
import {
  absenMasuk,
  absenPulang,
  getTodayAbsensi,
} from "../controllers/absensiController.js";
import { processAlpha } from "../services/alphaService.js";

const router = express.Router();

// ================= MULTER — Upload Surat MC =================
const uploadDir = "uploads/surat_mc";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `surat_mc_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // maks 5MB
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Format file tidak didukung. Gunakan JPG, PNG, atau PDF."));
    }
  },
});

// ================= ABSEN MASUK =================
router.post("/masuk", absenMasuk);

// ================= ABSEN PULANG =================
router.post("/pulang", absenPulang);

// ================= ABSENSI HARI INI (dengan Alpha) =================
router.get("/today", getTodayAbsensi);

// ================= ABSENSI HARI INI (per pegawai) =================
router.get("/hari-ini", async (req, res) => {
  try {
    const { pegawai_id } = req.query;
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Jakarta",
    });

    const [absensi] = await db.query(
      `SELECT * FROM absensi WHERE pegawai_id = ? AND tanggal = ?`,
      [pegawai_id, today],
    );

    if (absensi.length > 0) {
      const row = absensi[0];
      if (["Izin", "Sakit", "Cuti"].includes(row.tipe)) {
        return res.json({
          jam_masuk: row.jam_masuk,
          status: row.tipe,
          status_area: null,
          jam_pulang: null,
          is_pengajuan: false,
        });
      }
      return res.json(row);
    }

    return res.json(null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= PROSES ALPHA OTOMATIS =================
router.post("/proses-alpha", async (req, res) => {
  try {
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Jakarta",
    });
    const result = await processAlpha(today, true, 30);
    res.json({
      message:
        result.inserted > 0
          ? `${result.inserted} pegawai ditandai Alpha`
          : "Tidak ada Alpha baru hari ini",
      inserted: result.inserted,
      detail: result.detail,
    });
  } catch (err) {
    console.error("Proses alpha error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ================= GET ALL ABSENSI =================
router.get("/", async (req, res) => {
  try {
    const [data] = await db.query(`
      SELECT 
        a.id,
        a.pegawai_id,
        p.nama,
        DATE_FORMAT(a.tanggal, '%Y-%m-%d') as tanggal,
        a.jam_masuk,
        a.jam_pulang,
        a.status,
        a.shift_kode,
        a.latitude,
        a.longitude,
        a.distance,
        a.status_area,
        a.status_area_pulang,
        a.keterangan,
        a.keterangan_pulang,
        a.surat_mc,
        a.is_from_jadwal
      FROM absensi a
      JOIN pegawai p ON a.pegawai_id = p.id
      ORDER BY a.tanggal DESC, a.jam_masuk DESC
    `);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= DASHBOARD SUMMARY =================
router.get("/dashboard-summary", async (req, res) => {
  const tanggal =
    req.query.tanggal ||
    new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

  try {
    const [[{ total: totalPegawai }]] = await db.query(
      "SELECT COUNT(*) as total FROM pegawai",
    );
    const [[{ total: hadirHariIni }]] = await db.query(
      "SELECT COUNT(*) as total FROM absensi WHERE tanggal = ? AND status IN ('Hadir', 'Terlambat')",
      [tanggal],
    );
    const [[{ total: terlambat }]] = await db.query(
      "SELECT COUNT(*) as total FROM absensi WHERE tanggal = ? AND status = 'Terlambat'",
      [tanggal],
    );
    const [[{ total: alpha }]] = await db.query(
      "SELECT COUNT(*) as total FROM absensi WHERE tanggal = ? AND status = 'Alpha'",
      [tanggal],
    );

    const [pegawaiHariIni] = await db.query(
      `SELECT
         p.nama,
         CASE
           WHEN a.status IS NOT NULL THEN a.status
           ELSE 'Belum Absen'
         END as status
       FROM pegawai p
       LEFT JOIN absensi a
         ON p.id = a.pegawai_id AND a.tanggal = ?
       LEFT JOIN jadwal_pegawai j
         ON p.id = j.pegawai_id AND DATE(j.tanggal) = ?
       ORDER BY p.nama ASC`,
      [tanggal, tanggal],
    );

    const [aktivitas] = await db.query(
      `SELECT p.nama, a.status, a.jam_masuk, a.tanggal
       FROM absensi a
       JOIN pegawai p ON a.pegawai_id = p.id
       WHERE a.tanggal = ?
       ORDER BY a.jam_masuk DESC
       LIMIT 10`,
      [tanggal],
    );

    res.json({
      totalPegawai,
      hadirHariIni,
      terlambat,
      alpha,
      pegawaiHariIni,
      aktivitas,
    });
  } catch (err) {
    console.error("Dashboard summary error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ================= RIWAYAT PER PEGAWAI =================
router.get("/rekapan/:pegawai_id", async (req, res) => {
  try {
    const [data] = await db.query(
      `SELECT 
        a.id,
        DATE_FORMAT(a.tanggal, '%Y-%m-%d') as tanggal,
        a.jam_masuk,
        a.jam_pulang,
        a.status,
        COALESCE(a.shift_kode, j.shift_kode) as shift_kode,
        a.status_area,
        a.status_area_pulang,
        a.keterangan,
        a.keterangan_pulang,
        a.latitude,
        a.longitude,
        a.distance,
        a.accuracy,
        a.surat_mc,
        a.is_from_jadwal
       FROM absensi a
       LEFT JOIN jadwal_pegawai j
         ON a.pegawai_id = j.pegawai_id
         AND DATE(a.tanggal) = DATE(j.tanggal)
       WHERE a.pegawai_id = ?
       ORDER BY a.tanggal DESC`,
      [req.params.pegawai_id],
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= TAMBAH ABSENSI MANUAL (admin) =================
// upload.single("surat_mc") → handle multipart/form-data dari frontend
router.post("/manual", upload.single("surat_mc"), async (req, res) => {
  const { pegawai_id, tanggal, status, keterangan, potong_cuti } = req.body;
  const surat_mc = req.file ? req.file.filename : null;

  if (!pegawai_id || !tanggal || !status) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res
      .status(400)
      .json({ message: "pegawai_id, tanggal, dan status wajib diisi" });
  }

  const statusValid = ["Izin", "Sakit", "Cuti"];
  if (!statusValid.includes(status)) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res
      .status(400)
      .json({ message: "Status harus Izin, Sakit, atau Cuti" });
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    const [existing] = await conn.query(
      "SELECT id FROM absensi WHERE pegawai_id = ? AND tanggal = ? LIMIT 1",
      [pegawai_id, tanggal],
    );
    if (existing.length > 0) {
      await conn.rollback();
      conn.release();
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(409).json({
        message: "Sudah ada data absensi untuk pegawai ini di tanggal tersebut",
      });
    }

    await conn.query(
      `INSERT INTO absensi (pegawai_id, tanggal, status, keterangan, surat_mc, is_from_jadwal)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [pegawai_id, tanggal, status, keterangan || null, surat_mc],
    );

    if (status === "Cuti" && potong_cuti) {
      const tahun = tanggal.substring(0, 4);
      const [upd] = await conn.query(
        `UPDATE jatah_cuti SET terpakai = terpakai + 1 WHERE pegawai_id = ? AND tahun = ?`,
        [pegawai_id, tahun],
      );
      if (upd.affectedRows === 0) {
        await conn.query(
          `INSERT INTO jatah_cuti (pegawai_id, tahun, jatah, terpakai) VALUES (?, ?, 12, 1)`,
          [pegawai_id, tahun],
        );
      }
    }

    await conn.commit();
    res.status(201).json({ message: "Absensi berhasil ditambahkan" });
  } catch (err) {
    await conn.rollback();
    if (req.file) fs.unlinkSync(req.file.path);
    console.error("Tambah absensi manual error:", err);
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

// ================= EDIT ABSENSI (admin) =================
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { status, keterangan } = req.body;

  if (!status) return res.status(400).json({ message: "Status wajib diisi" });

  try {
    const [result] = await db.query(
      `UPDATE absensi SET status = ?, keterangan = ? WHERE id = ?`,
      [status, keterangan || null, id],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Data absensi tidak ditemukan" });

    res.json({ message: "Absensi berhasil diperbarui" });
  } catch (err) {
    console.error("Edit absensi error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ================= HAPUS ABSENSI (admin) =================
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [[absensi]] = await db.query(
      "SELECT status, is_from_jadwal, surat_mc FROM absensi WHERE id = ?",
      [id],
    );
    if (!absensi)
      return res.status(404).json({ message: "Data absensi tidak ditemukan" });

    if (absensi.status === "Cuti" && absensi.is_from_jadwal === 1) {
      return res.status(403).json({
        message:
          "Cuti dari jadwal tidak bisa dihapus manual. Ubah jadwal shift di halaman Jadwal Shift.",
      });
    }

    // Hapus file surat MC dari disk jika ada
    if (absensi.surat_mc) {
      const filePath = `uploads/surat_mc/${absensi.surat_mc}`;
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    const [result] = await db.query("DELETE FROM absensi WHERE id = ?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Data absensi tidak ditemukan" });

    res.json({ message: "Absensi berhasil dihapus" });
  } catch (err) {
    console.error("Hapus absensi error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
