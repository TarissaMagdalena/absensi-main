import express from "express";
import cors from "cors";

import { db } from "./db.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import pengajuanRoutes from "./routes/pengajuanRoutes.js";

import jadwalRoutes from "./routes/jadwal.js";
import absensiRoutes from "./routes/absensiRoutes.js";
import pegawaiRoutes from "./routes/pegawaiRoutes.js";
import laporanRoutes from "./routes/laporanRoutes.js";
import usersRoutes from "./routes/users.js";

// import authRoutes from "./routes/auth.js"; // pakai kalau ada

const app = express();

// middleware
app.use(cors());
app.use(express.json()); // ✅ ganti bodyParser

// routes
// app.use("/api/auth", authRoutes); // aktifkan kalau ada file auth
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/pengajuan", pengajuanRoutes);

app.use("/api/absensi", absensiRoutes);
app.use("/api/jadwal", jadwalRoutes);
app.use("/api/pegawai", pegawaiRoutes);
app.use("/api/laporan", laporanRoutes);
app.use("/api/users", usersRoutes);

// server time (anti manipulasi jam user)
app.get("/api/time", (req, res) => {
  res.json({
    serverTime: new Date(),
  });
});

// test route (opsional, buat debug)
app.get("/", (req, res) => {
  res.send("API berjalan 🚀");
});

// run server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
