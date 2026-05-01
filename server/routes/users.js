import express from "express";
import { db } from "../db.js";

const router = express.Router();

// GET
router.get("/", (req, res) => {
  db.query(
    `SELECT users.*, pegawai.nama 
     FROM users 
     JOIN pegawai ON users.pegawai_id = pegawai.id`,
    (err, result) => {
      if (err) return res.json(err);
      res.json(result);
    },
  );
});

// POST
router.post("/", (req, res) => {
  const { pegawai_id, email, password, role } = req.body;

  db.query(
    "INSERT INTO users (pegawai_id, email, password, role, status) VALUES (?, ?, ?, ?, 'aktif')",
    [pegawai_id, email, password, role],
    (err, result) => {
      if (err) return res.json(err);
      res.json({ message: "Akun berhasil dibuat" });
    },
  );
});

// DELETE
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.json(err);
    res.json({ message: "Akun dihapus" });
  });
});

export default router;
