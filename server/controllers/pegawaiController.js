// ═══════════════════════════════════════════════════════════════
// PEGAWAI CONTROLLER — CRUD data kontak pegawai
// ═══════════════════════════════════════════════════════════════
import { db } from "../db.js";
// Ambil semua data pegawai dari tabel pegawai
// Dipakai di:
//   - DataPegawai.jsx (halaman admin — tampilkan tabel pegawai)
//   - DataAbsensi.jsx (dropdown pilih pegawai di form tambah)
//   - LaporanAbsensi.jsx (dropdown filter per pegawai)
//   - JadwalShift.jsx (baris-baris di grid jadwal)
export const getPegawai = async (req, res) => {
  try {
    const [data] = await db.query("SELECT * FROM pegawai ORDER BY id DESC");
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createPegawai = async (req, res) => {
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
    await db.query(
      `INSERT INTO pegawai (nama, nik, no_hp, email, alamat) 
       VALUES (?, ?, ?, ?, ?)`,
      [nama, nik, no_hp, email, alamat],
    );

    res.json({ message: "Pegawai berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Hapus pegawai dari tabel pegawai saja
export const deletePegawai = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM pegawai WHERE id = ?", [id]);
    res.json({ message: "Pegawai berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
