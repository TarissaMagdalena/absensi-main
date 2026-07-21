// ═══════════════════════════════════════════════════════════════
// ABSENSI ROUTES — Semua endpoint API absensi
// ═══════════════════════════════════════════════════════════════
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
import { processAlfa } from "../services/AlfaService.js";

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
// Logic lengkap ada di absensiController.js:
//   1. Validasi accuracy < 5 → is_suspicious = 1
//   2. getWIBTime() → waktu dari server eksternal
//   3. Cek sudah absen hari ini?
//   4. Ambil jadwal shift
//   5. Validasi shift bukan L/CT
//   6. Validasi tidak terlalu awal (> 120 menit sebelum shift)
//   7. Validasi tidak setelah jam pulang
//   8. Hitung keterangan: Hadir/Terlambat + detail
//   9. Hitung jarak dari kantor (Haversine)
//  10. Validasi jarak <= 100m
//  11. INSERT ke tabel absensi

// ================= ABSEN PULANG =================
router.post("/pulang", absenPulang);

// ================= ABSENSI HARI INI (dengan Alfa) =================
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
      const isManualAdmin = row.keterangan?.startsWith(
        "Diabsensi manual oleh admin",
      );

      if (["Izin", "Sakit", "Cuti"].includes(row.tipe || row.status)) {
        return res.json({
          jam_masuk: row.jam_masuk,
          status: row.tipe || row.status,
          status_area: null,
          jam_pulang: null,
          keterangan: row.keterangan,
          is_pengajuan: false,
        });
      }

      return res.json({
        ...row,
        is_manual_admin: isManualAdmin,
      });
    }

    return res.json(null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= PROSES Alfa OTOMATIS (dengan catch-up) =================
router.post("/proses-Alfa", async (req, res) => {
  try {
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Jakarta",
    });

    // Cari tanggal terakhir ada data absensi di database
    const [[lastRow]] = await db.query(
      `SELECT DATE_FORMAT(MAX(tanggal), '%Y-%m-%d') as last_date FROM absensi`,
    );
    const lastDate = lastRow?.last_date;

    let totalInserted = 0;
    const allDetail = [];

    // ── Catch-up: proses semua tanggal yang terlewat ──────────────────────
    if (lastDate && lastDate < today) {
      const cursor = new Date(lastDate + "T00:00:00+07:00");
      cursor.setDate(cursor.getDate() + 1); // mulai dari hari setelah lastDate

      const todayDate = new Date(today + "T00:00:00+07:00");

      while (cursor < todayDate) {
        const tglStr = cursor.toLocaleDateString("en-CA", {
          timeZone: "Asia/Jakarta",
        });
        // hariIni=false → tanggal masa lalu, langsung insert semua kandidat
        const result = await processAlfa(tglStr, false);
        totalInserted += result.inserted;
        allDetail.push(
          ...result.detail.map((d) => ({ ...d, tanggal: tglStr })),
        );
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    // ── Proses hari ini (dengan toleransi 30 menit setelah jam masuk) ─────
    const hasilHariIni = await processAlfa(today, true, 30);
    totalInserted += hasilHariIni.inserted;
    allDetail.push(
      ...hasilHariIni.detail.map((d) => ({ ...d, tanggal: today })),
    );

    res.json({
      message:
        totalInserted > 0
          ? `${totalInserted} pegawai ditandai Alfa`
          : "Tidak ada Alfa baru",
      inserted: totalInserted,
      detail: allDetail,
    });
  } catch (err) {
    console.error("Proses Alfa error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ================= GET ALL ABSENSI =================
router.get("/", async (req, res) => {
  try {
    const { bulan } = req.query;

    const bulanFilter =
      bulan ||
      new Date()
        .toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
        .slice(0, 7); // YYYY-MM

    const [data] = await db.query(
      `
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
        a.accuracy,
        a.status_area,
        a.status_area_pulang,
        a.keterangan,
        a.keterangan_pulang,
        a.surat_mc,
        a.surat_cuti,
        a.is_from_jadwal,
        a.is_suspicious
      FROM absensi a
      JOIN pegawai p ON a.pegawai_id = p.id
      WHERE DATE_FORMAT(a.tanggal, '%Y-%m') = ?
      ORDER BY a.tanggal DESC, a.jam_masuk DESC
      `,
      [bulanFilter],
    );

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
    const [[{ total: Alfa }]] = await db.query(
      "SELECT COUNT(*) as total FROM absensi WHERE tanggal = ? AND status = 'Alfa'",
      [tanggal],
    );
    // Status setiap pegawai hari ini (untuk daftar pegawai di dashboard)
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
    // Aktivitas terbaru hari ini — LIMIT 10
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
      Alfa,
      pegawaiHariIni,
      aktivitas,
    });
  } catch (err) {
    console.error("Dashboard summary error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ================= RIWAYAT PER PEGAWAI =================
// Di absensiRoutes.js
router.get("/rekapan/:pegawai_id", async (req, res) => {
  try {
    const { start, end } = req.query;

    // Jika ada parameter start & end, gunakan sebagai filter
    // Jika tidak, ambil semua data
    const whereClause =
      start && end
        ? "WHERE a.pegawai_id = ? AND a.tanggal BETWEEN ? AND ?"
        : "WHERE a.pegawai_id = ?";
    const params =
      start && end
        ? [req.params.pegawai_id, start, end]
        : [req.params.pegawai_id];

    const [data] = await db.query(
      `SELECT 
        a.id,
        DATE_FORMAT(a.tanggal, '%Y-%m-%d') as tanggal,
        a.jam_masuk, a.jam_pulang, a.status,
        COALESCE(a.shift_kode, j.shift_kode) as shift_kode,
        a.status_area, a.status_area_pulang,
        a.keterangan, a.keterangan_pulang,
        a.latitude, a.longitude, a.distance, a.accuracy,
        a.surat_mc, a.is_from_jadwal
       FROM absensi a
       LEFT JOIN jadwal_pegawai j
         ON a.pegawai_id = j.pegawai_id
         AND DATE(a.tanggal) = DATE(j.tanggal)
       ${whereClause}
       ORDER BY a.tanggal DESC`,
      params,
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= TAMBAH ABSENSI MANUAL (admin) =================
// upload.single("surat_mc") → handle multipart/form-data dari frontend
router.post("/manual", upload.single("surat_mc"), async (req, res) => {
  try {
    const { pegawai_id, tanggal, status, shift_kode, keterangan } = req.body;
    const suratMc = req.file?.filename || null;

    // ── Validasi wajib ────────────────────────────────────────────
    if (!pegawai_id || !tanggal || !status) {
      return res
        .status(400)
        .json({ message: "pegawai_id, tanggal, dan status wajib diisi" });
    }

    // ── ✅ Validasi backdate ───────────────────────────────────────
    // Ambil tanggal hari ini dalam WIB dari server (tidak dari perangkat)
    let hariIni;
    try {
      const wib = await getWIBTime();
      hariIni = formatWIB(wib).today; // "YYYY-MM-DD"
    } catch {
      hariIni = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Jakarta",
      });
    }

    // Tanggal yang diinput tidak boleh sebelum hari ini
    if (tanggal < hariIni) {
      return res.status(400).json({
        message: `Tidak dapat menginput absensi mundur. Tanggal minimal adalah ${hariIni}.`,
      });
    }

    // Tanggal tidak boleh lebih dari hari ini (masa depan)
    if (tanggal > hariIni) {
      return res.status(400).json({
        message: "Tidak dapat menginput absensi untuk tanggal yang belum tiba.",
      });
    }

    // ── Cek duplikasi absensi ─────────────────────────────────────
    const [cek] = await db.query(
      "SELECT id FROM absensi WHERE pegawai_id = ? AND tanggal = ?",
      [pegawai_id, tanggal],
    );
    if (cek.length > 0) {
      return res.status(400).json({
        message: "Pegawai sudah memiliki data absensi di tanggal ini",
      });
    }

    // ── Ambil waktu saat ini dari server ─────────────────────────
    let jam_masuk_manual = null;
    if (status === "Hadir") {
      try {
        const realTime = await getWIBTime();
        jam_masuk_manual = formatWIB(realTime).now;
      } catch {
        jam_masuk_manual = new Date().toLocaleTimeString("en-GB", {
          hour12: false,
          timeZone: "Asia/Jakarta",
        });
      }
    }

    // ── INSERT absensi manual ─────────────────────────────────────
    await db.query(
      `
      INSERT INTO absensi
        (pegawai_id, tanggal, status, keterangan, shift_kode, jam_masuk, surat_mc, is_from_jadwal)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `,
      [
        pegawai_id,
        tanggal,
        status,
        keterangan,
        shift_kode || null,
        jam_masuk_manual,
        suratMc,
      ],
    );

    res.json({ message: `Absensi ${status} berhasil ditambahkan` });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    // ── Cek apakah ini cuti dari jadwal ──────────────────────────
    const [[absensi]] = await db.query(
      "SELECT status, is_from_jadwal, surat_mc FROM absensi WHERE id = ?",
      [id],
    );
    if (!absensi)
      return res.status(404).json({ message: "Data absensi tidak ditemukan" });
    // Blokir penghapusan cuti yang berasal dari jadwal shift
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
