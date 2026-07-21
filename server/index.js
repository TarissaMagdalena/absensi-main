// ═══════════════════════════════════════════════════════════════
// INDEX.JS — Entry point backend server Express
// ═══════════════════════════════════════════════════════════════

import express from "express";
import cors from "cors";
import cron from "node-cron";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import pegawaiRoutes from "./routes/pegawaiRoutes.js";
import absensiRoutes from "./routes/absensiRoutes.js";
import jadwalRoutes from "./routes/jadwalRoutes.js";
import laporanRoutes from "./routes/laporanRoutes.js";
import cutiRoutes from "./routes/cutiRoutes.js";
import pengajuanCutiRoutes from "./routes/pengajuanCutiRoutes.js";

import { getWIBTime } from "./utils/getTime.js";
import { processAlfa } from "./services/AlfaService.js";

const app = express();

// ── CORS — izinkan frontend mengakses backend ─────────────────
app.use(cors());
// ── JSON parser — baca body request sebagai JSON ──────────────
app.use(express.json());
// ── Static files — serve folder uploads ───────────────────────
app.use("/uploads", express.static("uploads"));

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/pegawai", pegawaiRoutes);
app.use("/api/absensi", absensiRoutes);
app.use("/api/pengajuan-cuti", pengajuanCutiRoutes);
app.use("/api/jadwal", jadwalRoutes);
app.use("/api/laporan", laporanRoutes);
app.use("/api/cuti", cutiRoutes);

// ════════════════════════════════════════════════════════════════
// ENDPOINT WAKTU SERVER
// ════════════════════════════════════════════════════════════════
app.get("/api/time", async (req, res) => {
  try {
    // Ambil waktu dari NTP/TimeAPI/Cloudflare (tidak dari jam server)
    const serverTime = await getWIBTime();
    res.json({ serverTime });
  } catch {
    res.status(503).json({
      message:
        "Waktu tidak dapat diverifikasi. Pastikan server terhubung internet.",
    });
  }
});
app.get("/", (req, res) => res.send("API berjalan 🚀"));

// ─── Helper: tanggal WIB ──────────────────────────────────────────────────────
function tanggalWIB(date = new Date()) {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
}
function toDateStr(date) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

// ════════════════════════════════════════════════════════════════
// CRON JOB — Alfa Otomatis
// ════════════════════════════════════════════════════════════════
// ================= CRON 1: Setiap jam — cek Alfa shift yang sudah selesai ====
// Alfa ditandai 30 menit setelah jam PULANG shift, bukan jam masuk.
// Logika: pegawai dianggap Alfa hanya setelah shiftnya benar-benar selesai,
cron.schedule(
  "0 * * * *",
  async () => {
    const sekarang = tanggalWIB();
    const hariIniStr = toDateStr(sekarang);
    const kemarin = new Date(sekarang);
    kemarin.setDate(kemarin.getDate() - 1);
    const kemarinStr = toDateStr(kemarin);

    console.log(
      `[CRON Jam] ${sekarang.toLocaleTimeString("id-ID")} — cek Alfa...`,
    );

    try {
      // Hari ini: Alfa ditandai 30 menit setelah jam PULANG shift
      // AlfaService (hariIni=true) akan filter: sekarang >= jam_pulang + 30 menit
      const r1 = await processAlfa(hariIniStr, true, 30);
      if (r1.inserted > 0)
        console.log(`[CRON Jam] ✅ Hari ini: ${r1.inserted} Alfa`);

      // Kemarin: menangkap shift malam yang jam pulangnya dini hari hari ini
      // (misal shift MK: masuk 23:00, pulang 07:00 → baru selesai pagi ini)
      // hariIni=false → semua kandidat kemarin yang belum absen langsung Alfa
      const r2 = await processAlfa(kemarinStr, false);
      if (r2.inserted > 0)
        console.log(`[CRON Jam] ✅ Kemarin (shift malam): ${r2.inserted} Alfa`);
    } catch (err) {
      console.error("[CRON Jam] ❌ Error:", err.message);
    }
  },
  { timezone: "Asia/Jakarta" },
);

// ================= CRON 2: Tengah malam — cleanup final kemarin ==============
// Berjalan jam 00:00 WIB sebagai jaring pengaman.
// Memastikan seluruh pegawai yang tidak hadir kemarin sudah tercatat Alfa,
cron.schedule(
  "0 0 * * *",
  async () => {
    const kemarin = tanggalWIB();
    kemarin.setDate(kemarin.getDate() - 1);
    const kemarinStr = toDateStr(kemarin);

    console.log(`[CRON Tengah Malam] Cleanup Alfa ${kemarinStr}...`);
    try {
      // hariIni=false → langsung insert semua kandidat yang belum absen kemarin
      const result = await processAlfa(kemarinStr, false);
      if (result.inserted > 0) {
        console.log(
          `[CRON Tengah Malam] ✅ ${result.inserted} Alfa:`,
          result.detail.map((d) => d.nama).join(", "),
        );
      } else {
        console.log(
          `[CRON Tengah Malam] Tidak ada Alfa baru untuk ${kemarinStr}`,
        );
      }
    } catch (err) {
      console.error("[CRON Tengah Malam] ❌ Error:", err.message);
    }
  },
  { timezone: "Asia/Jakarta" },
);

console.log("✅ Cron job Alfa terdaftar (setiap jam + tengah malam WIB)");

// ================= START SERVER =================
app.listen(5000, () => console.log("Server running on port 5000"));
