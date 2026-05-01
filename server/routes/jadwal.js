import express from "express";
import { db } from "../db.js";

const router = express.Router();

router.get("/", (req, res) => {
  const q = `
    SELECT 
      jp.id,
      p.nama,
      jp.tanggal,
      jp.shift_kode
    FROM jadwal_pegawai jp
    JOIN pegawai p ON jp.pegawai_id = p.id
    ORDER BY jp.tanggal DESC
  `;

  db.query(q, (err, data) => {
    if (err) return res.json(err);
    res.json(data);
  });
});

router.post("/", (req, res) => {
  const { pegawai_id, tanggal, shift_kode } = req.body;

  db.query(
    "INSERT INTO jadwal_pegawai (pegawai_id, tanggal, shift_kode) VALUES (?, ?, ?)",
    [pegawai_id, tanggal, shift_kode],
    (err) => {
      if (err) return res.json(err);
      res.json({ message: "OK" });
    },
  );
});

export default router;
