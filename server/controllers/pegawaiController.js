import { db } from "../db.js";

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

    if (!nama || !nik) {
      return res.status(400).json({ message: "Nama dan NIK wajib diisi" });
    }

    const [cek] = await db.query("SELECT * FROM pegawai WHERE nik = ?", [nik]);
    if (cek.length > 0) {
      return res.status(400).json({ message: "NIK sudah terdaftar" });
    }

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

export const deletePegawai = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM pegawai WHERE id = ?", [id]);
    res.json({ message: "Pegawai berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
