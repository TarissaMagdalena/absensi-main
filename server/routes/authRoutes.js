// ═══════════════════════════════════════════════════════════════
// AUTH ROUTES — Autentikasi: login dan ganti password
// ═══════════════════════════════════════════════════════════════
import express from "express";
import { db } from "../db.js";
import bcrypt from "bcrypt";

const router = express.Router();

// ================= LOGIN =================
// Alur:
//   1. Validasi field tidak kosong
//   2. Cari user berdasarkan username di tabel users
//   3. Verifikasi password dengan bcrypt.compare
//   4. Jika role = "pegawai" → ambil pegawai_id dan NIK
//   5. Return data user (tanpa password)
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body; // ← email → username

    // ── Validasi field tidak boleh kosong ─────────────────────────
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Nama Pengguna dan Kata Sandi wajib diisi" });
    }
    // ── Cari user berdasarkan username ────────────────────────────
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]); // ← WHERE email → username

    if (rows.length === 0) {
      return res.status(401).json({ message: "Nama Pengguna tidak ditemukan" }); // ← pesan
    }

    const user = rows[0];

    // ── Verifikasi password dengan bcrypt ─────────────────────────
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Kata Sandi salah" });
    // ── Ambil pegawai_id dan NIK (hanya untuk role pegawai) ───────
    let pegawai_id = null;
    let nik = null;
    if (user.role === "pegawai") {
      const [pegawai] = await db.query(
        "SELECT id, nik FROM pegawai WHERE user_id = ?",
        [user.id],
      );
      if (pegawai.length > 0) {
        pegawai_id = pegawai[0].id;
        nik = pegawai[0].nik;
      }
    }
    // ── Response sukses ───────────────────────────────────────────
    res.json({
      message: "Login berhasil",
      user: {
        id: user.id,
        pegawai_id,
        nama: user.nama,
        username: user.username,
        role: user.role,
        nik,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ================= GANTI PASSWORD =================
// Alur validasi berlapis:
//   1. Cek semua field terisi
//   2. Cek newPassword === confirmPassword
//   3. Cek panjang minimal password baru
//   4. Cari user di database berdasarkan user_id
//   5. Verifikasi password lama dengan bcrypt.compare
//   6. Hash password baru + UPDATE database
router.put("/change-password", async (req, res) => {
  const { user_id, currentPassword, newPassword, confirmPassword } = req.body;
  // ── VALIDASI 1: semua field wajib diisi ──────────────────────
  if (!user_id || !currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "Semua field harus diisi" });
  }
  // ── VALIDASI 2: konfirmasi password cocok ─────────────────────
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Kata Sandi baru tidak sama" });
  }
  // ── VALIDASI 3: panjang minimal password ─────────────────────
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Kata Sandi minimal 6 karakter" });
  }
  // ── VALIDASI 4: cari user di database ─────────────────────────
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [
      user_id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }

    const user = rows[0];

    // ── VALIDASI 5: verifikasi password lama ─────────────────────
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Kata Sandi saat ini salah" });
    }

    // ── Hash password baru sebelum disimpan ───────────────────────
    const hashed = await bcrypt.hash(newPassword, 10);

    // ── UPDATE password di database ───────────────────────────────
    await db.query("UPDATE users SET password = ? WHERE id = ?", [
      hashed,
      user.id,
    ]);

    res.json({ message: "Kata Sandi berhasil diubah" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
