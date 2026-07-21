// ═══════════════════════════════════════════════════════════════
// PEGAWAI ROUTES — CRUD data kontak pegawai
// ═══════════════════════════════════════════════════════════════

import express from "express";
import { db } from "../db.js";

const router = express.Router();

// GET ALL / Ambil semua pegawai dari database
router.get("/", async (req, res) => {
  try {
    const [data] = await db.query("SELECT * FROM pegawai ORDER BY id DESC");
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE / Tambah pegawai baru langsung ke tabel pegawai (tanpa akun login)
router.post("/", async (req, res) => {
  try {
    const { nama, nik, no_hp, email, alamat } = req.body;

    // ── Validasi field wajib ──────────────────────────────────────
    if (!nama || !nik) {
      return res.status(400).json({ message: "Nama dan NIK wajib diisi" });
    }

    // ── Cek duplikasi NIK ─────────────────────────────────────────
    const [cek] = await db.query("SELECT * FROM pegawai WHERE nik = ?", [nik]);
    if (cek.length > 0) {
      return res.status(400).json({ message: "NIK sudah terdaftar" });
    }
    // ── INSERT pegawai baru ───────────────────────────────────────
    const [result] = await db.query(
      "INSERT INTO pegawai (nama, nik, no_hp, email, alamat) VALUES (?, ?, ?, ?, ?)",
      [nama, nik, no_hp, email, alamat],
    );

    res.json({ message: "Pegawai berhasil ditambahkan", id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE: data kontak pegawai
router.put("/:id", async (req, res) => {
  try {
    const { nama, nik, no_hp, email, alamat } = req.body;

    // Update semua field kontak sekaligus
    // req.params.id = id pegawai dari URL (/api/pegawai/5)
    await db.query(
      "UPDATE pegawai SET nama=?, nik=?, no_hp=?, email=?, alamat=? WHERE id=?",
      [nama, nik, no_hp, email, alamat, req.params.id],
    );

    res.json({ message: "Pegawai berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE / Hapus pegawai dari tabel pegawai saja
router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM pegawai WHERE id = ?", [req.params.id]);
    res.json({ message: "Pegawai berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
