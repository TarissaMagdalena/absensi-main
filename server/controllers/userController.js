// ═══════════════════════════════════════════════════════════════
// USER CONTROLLER — CRUD akun login pengguna sistem
// ═══════════════════════════════════════════════════════════════
import { db } from "../db.js";
import bcrypt from "bcrypt";

// GET ALL USERS
// Dipakai di: ManajemenAkun.jsx (tabel daftar akun)
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
// Yang dilakukan:
//   1. Validasi field wajib
//   2. Cek duplikasi username
//   3. Hash password dengan bcrypt (salt rounds = 10)
//   4. INSERT ke tabel users
//   5. Jika role = "pegawai" → otomatis INSERT ke tabel pegawai
export const createUser = async (req, res) => {
  try {
    const { nama, username, password, role } = req.body;
    // ── Validasi field wajib ──────────────────────────────────────
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

    // Otomatis buat entri kosong di tabel pegawai kalau role pegawai
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
// Edit data akun login
// Yang dilakukan:
//   1. Validasi field wajib
//   2. Cek duplikasi username (kecuali username milik akun ini sendiri)
//   3. Update users: dengan atau tanpa password baru
//   4. Sinkronisasi nama ke tabel pegawai
export const updateUser = async (req, res) => {
  try {
    const { nama, username, role, password } = req.body;
    const { id } = req.params;
    // ── Validasi field wajib ──────────────────────────────────────
    if (!nama || !username) {
      return res.status(400).json({ message: "Nama dan username wajib diisi" });
    }
    // ── Cek duplikasi username  ──────────────────────────────────────
    const [cek] = await db.query(
      "SELECT id FROM users WHERE username = ? AND id != ?",
      [username, id],
    );
    if (cek.length > 0) {
      return res.status(400).json({ message: "username sudah digunakan" });
    }
    // ── UPDATE dengan password baru ───────────────────────────────
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await db.query(
        "UPDATE users SET nama = ?, username = ?, role = ?, password = ? WHERE id = ?",
        [nama, username, role, hashed, id],
      );
    } else {
      // ── UPDATE tanpa ubah password ────────────────────────────────
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
// Urutan penghapusan (PENTING — harus dari tabel anak ke induk):
//   1. absensi        (bergantung pada pegawai_id)
//   2. jadwal_pegawai (bergantung pada pegawai_id)
//   3. jatah_cuti     (bergantung pada pegawai_id)
//   4. pegawai        (bergantung pada user_id)
//   5. users          (tabel induk — dihapus terakhir)
export const deleteUser = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { id } = req.params;

    await conn.beginTransaction();

    const [pegawai] = await conn.query(
      "SELECT id FROM pegawai WHERE user_id = ?",
      [id],
    );
    // ── Hapus data anak terlebih dahulu ──────────────────────────
    if (pegawai.length > 0) {
      const pegawaiId = pegawai[0].id;
      // Hapus semua riwayat absensi pegawai ini
      await conn.query("DELETE FROM absensi WHERE pegawai_id = ?", [pegawaiId]);
      // Hapus semua jadwal shift pegawai ini
      await conn.query("DELETE FROM jadwal_pegawai WHERE pegawai_id = ?", [
        pegawaiId,
      ]);
      // Hapus data jatah cuti pegawai ini
      await conn.query("DELETE FROM jatah_cuti WHERE pegawai_id = ?", [
        pegawaiId,
      ]);
      // Hapus entri di tabel pegawai
      await conn.query("DELETE FROM pegawai WHERE id = ?", [pegawaiId]);
    }
    // Hapus akun dari tabel users
    await conn.query("DELETE FROM users WHERE id = ?", [id]);
    // Semua langkah berhasil → simpan semua perubahan secara permanen
    await conn.commit();

    res.json({ message: "Akun berhasil dihapus" });
  } catch (err) {
    // ── Rollback jika ada yang gagal ─────────────────────────────
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
