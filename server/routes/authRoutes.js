import express from "express";
import { db } from "../db.js";
import bcrypt from "bcrypt";

const router = express.Router();

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email dan password wajib diisi" });
    }

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Email tidak ditemukan" });
    }

    const user = rows[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Password salah" });
    }

    // 🔥 Ambil pegawai_id dan nik berdasarkan user_id
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

    res.json({
      message: "Login berhasil",
      user: {
        id: user.id,
        pegawai_id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        nik,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ================= GANTI PASSWORD =================
router.put("/change-password", async (req, res) => {
  const { user_id, currentPassword, newPassword, confirmPassword } = req.body;

  if (!user_id || !currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "Semua field harus diisi" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Password baru tidak sama" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password minimal 6 karakter" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [
      user_id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const user = rows[0];

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Password saat ini salah" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.query("UPDATE users SET password = ? WHERE id = ?", [
      hashed,
      user.id,
    ]);

    res.json({ message: "Password berhasil diubah" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
