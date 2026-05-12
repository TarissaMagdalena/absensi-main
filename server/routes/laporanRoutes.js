import express from "express";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs"; // npm install exceljs
import { db } from "../db.js";

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTanggalIndo(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTanggalPendek(dateStr) {
  const str =
    dateStr instanceof Date
      ? dateStr.toISOString().slice(0, 10)
      : String(dateStr).slice(0, 10);
  return new Date(str + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusColor(status) {
  const m = {
    Hadir: "#2e7d32",
    Terlambat: "#e65100",
    Izin: "#1565c0",
    Sakit: "#6a1b9a",
    Cuti: "#00695c",
    Alpha: "#c62828",
  };
  return m[status] || "#333333";
}
function getAreaColor(area) {
  if (!area || area === "-") return "#999999";
  return area === "DALAM" ? "#2e7d32" : "#c62828";
}

const NON_HADIR = ["Izin", "Sakit", "Cuti", "Alpha"];

// ── argb dari hex (#rrggbb) ─────────────────────────────────────────────────
const toArgb = (hex) => "FF" + hex.replace("#", "").toUpperCase();

// ─── GET /api/laporan ─────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  const { pegawai_id, start, end } = req.query;
  if (!pegawai_id || !start || !end)
    return res.status(400).json({ message: "Parameter tidak lengkap" });
  try {
    const [rows] = await db.query(
      `SELECT DATE_FORMAT(tanggal,'%Y-%m-%d') as tanggal,
              jam_masuk, jam_pulang, status, shift_kode,
              status_area, status_area_pulang,
              keterangan, keterangan_pulang
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

// ─── GET /api/laporan/rekap-bulanan ──────────────────────────────────────────
// Query: ?bulan=2026-05
router.get("/rekap-bulanan", async (req, res) => {
  const { bulan } = req.query; // "YYYY-MM"
  if (!bulan)
    return res.status(400).json({ message: "Parameter bulan diperlukan" });

  const [year, month] = bulan.split("-");
  const start = `${year}-${month}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0, 10); // last day

  try {
    const [rows] = await db.query(
      `SELECT
         p.id           AS pegawai_id,
         p.nama,
         p.nik,
         SUM(a.status = 'Hadir')     AS hadir,
         SUM(a.status = 'Terlambat') AS terlambat,
         SUM(a.status = 'Sakit')     AS sakit,
         SUM(a.status = 'Izin')      AS izin,
         SUM(a.status = 'Cuti')      AS cuti,
         SUM(a.status = 'Alpha')     AS alpha,
         COUNT(*)                    AS total
       FROM pegawai p
       LEFT JOIN absensi a
         ON a.pegawai_id = p.id AND a.tanggal BETWEEN ? AND ?
       GROUP BY p.id, p.nama, p.nik
       ORDER BY p.nama ASC`,
      [start, end],
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── GET /api/laporan/rekap-bulanan/download ──────────────────────────────────
// Query: ?bulan=2026-05&format=pdf|excel
router.get("/rekap-bulanan/download", async (req, res) => {
  const { bulan, format = "pdf" } = req.query;
  if (!bulan)
    return res.status(400).json({ message: "Parameter bulan diperlukan" });

  const [year, month] = bulan.split("-");
  const start = `${year}-${month}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0, 10);

  try {
    const [data] = await db.query(
      `SELECT
         p.nama, p.nik,
         SUM(a.status = 'Hadir')     AS hadir,
         SUM(a.status = 'Terlambat') AS terlambat,
         SUM(a.status = 'Sakit')     AS sakit,
         SUM(a.status = 'Izin')      AS izin,
         SUM(a.status = 'Cuti')      AS cuti,
         SUM(a.status = 'Alpha')     AS alpha,
         COUNT(*)                    AS total
       FROM pegawai p
       LEFT JOIN absensi a
         ON a.pegawai_id = p.id AND a.tanggal BETWEEN ? AND ?
       GROUP BY p.id, p.nama, p.nik
       ORDER BY p.nama ASC`,
      [start, end],
    );

    const bulanLabel = new Date(start + "T00:00:00").toLocaleDateString(
      "id-ID",
      {
        month: "long",
        year: "numeric",
      },
    );

    // ════════════════════════════════════════════════════════════════════════
    // FORMAT: EXCEL
    // ════════════════════════════════════════════════════════════════════════
    if (format === "excel") {
      const wb = new ExcelJS.Workbook();
      wb.creator = "E-Absen";
      const ws = wb.addWorksheet(`Rekap ${bulanLabel}`);

      // Lebar kolom
      ws.columns = [
        { key: "no", width: 5 },
        { key: "nama", width: 28 },
        { key: "nik", width: 18 },
        { key: "hadir", width: 10 },
        { key: "terlambat", width: 12 },
        { key: "sakit", width: 10 },
        { key: "izin", width: 10 },
        { key: "cuti", width: 10 },
        { key: "alpha", width: 10 },
        { key: "total", width: 12 },
      ];

      // ── Baris judul (merge A1:J1) ─────────────────────────────────────
      ws.mergeCells("A1:J1");
      const titleCell = ws.getCell("A1");
      titleCell.value = `REKAP ABSENSI — ${bulanLabel.toUpperCase()}`;
      titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1A3C6E" },
      };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      ws.getRow(1).height = 30;

      // ── Sub-judul ──────────────────────────────────────────────────────
      ws.mergeCells("A2:J2");
      const subCell = ws.getCell("A2");
      subCell.value = `Periode: ${formatTanggalIndo(start)} s/d ${formatTanggalIndo(end)}`;
      subCell.font = { size: 10, italic: true };
      subCell.alignment = { horizontal: "center" };
      ws.getRow(2).height = 18;

      ws.addRow([]); // baris kosong

      // ── Header kolom ──────────────────────────────────────────────────
      const HEADERS = [
        "No",
        "Nama Pegawai",
        "NIK",
        "Hadir",
        "Terlambat",
        "Sakit",
        "Izin",
        "Cuti",
        "Alpha",
        "Total",
      ];
      const hdrRow = ws.addRow(HEADERS);
      hdrRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1A3C6E" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });
      ws.getRow(4).height = 22;

      // ── Data rows ─────────────────────────────────────────────────────
      const STATUS_COLORS = {
        hadir: { argb: toArgb("#e8f5e9"), txt: toArgb("#2e7d32") },
        terlambat: { argb: toArgb("#fff3e0"), txt: toArgb("#e65100") },
        sakit: { argb: toArgb("#e1f5fe"), txt: toArgb("#0277bd") },
        izin: { argb: "FFF5F5F5", txt: "FF555555" },
        cuti: { argb: toArgb("#f3e5f5"), txt: toArgb("#6a1b9a") },
        alpha: { argb: toArgb("#ffebee"), txt: toArgb("#c62828") },
      };

      data.forEach((r, i) => {
        const row = ws.addRow([
          i + 1,
          r.nama,
          r.nik,
          Number(r.hadir),
          Number(r.terlambat),
          Number(r.sakit),
          Number(r.izin),
          Number(r.cuti),
          Number(r.alpha),
          Number(r.total),
        ]);
        row.height = 18;

        const bgArgb = i % 2 === 0 ? "FFFFFFFF" : "FFF9F9F9";

        row.eachCell((cell, colNum) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE0E0E0" } },
            bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
            left: { style: "thin", color: { argb: "FFE0E0E0" } },
            right: { style: "thin", color: { argb: "FFE0E0E0" } },
          };

          if (colNum <= 3) {
            // No, Nama, NIK — background zebra biasa
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: bgArgb },
            };
            cell.alignment = {
              vertical: "middle",
              horizontal: colNum === 1 ? "center" : "left",
            };
          } else if (colNum === 10) {
            // Total — bold
            cell.font = { bold: true };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFEEEEEE" },
            };
            cell.alignment = { horizontal: "center", vertical: "middle" };
          } else {
            // Kolom status — warna sesuai
            const keys = [
              "hadir",
              "terlambat",
              "sakit",
              "izin",
              "cuti",
              "alpha",
            ];
            const sc = STATUS_COLORS[keys[colNum - 4]];
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: sc.argb },
            };
            cell.font = { bold: true, color: { argb: sc.txt } };
            cell.alignment = { horizontal: "center", vertical: "middle" };
          }
        });
      });

      // ── Baris total bawah ─────────────────────────────────────────────
      const totalRow = ws.addRow([
        "",
        "TOTAL",
        "",
        data.reduce((s, r) => s + Number(r.hadir), 0),
        data.reduce((s, r) => s + Number(r.terlambat), 0),
        data.reduce((s, r) => s + Number(r.sakit), 0),
        data.reduce((s, r) => s + Number(r.izin), 0),
        data.reduce((s, r) => s + Number(r.cuti), 0),
        data.reduce((s, r) => s + Number(r.alpha), 0),
        data.reduce((s, r) => s + Number(r.total), 0),
      ]);
      totalRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEEEEEE" },
        };
        cell.border = {
          top: { style: "medium", color: { argb: "FF1A3C6E" } },
          bottom: { style: "medium", color: { argb: "FF1A3C6E" } },
          left: { style: "thin", color: { argb: "FFE0E0E0" } },
          right: { style: "thin", color: { argb: "FFE0E0E0" } },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      // ── Footer ────────────────────────────────────────────────────────
      ws.addRow([]);
      const footerRow = ws.addRow([
        "",
        `Dicetak: ${new Date().toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Jakarta",
        })} WIB`,
      ]);
      footerRow.getCell(2).font = {
        italic: true,
        color: { argb: "FF999999" },
        size: 9,
      };
      footerRow.getCell(2).alignment = { horizontal: "right" };
      ws.mergeCells(`B${footerRow.number}:J${footerRow.number}`);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=rekap-absensi-${bulan}.xlsx`,
      );
      await wb.xlsx.write(res);
      res.end();
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // FORMAT: PDF (default)
    // ════════════════════════════════════════════════════════════════════════
    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      layout: "landscape",
    });
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=rekap-absensi-${bulan}.pdf`,
    );
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    const PW = doc.page.width;
    const ML = 40;
    const CW = PW - ML * 2;

    // Header
    doc.rect(ML, 30, CW, 72).fill("#1a3c6e");
    doc
      .fillColor("#ffffff")
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("REKAP ABSENSI BULANAN", ML, 44, { align: "center", width: CW });
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Periode: ${bulanLabel}`, ML, 72, { align: "center", width: CW });

    // Tabel
    const tableTop = 120;
    const ROW_H = 22;
    const colW = {
      no: 28,
      nama: 180,
      nik: 90,
      hadir: 55,
      terlambat: 65,
      sakit: 55,
      izin: 55,
      cuti: 55,
      alpha: 55,
    };
    colW.total = CW - Object.values(colW).reduce((a, b) => a + b, 0);

    const col = {};
    let xc = ML;
    for (const [k, w] of Object.entries(colW)) {
      col[k] = { x: xc, w };
      xc += w;
    }

    const headers = [
      { k: "no", l: "No", align: "center" },
      { k: "nama", l: "Nama", align: "left" },
      { k: "nik", l: "NIK", align: "left" },
      { k: "hadir", l: "Hadir", align: "center" },
      { k: "terlambat", l: "Terlambat", align: "center" },
      { k: "sakit", l: "Sakit", align: "center" },
      { k: "izin", l: "Izin", align: "center" },
      { k: "cuti", l: "Cuti", align: "center" },
      { k: "alpha", l: "Alpha", align: "center" },
      { k: "total", l: "Total", align: "center" },
    ];

    const drawHdr = (y) => {
      doc.rect(ML, y, CW, ROW_H).fill("#1a3c6e");
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8.5);
      headers.forEach(({ k, l, align }) => {
        doc.text(l, col[k].x + 3, y + 7, { width: col[k].w - 6, align });
      });
    };

    drawHdr(tableTop);
    let rowY = tableTop + ROW_H;

    data.forEach((r, i) => {
      if (rowY + ROW_H > doc.page.height - 50) {
        doc.addPage({ size: "A4", layout: "landscape", margin: 40 });
        rowY = 40;
        drawHdr(rowY);
        rowY += ROW_H;
      }
      const bg = i % 2 === 0 ? "#ffffff" : "#f9f9f9";
      doc.rect(ML, rowY, CW, ROW_H).fill(bg).stroke("#e8e8e8");
      const cy = rowY + 7;
      doc.fillColor("#333").font("Helvetica").fontSize(8.5);
      doc.text(String(i + 1), col.no.x + 3, cy, {
        width: col.no.w - 6,
        align: "center",
      });
      doc.text(r.nama, col.nama.x + 3, cy, { width: col.nama.w - 6 });
      doc.text(r.nik || "-", col.nik.x + 3, cy, { width: col.nik.w - 6 });

      const num = (k) => String(Number(r[k]));
      [
        ["hadir", "#2e7d32"],
        ["terlambat", "#e65100"],
        ["sakit", "#0277bd"],
        ["izin", "#555"],
        ["cuti", "#6a1b9a"],
        ["alpha", "#c62828"],
      ].forEach(([k, clr]) => {
        doc
          .fillColor(clr)
          .font("Helvetica-Bold")
          .text(num(k), col[k].x + 3, cy, {
            width: col[k].w - 6,
            align: "center",
          });
      });
      doc
        .fillColor("#333")
        .font("Helvetica-Bold")
        .text(num("total"), col.total.x + 3, cy, {
          width: col.total.w - 6,
          align: "center",
        });

      rowY += ROW_H;
    });

    // Footer
    doc
      .moveTo(ML, rowY)
      .lineTo(ML + CW, rowY)
      .strokeColor("#1a3c6e")
      .lineWidth(1)
      .stroke();
    doc
      .fillColor("#999")
      .font("Helvetica")
      .fontSize(8)
      .text(
        `Dicetak: ${new Date().toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Jakarta",
        })} WIB`,
        ML,
        rowY + 14,
        { align: "right", width: CW },
      );

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal generate laporan" });
  }
});

