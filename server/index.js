import express from "express";
import cors from "cors";
import { db } from "./db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import pegawaiRoutes from "./routes/pegawaiRoutes.js";
import absensiRoutes from "./routes/absensiRoutes.js";
import pengajuanRoutes from "./routes/pengajuanRoutes.js";
import jadwalRoutes from "./routes/jadwal.js";
import laporanRoutes from "./routes/laporanRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); // 🔥 hapus duplikat usersRoutes
app.use("/api/pegawai", pegawaiRoutes);
app.use("/api/absensi", absensiRoutes);
app.use("/api/pengajuan", pengajuanRoutes);
app.use("/api/jadwal", jadwalRoutes);
app.use("/api/laporan", laporanRoutes);

// Server time
app.get("/api/time", (req, res) => {
  res.json({ serverTime: new Date() });
});

app.get("/", (req, res) => {
  res.send("API berjalan 🚀");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
