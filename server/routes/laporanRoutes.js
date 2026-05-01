import express from "express";
import PDFDocument from "pdfkit";
import { db } from "../db.js";

const router = express.Router();

// GET /api/laporan?pegawai_id=1&start=2026-04-01&end=2026-04-30
router.get("/", async (req, res) => {
  const { pegawai_id, start, end } = req.query;

  if (!pegawai_id || !start || !end) {
    return res.status(400).json({ message: "Parameter tidak lengkap" });
  }

  try {
    const [rows] = await db.query(
      `SELECT tanggal, jam_masuk, jam_pulang, status
       FROM absensi
       WHERE pegawai_id = ? AND tanggal BETWEEN ? AND ?
       ORDER BY tanggal ASC`,
      [pegawai_id, start, end],
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/laporan/download?pegawai_id=1&start=...&end=...
router.get("/download", async (req, res) => {
  const { pegawai_id, start, end } = req.query;

  try {
    const [data] = await db.query(
      `SELECT p.nama, a.tanggal, a.jam_masuk, a.jam_pulang, a.status
       FROM absensi a
       JOIN pegawai p ON a.pegawai_id = p.id
       WHERE a.pegawai_id = ? AND a.tanggal BETWEEN ? AND ?`,
      [pegawai_id, start, end],
    );

    const doc = new PDFDocument();
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=laporan-absensi.pdf",
    );
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    doc.fontSize(18).text("LAPORAN ABSENSI", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Periode: ${start} s/d ${end}`);
    doc.moveDown();
    doc.text("Nama | Tanggal | Masuk | Pulang | Status");
    doc.moveDown();

    data.forEach((item) => {
      doc.text(
        `${item.nama} | ${item.tanggal} | ${item.jam_masuk} | ${item.jam_pulang || "-"} | ${item.status}`,
      );
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal generate PDF" });
  }
});

export default router;
