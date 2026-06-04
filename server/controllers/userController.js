import { db } from "../db.js";
import bcrypt from "bcrypt";

// GET ALL USERS
export const getUsers = async (req, res) => {
  try {
    const [data] = await db.query(
      "SELECT id, nama, username, role FROM users ORDER BY id DESC",
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// CREATE USER
export const createUser = async (req, res) => {
  try {
    const { nama, username, password, role } = req.body;

    if (!nama || !username || !password) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    // Cek username duplikat
    const [cek] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (cek.length > 0) {
      return res.status(400).json({ message: "username sudah digunakan" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Insert ke users
    const [result] = await db.query(
      "INSERT INTO users (nama, username, password, role) VALUES (?, ?, ?, ?)",
      [nama, username, hashed, role || "pegawai"],
    );

    // 🔥 Otomatis buat entri kosong di tabel pegawai kalau role pegawai
    if (role === "pegawai") {
      await db.query("INSERT INTO pegawai (user_id, nama) VALUES (?, ?)", [
        result.insertId,
        nama,
      ]);
    }

    res.json({ message: "Akun berhasil dibuat" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { nama, username, role, password } = req.body;
    const { id } = req.params;

    if (!nama || !username) {
      return res.status(400).json({ message: "Nama dan username wajib diisi" });
    }

    const [cek] = await db.query(
      "SELECT id FROM users WHERE username = ? AND id != ?",
      [username, id],
    );
    if (cek.length > 0) {
      return res.status(400).json({ message: "username sudah digunakan" });
    }

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await db.query(
        "UPDATE users SET nama = ?, username = ?, role = ?, password = ? WHERE id = ?",
        [nama, username, role, hashed, id],
      );
    } else {
      await db.query(
        "UPDATE users SET nama = ?, username = ?, role = ? WHERE id = ?",
        [nama, username, role, id],
      );
    }

    await db.query("UPDATE pegawai SET nama = ? WHERE user_id = ?", [nama, id]);

    res.json({ message: "Akun berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } // ← tutup catch
}; // ← tutup fungsi — INI YANG HILANG

// DELETE USER
export const deleteUser = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { id } = req.params;

    await conn.beginTransaction();

    const [pegawai] = await conn.query(
      "SELECT id FROM pegawai WHERE user_id = ?",
      [id],
    );

    if (pegawai.length > 0) {
      const pegawaiId = pegawai[0].id;

      await conn.query("DELETE FROM absensi WHERE pegawai_id = ?", [pegawaiId]);
      await conn.query("DELETE FROM jadwal_pegawai WHERE pegawai_id = ?", [
        pegawaiId,
      ]);
      await conn.query("DELETE FROM jatah_cuti WHERE pegawai_id = ?", [
        pegawaiId,
      ]);
      await conn.query("DELETE FROM pegawai WHERE id = ?", [pegawaiId]);
    }

    // ✅ Ini yang hilang — hapus dari tabel users
    await conn.query("DELETE FROM users WHERE id = ?", [id]);

    await conn.commit();

    res.json({ message: "Akun berhasil dihapus" });
  } catch (err) {
    await conn.rollback();

    console.error("DELETE USER ERROR:", err);

    res.status(500).json({
      message: "Gagal menghapus akun",
      error: err.message,
    });
  } finally {
    conn.release();
  }
};
