import express from "express";
import cors from "cors";
import cron from "node-cron";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import pegawaiRoutes from "./routes/pegawaiRoutes.js";
import absensiRoutes from "./routes/absensiRoutes.js";
import pengajuanRoutes from "./routes/pengajuanRoutes.js";
import jadwalRoutes from "./routes/jadwalRoutes.js";
import laporanRoutes from "./routes/laporanRoutes.js";
import cutiRoutes from "./routes/cutiRoutes.js";

import { getWIBTime } from "./utils/getTime.js";
import { processAlpha } from "./services/alphaService.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/pegawai", pegawaiRoutes);
app.use("/api/absensi", absensiRoutes);
app.use("/api/pengajuan", pengajuanRoutes);
app.use("/api/jadwal", jadwalRoutes);
app.use("/api/laporan", laporanRoutes);
app.use("/api/cuti", cutiRoutes);

app.get("/api/time", async (req, res) => {
  try {
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

// ================= CRON 1: Setiap jam (cek Alpha shift yang baru selesai) =====
// Menangkap:
//   - Shift pagi/siang hari ini yang sudah lewat jam masuk + 3 jam
//   - Shift malam kemarin yang baru selesai pagi ini
cron.schedule(
  "0 * * * *",
  async () => {
    const sekarang = tanggalWIB();
    const hariIniStr = toDateStr(sekarang);
    const kemarin = new Date(sekarang);
    kemarin.setDate(kemarin.getDate() - 1);
    const kemarinStr = toDateStr(kemarin);

    console.log(
      `[CRON Jam] ${sekarang.toLocaleTimeString("id-ID")} — cek Alpha...`,
    );

    try {
      // Hari ini: toleransi 3 jam (180 menit) setelah jam masuk
      const r1 = await processAlpha(hariIniStr, true, 180);
      if (r1.inserted > 0)
        console.log(`[CRON Jam] ✅ Hari ini: ${r1.inserted} Alpha`);

      // Kemarin: untuk shift malam yang baru selesai pagi ini
      const r2 = await processAlpha(kemarinStr, false);
      if (r2.inserted > 0)
        console.log(`[CRON Jam] ✅ Kemarin: ${r2.inserted} Alpha`);
    } catch (err) {
      console.error("[CRON Jam] ❌ Error:", err.message);
    }
  },
  { timezone: "Asia/Jakarta" },
);

// ================= CRON 2: Tengah malam (cleanup final kemarin) ===============
// Pastikan semua yang Alpha kemarin sudah tercatat
// (backup dari cron setiap jam, untuk yang terlewat)
cron.schedule(
  "0 0 * * *",
  async () => {
    const kemarin = tanggalWIB();
    kemarin.setDate(kemarin.getDate() - 1);
    const kemarinStr = toDateStr(kemarin);

    console.log(`[CRON Tengah Malam] Cleanup Alpha ${kemarinStr}...`);
    try {
      // hariIni = false → semua kandidat kemarin langsung Alpha
      const result = await processAlpha(kemarinStr, false);
      if (result.inserted > 0) {
        console.log(
          `[CRON Tengah Malam] ✅ ${result.inserted} Alpha diinsert:`,
          result.detail.map((d) => d.nama).join(", "),
        );
      } else {
        console.log(
          `[CRON Tengah Malam] Tidak ada Alpha baru untuk ${kemarinStr}`,
        );
      }
    } catch (err) {
      console.error("[CRON Tengah Malam] ❌ Error:", err.message);
    }
  },
  { timezone: "Asia/Jakarta" },
);

console.log("✅ Cron job Alpha terdaftar (setiap jam + tengah malam WIB)");

// ================= START SERVER =================
app.listen(5000, () => console.log("Server running on port 5000"));
