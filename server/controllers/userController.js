import { db } from "../db.js";
import bcrypt from "bcrypt";

// ================= GET ALL USERS =================
export const getUsers = async (req, res) => {
  try {
    const [data] = await db.query(
      "SELECT id, nama, email, role FROM users ORDER BY id DESC",
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= CREATE USER =================
export const createUser = async (req, res) => {
  try {
    const { nama, email, password, role } = req.body;

    if (!nama || !email || !password) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    // Cek email duplikat
    const [cek] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (cek.length > 0) {
      return res.status(400).json({ message: "Email sudah digunakan" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)",
      [nama, email, hashed, role || "pegawai"],
    );

    res.json({ message: "Akun berhasil dibuat" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= DELETE USER =================
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "Akun berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