// ─── GET /api/laporan/download (per-pegawai, PDF) ─────────────────────────────
router.get("/download", async (req, res) => {
  const { pegawai_id, start, end } = req.query;
  if (!pegawai_id || !start || !end)
    return res.status(400).json({ message: "Parameter tidak lengkap" });

  try {
    const [[pegawai]] = await db.query(
      "SELECT nama, nik FROM pegawai WHERE id = ?",
      [pegawai_id],
    );
    const [data] = await db.query(
      `SELECT DATE_FORMAT(a.tanggal,'%Y-%m-%d') as tanggal,
              a.jam_masuk, a.jam_pulang, a.status, a.shift_kode,
              a.status_area, a.status_area_pulang,
              a.keterangan, a.keterangan_pulang
       FROM absensi a
       WHERE a.pegawai_id = ? AND a.tanggal BETWEEN ? AND ?
       ORDER BY a.tanggal ASC`,
      [pegawai_id, start, end],
    );

    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      layout: "landscape",
    });
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=laporan-absensi-${pegawai?.nama || "pegawai"}.pdf`,
    );
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    const PW = doc.page.width;
    const ML = 40;
    const CW = PW - ML * 2;

    // Header
    doc.rect(ML, 30, CW, 72).fill("#1a3c6e");
    doc
      .fillColor("#ffffff")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("LAPORAN ABSENSI", ML, 46, { align: "center", width: CW });
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("E-Absen — Sistem Manajemen Kehadiran", ML, 74, {
        align: "center",
        width: CW,
      });

    // Info pegawai
    const infoY = 115;
    doc.rect(ML, infoY, CW, 78).fill("#f5f7fa").stroke("#e0e0e0");
    doc
      .fillColor("#1a3c6e")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("INFORMASI PEGAWAI", ML + 15, infoY + 12);
    doc
      .moveTo(ML + 15, infoY + 26)
      .lineTo(ML + CW - 15, infoY + 26)
      .strokeColor("#1a3c6e")
      .lineWidth(0.8)
      .stroke();
    doc.font("Helvetica").fillColor("#555555").fontSize(9.5);
    doc.text("Nama", ML + 15, infoY + 34);
    doc.text("NIK", ML + 15, infoY + 49);
    doc.text("Periode", ML + 15, infoY + 64);
    doc.fillColor("#000000").font("Helvetica-Bold");
    doc.text(`: ${pegawai?.nama || "-"}`, ML + 90, infoY + 34);
    doc.text(`: ${pegawai?.nik || "-"}`, ML + 90, infoY + 49);
    doc.text(
      `: ${formatTanggalIndo(start)} s/d ${formatTanggalIndo(end)}`,
      ML + 90,
      infoY + 64,
    );

    // Rekap summary
    const hadir = data.filter((d) => d.status === "Hadir").length;
    const terlambat = data.filter((d) => d.status === "Terlambat").length;
    const sakit = data.filter((d) => d.status === "Sakit").length;
    const izin = data.filter((d) => d.status === "Izin").length;
    const cuti = data.filter((d) => d.status === "Cuti").length;
    const alpha = data.filter((d) => d.status === "Alpha").length;
    const total = data.length;

    const rekY = infoY + 88;
    doc
      .fillColor("#1a3c6e")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("REKAP KEHADIRAN", ML + 15, rekY);
    doc
      .moveTo(ML + 15, rekY + 14)
      .lineTo(ML + CW - 15, rekY + 14)
      .strokeColor("#1a3c6e")
      .lineWidth(0.8)
      .stroke();

    const summaryItems = [
      { label: "Tepat Waktu", value: hadir, color: "#2e7d32" },
      { label: "Terlambat", value: terlambat, color: "#e65100" },
      { label: "Izin", value: izin, color: "#1565c0" },
      { label: "Sakit", value: sakit, color: "#6a1b9a" },
      { label: "Cuti", value: cuti, color: "#00695c" },
      { label: "Alpha", value: alpha, color: "#c62828" },
      { label: "Total", value: total, color: "#333333" },
    ];

    const boxW = 88,
      boxH = 44;
    const gapX = (CW - boxW * summaryItems.length) / (summaryItems.length + 1);
    summaryItems.forEach((item, i) => {
      const x = ML + gapX + i * (boxW + gapX);
      const y = rekY + 20;
      doc.rect(x, y, boxW, boxH).fill("#ffffff").stroke("#e0e0e0");
      doc
        .fillColor(item.color)
        .font("Helvetica-Bold")
        .fontSize(17)
        .text(String(item.value), x, y + 6, { width: boxW, align: "center" });
      doc
        .fillColor("#555555")
        .font("Helvetica")
        .fontSize(8)
        .text(item.label, x, y + 28, { width: boxW, align: "center" });
    });

    // Tabel detail
    const tableTop = rekY + 82;
    const ROW_H = 22;
    // CW landscape A4 (margin 40 kiri-kanan) = 841.89 - 80 ≈ 762
    // Dibagi 9 kolom dengan bobot proporsional, total = 1.00 × CW
    const colWidths = {
      no: Math.round(CW * 0.037), // ~28  — cukup untuk nomor
      tanggal: Math.round(CW * 0.135), // ~103 — "Rab, 6 Mei 2026"
      shift: Math.round(CW * 0.06), // ~46
      masuk: Math.round(CW * 0.082), // ~63
      areaMasuk: Math.round(CW * 0.082), // ~63
      pulang: Math.round(CW * 0.082), // ~63
      areaPulang: Math.round(CW * 0.082), // ~63
      status: Math.round(CW * 0.082), // ~63
      ket: 0, // dihitung dari sisa
    };
    // Pastikan total = CW tepat (anti floating-point gap)
    const usedW = Object.values(colWidths).reduce((a, b) => a + b, 0);
    colWidths.ket = CW - usedW; // sisa ~30% untuk keterangan

    const col = {};
    let xCursor = ML;
    for (const [key, w] of Object.entries(colWidths)) {
      col[key] = { x: xCursor, w };
      xCursor += w;
    }

    const headers = [
      { key: "no", label: "No", align: "center" },
      { key: "tanggal", label: "Tanggal", align: "left" },
      { key: "shift", label: "Shift", align: "center" },
      { key: "masuk", label: "Jam Masuk", align: "center" },
      { key: "areaMasuk", label: "Area Masuk", align: "center" },
      { key: "pulang", label: "Jam Pulang", align: "center" },
      { key: "areaPulang", label: "Area Pulang", align: "center" },
      { key: "status", label: "Status", align: "center" },
      { key: "ket", label: "Keterangan", align: "left" },
    ];

    const drawHeader = (y) => {
      doc.rect(ML, y, CW, ROW_H).fill("#1a3c6e");
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8.5);
      headers.forEach(({ key, label, align }) => {
        doc.text(label, col[key].x + 3, y + 7, {
          width: col[key].w - 6,
          align,
        });
      });
    };

    drawHeader(tableTop);
    let rowY = tableTop + ROW_H;

    if (data.length === 0) {
      doc.rect(ML, rowY, CW, 30).fill("#fafafa").stroke("#e0e0e0");
      doc
        .fillColor("#999999")
        .font("Helvetica")
        .fontSize(9)
        .text("Tidak ada data absensi pada periode ini", ML, rowY + 10, {
          width: CW,
          align: "center",
        });
    } else {
      data.forEach((item, i) => {
        const nonHadir = NON_HADIR.includes(item.status);
        const ketText = nonHadir
          ? item.keterangan || "-"
          : [item.keterangan, item.keterangan_pulang]
              .filter(Boolean)
              .join(" · ") || "-";

        const ketW = col.ket.w - 8;
        const charsPerLine = Math.floor(ketW / 5.2);
        const lines = Math.ceil(ketText.length / charsPerLine);
        const rH = Math.max(ROW_H, lines * 11 + 8);

        if (rowY + rH > doc.page.height - 50) {
          doc.addPage({ size: "A4", layout: "landscape", margin: 40 });
          rowY = 40;
          drawHeader(rowY);
          rowY += ROW_H;
        }

        doc
          .rect(ML, rowY, CW, rH)
          .fill(i % 2 === 0 ? "#ffffff" : "#f9f9f9")
          .stroke("#e8e8e8");
        const cy = rowY + (rH - 10) / 2;

        doc.fillColor("#333333").font("Helvetica").fontSize(8.5);
        doc.text(String(i + 1), col.no.x + 3, cy, {
          width: col.no.w - 6,
          align: "center",
        });
        doc.text(formatTanggalPendek(item.tanggal), col.tanggal.x + 3, cy, {
          width: col.tanggal.w - 6,
        });
        doc.text(nonHadir ? "-" : item.shift_kode || "-", col.shift.x + 3, cy, {
          width: col.shift.w - 6,
          align: "center",
        });
        doc.text(
          nonHadir ? "-" : item.jam_masuk ? item.jam_masuk.slice(0, 5) : "-",
          col.masuk.x + 3,
          cy,
          { width: col.masuk.w - 6, align: "center" },
        );

        const areaMasuk = nonHadir ? "-" : item.status_area || "-";
        doc
          .fillColor(getAreaColor(areaMasuk))
          .text(areaMasuk, col.areaMasuk.x + 3, cy, {
            width: col.areaMasuk.w - 6,
            align: "center",
          });

        doc
          .fillColor("#333333")
          .text(
            nonHadir
              ? "-"
              : item.jam_pulang
                ? item.jam_pulang.slice(0, 5)
                : "-",
            col.pulang.x + 3,
            cy,
            { width: col.pulang.w - 6, align: "center" },
          );

        const areaPulang = nonHadir ? "-" : item.status_area_pulang || "-";
        doc
          .fillColor(getAreaColor(areaPulang))
          .text(areaPulang, col.areaPulang.x + 3, cy, {
            width: col.areaPulang.w - 6,
            align: "center",
          });

        doc
          .fillColor(getStatusColor(item.status))
          .font("Helvetica-Bold")
          .text(item.status, col.status.x + 3, cy, {
            width: col.status.w - 6,
            align: "center",
          });

        doc
          .fillColor("#444444")
          .font("Helvetica")
          .fontSize(7.5)
          .text(ketText, col.ket.x + 4, rowY + 5, {
            width: col.ket.w - 8,
            height: rH - 6,
          });

        rowY += rH;
      });
    }

    doc
      .moveTo(ML, rowY)
      .lineTo(ML + CW, rowY)
      .strokeColor("#1a3c6e")
      .lineWidth(1)
      .stroke();
    doc
      .fillColor("#999999")
      .font("Helvetica")
      .fontSize(8)
      .text(
        `Dicetak pada: ${new Date().toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Jakarta",
        })} WIB`,
        ML,
        rowY + 18,
        { align: "right", width: CW },
      );

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal generate PDF" });
  }
});

export default router;
