import express from "express";
import { db } from "../db.js";
import { absenMasuk, absenPulang } from "../controllers/absensiController.js";

const router = express.Router();

// ================= ABSEN MASUK =================
router.post("/masuk", absenMasuk);

// ================= ABSEN PULANG =================
router.post("/pulang", absenPulang);

// ================= ABSENSI HARI INI =================
router.get("/hari-ini", async (req, res) => {
  try {
    const { pegawai_id } = req.query;
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Jakarta",
    });
    const [rows] = await db.query(
      "SELECT * FROM absensi WHERE pegawai_id = ? AND tanggal = ?",
      [pegawai_id, today],
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= GET ALL ABSENSI =================
router.get("/", async (req, res) => {
  try {
    const [data] = await db.query(`
      SELECT 
        a.id,
        p.nama,
        DATE_FORMAT(a.tanggal, '%Y-%m-%d') as tanggal,
        a.jam_masuk,
        a.jam_pulang,
        a.status,
        a.shift_kode,
        a.latitude,
        a.longitude,
        a.distance,
        a.status_area
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
    new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Jakarta",
    });

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

    const [[{ total: pendingApproval }]] = await db.query(
      "SELECT COUNT(*) as total FROM pengajuan WHERE status = 'Pending'",
    );

    const [pegawaiHariIni] = await db.query(
      `SELECT p.nama, COALESCE(a.status, 'Belum Absen') as status
       FROM pegawai p
       LEFT JOIN absensi a ON p.id = a.pegawai_id AND a.tanggal = ?
       ORDER BY p.nama ASC`,
      [tanggal],
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
      pendingApproval,
      pegawaiHariIni,
      aktivitas,
    });
  } catch (err) {
    console.error("Dashboard summary error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ================= RIWAYAT PER PEGAWAI =================
router.get("/riwayat/:pegawai_id", async (req, res) => {
  try {
    const [data] = await db.query(
      `SELECT 
        id,
        DATE_FORMAT(tanggal, '%Y-%m-%d') as tanggal,
        jam_masuk,
        jam_pulang,
        status,
        shift_kode,
        status_area,
        latitude,
        longitude,
        distance,
        accuracy
       FROM absensi 
       WHERE pegawai_id = ? 
       ORDER BY tanggal DESC`,
      [req.params.pegawai_id],
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
