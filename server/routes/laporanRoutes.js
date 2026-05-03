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

// GET /api/laporan/download
router.get("/download", async (req, res) => {
  const { pegawai_id, start, end } = req.query;

  if (!pegawai_id || !start || !end) {
    return res.status(400).json({ message: "Parameter tidak lengkap" });
  }

  try {
    const [[pegawai]] = await db.query(
      "SELECT nama FROM pegawai WHERE id = ?",
      [pegawai_id],
    );

    const [data] = await db.query(
      `SELECT a.tanggal, a.jam_masuk, a.jam_pulang, a.status
       FROM absensi a
       WHERE a.pegawai_id = ? AND a.tanggal BETWEEN ? AND ?
       ORDER BY a.tanggal ASC`,
      [pegawai_id, start, end],
    );

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=laporan-absensi.pdf",
    );
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // Header
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("LAPORAN ABSENSI", { align: "center" });
    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`Nama     : ${pegawai?.nama || "-"}`);
    doc.text(`Periode  : ${start} s/d ${end}`);
    doc.moveDown();

    // Summary
    const hadir = data.filter((d) => d.status === "Hadir").length;
    const terlambat = data.filter((d) => d.status === "Terlambat").length;
    const sakit = data.filter((d) => d.status === "Sakit").length;
    const izin = data.filter((d) => d.status === "Izin").length;
    const alpha = data.filter((d) => d.status === "Alpha").length;

    doc.font("Helvetica-Bold").text("Rekap:");
    doc
      .font("Helvetica")
      .text(
        `Hadir: ${hadir} | Terlambat: ${terlambat} | Sakit: ${sakit} | Izin: ${izin} | Alpha: ${alpha}`,
      );
    doc.moveDown();

    // Table header
    doc.font("Helvetica-Bold");
    doc.text(
      "No  Tanggal                          Jam Masuk   Jam Pulang   Status",
    );
    doc.moveTo(40, doc.y).lineTo(570, doc.y).stroke();
    doc.moveDown(0.3);

    // Table rows
    doc.font("Helvetica");
    data.forEach((item, i) => {
      const tgl = new Date(item.tanggal).toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      doc.text(
        `${String(i + 1).padEnd(4)}${tgl.padEnd(32)}${(item.jam_masuk || "-").padEnd(12)}${(item.jam_pulang || "-").padEnd(13)}${item.status}`,
      );
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal generate PDF" });
  }
});

export default router;
