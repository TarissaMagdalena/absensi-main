import express from "express";
import { db } from "../db.js";

const router = express.Router();

// 🔥 KONFIGURASI KANTOR
const OFFICE_LAT = 1.13;
const OFFICE_LNG = 104.05;
const MAX_RADIUS = 10000; // meter
const MAX_ACCURACY = 10000;

// 🔥 HITUNG JARAK (Haversine)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = (x) => (x * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ================= ABSEN MASUK =================
router.post("/masuk", (req, res) => {
  const { pegawai_id, lat, lng, accuracy } = req.body;

  const now = new Date();
  const tanggal = now.toISOString().split("T")[0];
  const jam = now.toTimeString().split(" ")[0];

  if (!pegawai_id || !lat || !lng) {
    return res.status(400).json({ message: "Data tidak lengkap" });
  }

  const distance = getDistance(lat, lng, OFFICE_LAT, OFFICE_LNG);

  if (distance > MAX_RADIUS) {
    return res.status(400).json({
      message: "Anda berada di luar area kantor",
      distance: Math.round(distance),
    });
  }

  const cekQuery = `SELECT * FROM absensi WHERE pegawai_id = ? AND tanggal = ?`;

  db.query(cekQuery, [pegawai_id, tanggal], (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length > 0) {
      return res.json({ message: "Sudah absen hari ini" });
    }

    const qJadwal = `
      SELECT * FROM jadwal_pegawai
      WHERE pegawai_id = ? AND tanggal = CURDATE()
    `;

    db.query(qJadwal, [pegawai_id], (err, jadwal) => {
      if (err) return res.status(500).json(err);

      if (jadwal.length === 0) {
        return res.status(400).json({
          message: "Tidak ada jadwal hari ini",
          distance: 0,
        });
      }

      const shiftKode = jadwal[0].shift_kode;

      db.query(
        "SELECT * FROM shift WHERE kode=?",
        [shiftKode],
        (err, shift) => {
          if (err) return res.status(500).json(err);

          const shiftData = shift[0];
          let status = "Hadir";
          if (jam > shiftData.jam_masuk) status = "Terlambat";

          const qInsert = `
          INSERT INTO absensi 
          (pegawai_id, tanggal, jam_masuk, shift_kode, status, latitude, longitude)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

          db.query(
            qInsert,
            [pegawai_id, tanggal, jam, shiftKode, status, lat, lng],
            (err) => {
              if (err) return res.status(500).json(err);
              res.json({
                message: "Absen berhasil",
                status,
                distance: Math.round(distance),
                accuracy,
                jam_masuk: jam,
              });
            },
          );
        },
      );
    });
  });
});

// ================= ABSEN PULANG =================
router.post("/pulang", (req, res) => {
  const { pegawai_id, lat, lng, accuracy } = req.body;

  const now = new Date();
  const tanggal = now.toISOString().split("T")[0];
  const jam = now.toTimeString().split(" ")[0];

  if (lat && lng) {
    const distance = getDistance(lat, lng, OFFICE_LAT, OFFICE_LNG);
    if (distance > MAX_RADIUS) {
      return res.status(400).json({
        message: "Anda di luar area kantor",
        distance: Math.round(distance),
      });
    }
  }

  const q = `UPDATE absensi SET jam_pulang = ? WHERE pegawai_id = ? AND tanggal = ?`;

  db.query(q, [jam, pegawai_id, tanggal], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Absen pulang berhasil", jam_pulang: jam });
  });
});

// ================= GET ALL ABSENSI =================
router.get("/", async (req, res) => {
  try {
    const [data] = await db.query(`
      SELECT 
        a.id,
        p.nama,
        a.tanggal,
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
  const tanggal = req.query.tanggal || new Date().toISOString().split("T")[0];

  try {
    const [[{ total: totalPegawai }]] = await db.query(
      "SELECT COUNT(*) as total FROM pegawai",
    );

    const [[{ total: hadirHariIni }]] = await db.query(
      "SELECT COUNT(*) as total FROM absensi WHERE tanggal = ?",
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

export default router;
