// ═══════════════════════════════════════════════════════════════
// LAPORAN ROUTES — Generate laporan absensi PDF dan Excel
// ═══════════════════════════════════════════════════════════════
import express from "express";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { db } from "../db.js";
import { getWIBTime, formatWIB } from "../utils/getTime.js";

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

function fmtBulan(ym) {
  return new Date(ym + "-01T00:00:00").toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

async function getHariIni() {
  try {
    const wib = await getWIBTime();
    return formatWIB(wib).today;
  } catch {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  }
}

function getStatusColor(status) {
  const m = {
    Hadir: "#2e7d32",
    Terlambat: "#e65100",
    Izin: "#1565c0",
    Sakit: "#6a1b9a",
    Cuti: "#00695c",
    Alfa: "#c62828",
  };
  return m[status] || "#333333";
}

function getAreaColor(area) {
  if (!area || area === "-") return "#999999";
  return area === "DALAM" ? "#2e7d32" : "#c62828";
}

const STATUS_COLORS = {
  hadir: { argb: "FFe8f5e9", txt: "FF2e7d32" },
  terlambat: { argb: "FFfff3e0", txt: "FFe65100" },
  sakit: { argb: "FFe1f5fe", txt: "FF0277bd" },
  izin: { argb: "FFf5f5f5", txt: "FF555555" },
  cuti: { argb: "FFf3e5f5", txt: "FF6a1b9a" },
  alfa: { argb: "FFffebee", txt: "FFc62828" },
  libur: { argb: "FFf5f5f5", txt: "FF757575" },
  total_kerja: { argb: "FFe3f2fd", txt: "FF0d47a1" },
  total: { argb: "FFe8f0fe", txt: "FF0d47a1" },
};

const NON_HADIR = ["Izin", "Sakit", "Cuti", "Alfa"];

// ─── queryRekap: SATU fungsi dipakai oleh UI dan download ────────────────────
// Alfa = absensi Alfa di tabel + hari kerja di jadwal yang tidak ada absensinya
// Ini konsisten dengan tampilan tab rekap per-pegawai di UI.
async function queryRekap(start, end, hariIni) {
  const endEfektif = end > hariIni ? hariIni : end;

  const [data] = await db.query(
    `
    SELECT
      p.id AS pegawai_id, p.nama, p.nik,

      COALESCE((SELECT COUNT(*) FROM absensi a
        WHERE a.pegawai_id = p.id AND a.tanggal BETWEEN ? AND ?
          AND a.status = 'Hadir'), 0) AS hadir,

      COALESCE((SELECT COUNT(*) FROM absensi a
        WHERE a.pegawai_id = p.id AND a.tanggal BETWEEN ? AND ?
          AND a.status = 'Terlambat'), 0) AS terlambat,

      COALESCE((SELECT COUNT(*) FROM absensi a
        WHERE a.pegawai_id = p.id AND a.tanggal BETWEEN ? AND ?
          AND a.status = 'Sakit'), 0) AS sakit,

      COALESCE((SELECT COUNT(*) FROM absensi a
        WHERE a.pegawai_id = p.id AND a.tanggal BETWEEN ? AND ?
          AND a.status = 'Izin'), 0) AS izin,

      COALESCE((SELECT COUNT(*) FROM absensi a
        WHERE a.pegawai_id = p.id AND a.tanggal BETWEEN ? AND ?
          AND a.status = 'Cuti'), 0) AS cuti,

      -- ✅ Alfa = yang sudah tercatat di absensi + hari kerja yang tidak ada absensinya
      -- Sama persis dengan logika di endpoint UI /rekap-bulanan
      (
        COALESCE((SELECT COUNT(*) FROM absensi a
          WHERE a.pegawai_id = p.id AND a.tanggal BETWEEN ? AND ?
            AND a.status = 'Alfa'), 0)
        +
        COALESCE((SELECT COUNT(DISTINCT DATE(j2.tanggal))
          FROM jadwal_pegawai j2
          WHERE j2.pegawai_id = p.id
            AND DATE(j2.tanggal) BETWEEN ? AND ?
            AND DATE(j2.tanggal) <= ?
            AND j2.shift_kode NOT IN ('L','CT')
            AND NOT EXISTS (
              SELECT 1 FROM absensi a2
              WHERE a2.pegawai_id = p.id AND a2.tanggal = DATE(j2.tanggal)
            )), 0)
      ) AS alfa,

      COALESCE((SELECT COUNT(DISTINCT DATE(j3.tanggal))
        FROM jadwal_pegawai j3
        WHERE j3.pegawai_id = p.id
          AND DATE(j3.tanggal) BETWEEN ? AND ?
          AND DATE(j3.tanggal) <= ?
          AND j3.shift_kode = 'L'), 0) AS libur,

      COALESCE((SELECT COUNT(DISTINCT DATE(j4.tanggal))
        FROM jadwal_pegawai j4
        WHERE j4.pegawai_id = p.id
          AND DATE(j4.tanggal) BETWEEN ? AND ?
          AND DATE(j4.tanggal) <= ?
          AND j4.shift_kode NOT IN ('L','CT')), 0) AS total_hari_kerja,

      COALESCE((SELECT COUNT(DISTINCT DATE(j5.tanggal))
        FROM jadwal_pegawai j5
        WHERE j5.pegawai_id = p.id
          AND DATE(j5.tanggal) BETWEEN ? AND ?
          AND DATE(j5.tanggal) <= ?), 0) AS total_hari

    FROM pegawai p
    ORDER BY p.nama ASC
    `,
    [
      start,
      endEfektif, // hadir
      start,
      endEfektif, // terlambat
      start,
      endEfektif, // sakit
      start,
      endEfektif, // izin
      start,
      endEfektif, // cuti
      start,
      endEfektif, // alfa dari absensi
      start,
      endEfektif,
      hariIni, // alfa dari jadwal tidak absen
      start,
      endEfektif,
      hariIni, // libur
      start,
      endEfektif,
      hariIni, // total_hari_kerja
      start,
      endEfektif,
      hariIni, // total_hari
    ],
  );
  return data;
}

// ─── GET /api/laporan — detail absensi satu pegawai ─────────────────────────
router.get("/", async (req, res) => {
  const { pegawai_id, start, end } = req.query;
  if (!pegawai_id || !start || !end)
    return res.status(400).json({ message: "Parameter tidak lengkap" });
  try {
    const hariIni = await getHariIni();
    const endEfektif = end > hariIni ? hariIni : end;

    const [rows] = await db.query(
      `SELECT
         DATE_FORMAT(j.tanggal, '%Y-%m-%d') AS tanggal,
         j.shift_kode, a.jam_masuk, a.jam_pulang,
         a.status_area, a.status_area_pulang,
         a.keterangan, a.keterangan_pulang,
         CASE
           WHEN a.status IS NOT NULL THEN a.status
           WHEN j.shift_kode = 'L'   THEN 'Libur'
           WHEN j.shift_kode = 'CT'  THEN 'Cuti'
           ELSE 'Alfa'
         END AS status
       FROM jadwal_pegawai j
       LEFT JOIN absensi a
         ON a.pegawai_id = j.pegawai_id AND a.tanggal = DATE(j.tanggal)
       WHERE j.pegawai_id = ? AND DATE(j.tanggal) BETWEEN ? AND ?
       ORDER BY j.tanggal ASC`,
      [pegawai_id, start, endEfektif],
    );

    if (rows.length === 0) {
      const [fallback] = await db.query(
        `SELECT DATE_FORMAT(tanggal,'%Y-%m-%d') as tanggal,
                jam_masuk, jam_pulang, status, shift_kode,
                status_area, status_area_pulang, keterangan, keterangan_pulang
         FROM absensi
         WHERE pegawai_id = ? AND tanggal BETWEEN ? AND ?
         ORDER BY tanggal ASC`,
        [pegawai_id, start, end],
      );
      return res.json(fallback);
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── GET /api/laporan/rekap-bulanan — rekap semua pegawai (UI) ───────────────
router.get("/rekap-bulanan", async (req, res) => {
  const { bulan } = req.query;
  if (!bulan)
    return res.status(400).json({ message: "Parameter bulan diperlukan" });

  const [year, month] = bulan.split("-");
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(year, Number(month), 0).toISOString().slice(0, 10);

  try {
    const hariIni = await getHariIni();
    // ✅ Pakai queryRekap yang sama — UI dan download selalu identik
    const data = await queryRekap(start, end, hariIni);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ─── GET /api/laporan/rekap-bulanan/download — download PDF / Excel ──────────
router.get("/rekap-bulanan/download", async (req, res) => {
  try {
    const { bulan, format } = req.query;
    if (!bulan)
      return res.status(400).json({ message: "Parameter bulan wajib ada" });

    const [y, m] = bulan.split("-").map(Number);
    const start = `${y}-${String(m).padStart(2, "0")}-01`;
    const end = new Date(y, m, 0).toISOString().split("T")[0];

    const hariIni = await getHariIni();
    // ✅ queryRekap yang SAMA dengan endpoint UI — dijamin identik
    const data = await queryRekap(start, end, hariIni);

    const totalHadir = data.reduce((s, r) => s + Number(r.hadir), 0);
    const totalTerlambat = data.reduce((s, r) => s + Number(r.terlambat), 0);
    const totalSakit = data.reduce((s, r) => s + Number(r.sakit), 0);
    const totalIzin = data.reduce((s, r) => s + Number(r.izin), 0);
    const totalCuti = data.reduce((s, r) => s + Number(r.cuti), 0);
    const totalAlfa = data.reduce((s, r) => s + Number(r.alfa), 0);
    const totalLibur = data.reduce((s, r) => s + Number(r.libur), 0);
    const totalHariKerja = data.reduce(
      (s, r) => s + Number(r.total_hari_kerja),
      0,
    );
    const totalHari = data.reduce((s, r) => s + Number(r.total_hari), 0);

    const bulanLabel = fmtBulan(bulan);

    // ════════════════════════════════════════════════════════
    // FORMAT PDF
    // ════════════════════════════════════════════════════════
    if (format === "pdf") {
      const doc = new PDFDocument({
        margin: 40,
        size: "A4",
        layout: "landscape",
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="rekap-absensi-${bulan}.pdf"`,
      );
      doc.pipe(res);

      const ML = 40,
        PW = 752;

      doc.rect(ML, 40, PW, 65).fill([28, 43, 74]);
      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(16)
        .text("REKAP ABSENSI BULANAN", ML, 52, { width: PW, align: "center" });
      doc
        .font("Helvetica")
        .fontSize(11)
        .text(`Periode: ${bulanLabel}`, ML, 76, { width: PW, align: "center" });

      const COLS = [
        "No",
        "Nama",
        "NIK",
        "Hadir",
        "Terlambat",
        "Sakit",
        "Izin",
        "Cuti",
        "Alfa",
        "Libur",
        "Total Hari Kerja",
        "Total Hari",
      ];
      const WIDTHS = [22, 110, 72, 44, 55, 40, 36, 36, 36, 36, 80, "auto"];
      const fixedTotal = WIDTHS.slice(0, -1).reduce((s, w) => s + w, 0);
      WIDTHS[WIDTHS.length - 1] = PW - fixedTotal;

      const HEAD_COLORS = {
        Hadir: [46, 125, 50],
        Terlambat: [230, 81, 0],
        Sakit: [1, 87, 155],
        Izin: [66, 66, 66],
        Cuti: [106, 27, 154],
        Alfa: [183, 28, 28],
        Libur: [100, 100, 100],
        "Total Hari Kerja": [13, 71, 161],
        "Total Hari": [13, 71, 161],
      };

      let ty = 120,
        tx = ML;
      doc.rect(ML, ty, PW, 18).fill([28, 43, 74]);
      COLS.forEach((h, i) => {
        doc
          .fillColor("#ffffff")
          .font("Helvetica-Bold")
          .fontSize(7.5)
          .text(h, tx + 2, ty + 5, {
            width: WIDTHS[i] - 4,
            align: i < 3 ? "left" : "center",
          });
        tx += WIDTHS[i];
      });
      ty += 18;

      data.forEach((r, idx) => {
        const rowBg = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
        doc.rect(ML, ty, PW, 16).fill(rowBg);
        tx = ML;
        const vals = [
          String(idx + 1),
          r.nama,
          r.nik || "-",
          String(Number(r.hadir)),
          String(Number(r.terlambat)),
          String(Number(r.sakit)),
          String(Number(r.izin)),
          String(Number(r.cuti)),
          String(Number(r.alfa)),
          String(Number(r.libur)),
          String(Number(r.total_hari_kerja)),
          String(Number(r.total_hari)),
        ];
        vals.forEach((v, i) => {
          const txtColor = HEAD_COLORS[COLS[i]] || [40, 40, 40];
          doc
            .fillColor(txtColor)
            .font(i >= 3 ? "Helvetica-Bold" : "Helvetica")
            .fontSize(7.5)
            .text(v, tx + 2, ty + 4, {
              width: WIDTHS[i] - 4,
              align: i < 3 ? "left" : "center",
              lineBreak: false,
            });
          tx += WIDTHS[i];
        });
        doc
          .strokeColor([220, 220, 220])
          .lineWidth(0.3)
          .moveTo(ML, ty + 16)
          .lineTo(ML + PW, ty + 16)
          .stroke();
        ty += 16;
      });

      const now = new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
      });
      doc
        .fillColor("#888")
        .font("Helvetica")
        .fontSize(8)
        .text(`Dicetak: ${now} WIB`, ML, ty + 34, {
          align: "right",
          width: PW,
        });

      doc.end();

      // ════════════════════════════════════════════════════════
      // FORMAT EXCEL
      // ════════════════════════════════════════════════════════
    } else if (format === "excel") {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(`Rekap ${bulanLabel}`);

      ws.mergeCells("A1:L1");
      const titleCell = ws.getCell("A1");
      titleCell.value = `REKAP ABSENSI BULANAN — ${bulanLabel.toUpperCase()}`;
      titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1c2b4a" },
      };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      ws.getRow(1).height = 28;

      const headers = [
        "No",
        "Nama Pegawai",
        "NIK",
        "Hadir",
        "Terlambat",
        "Sakit",
        "Izin",
        "Cuti",
        "Alfa",
        "Libur",
        "Total Hari Kerja",
        "Total Hari",
      ];
      ws.addRow(headers).eachCell((cell, ci) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1a3c6e" },
        };
        cell.alignment = {
          horizontal: ci <= 3 ? "left" : "center",
          vertical: "middle",
        };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FF90caf9" } },
        };
      });

      const statusCols = {
        4: "hadir",
        5: "terlambat",
        6: "sakit",
        7: "izin",
        8: "cuti",
        9: "alfa",
        10: "libur",
        11: "total_kerja",
        12: "total",
      };

      data.forEach((r, idx) => {
        const row = ws.addRow([
          idx + 1,
          r.nama,
          r.nik || "-",
          Number(r.hadir),
          Number(r.terlambat),
          Number(r.sakit),
          Number(r.izin),
          Number(r.cuti),
          Number(r.alfa),
          Number(r.libur),
          Number(r.total_hari_kerja),
          Number(r.total_hari),
        ]);
        row.eachCell((cell, ci) => {
          const key = statusCols[ci];
          if (key) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb: STATUS_COLORS[key]?.argb || STATUS_COLORS.total.argb,
              },
            };
            cell.font = {
              bold: true,
              color: {
                argb: STATUS_COLORS[key]?.txt || STATUS_COLORS.total.txt,
              },
            };
          }
          cell.alignment = { horizontal: ci <= 3 ? "left" : "center" };
          cell.border = {
            bottom: { style: "hair", color: { argb: "FFe0e0e0" } },
          };
        });
      });

      ws.columns = [
        { width: 5 },
        { width: 25 },
        { width: 18 },
        { width: 10 },
        { width: 12 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 18 },
        { width: 13 },
      ];

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="rekap-absensi-${bulan}.xlsx"`,
      );
      await wb.xlsx.write(res);
      res.end();
    } else {
      res.status(400).json({
        message: "Format tidak valid. Gunakan ?format=pdf atau ?format=excel",
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/laporan/download — PDF detail satu pegawai ─────────────────────
router.get("/download", async (req, res) => {
  const { pegawai_id, start, end } = req.query;
  if (!pegawai_id || !start || !end)
    return res.status(400).json({ message: "Parameter tidak lengkap" });

  try {
    const hariIni = await getHariIni();

    const [pegawaiRows] = await db.query(
      `SELECT p.* FROM pegawai p WHERE p.id = ?`,
      [pegawai_id],
    );
    if (pegawaiRows.length === 0)
      return res.status(404).json({ message: "Pegawai tidak ditemukan" });
    const pegawai = pegawaiRows[0];

    const [rows] = await db.query(
      `SELECT
         DATE_FORMAT(j.tanggal, '%Y-%m-%d') AS tanggal,
         j.shift_kode, a.jam_masuk, a.jam_pulang,
         a.status_area, a.status_area_pulang, a.keterangan, a.keterangan_pulang,
         CASE
           WHEN a.status IS NOT NULL THEN a.status
           WHEN j.shift_kode = 'L'   THEN 'Libur'
           WHEN j.shift_kode = 'CT'  THEN 'Cuti'
           ELSE 'Alfa'
         END AS status
       FROM jadwal_pegawai j
       LEFT JOIN absensi a
         ON a.pegawai_id = j.pegawai_id AND a.tanggal = DATE(j.tanggal)
       WHERE j.pegawai_id = ?
         AND DATE(j.tanggal) BETWEEN ? AND ?
         AND DATE(j.tanggal) <= ?
       ORDER BY j.tanggal ASC`,
      [pegawai_id, start, end, hariIni],
    );

    let data = rows;
    if (data.length === 0) {
      const [fallback] = await db.query(
        `SELECT DATE_FORMAT(tanggal,'%Y-%m-%d') as tanggal,
                jam_masuk, jam_pulang, status, shift_kode,
                status_area, status_area_pulang, keterangan, keterangan_pulang
         FROM absensi
         WHERE pegawai_id = ? AND tanggal BETWEEN ? AND ? AND tanggal <= ?
         ORDER BY tanggal ASC`,
        [pegawai_id, start, end, hariIni],
      );
      data = fallback;
    }

    const hadir = data.filter((r) => r.status === "Hadir").length;
    const terlambat = data.filter((r) => r.status === "Terlambat").length;
    const sakit = data.filter((r) => r.status === "Sakit").length;
    const izin = data.filter((r) => r.status === "Izin").length;
    const cuti = data.filter((r) => r.status === "Cuti").length;
    const alfa = data.filter((r) => r.status === "Alfa").length;
    const libur = data.filter((r) => r.status === "Libur").length;
    const total_kerja = hadir + terlambat + sakit + izin + cuti + alfa;
    const total = total_kerja + libur;

    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      layout: "landscape",
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="laporan-${pegawai.nama}-${start}-${end}.pdf"`,
    );
    doc.pipe(res);

    const ML = 40,
      PW = 752,
      CW = PW;

    doc.rect(ML, 40, CW, 70).fill([28, 43, 74]);
    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(15)
      .text("LAPORAN ABSENSI PEGAWAI", ML, 52, { width: CW, align: "center" });
    doc
      .font("Helvetica")
      .fontSize(10)
      .text(
        `Periode: ${formatTanggalIndo(start)} s/d ${formatTanggalIndo(end)}`,
        ML,
        74,
        { width: CW, align: "center" },
      );

    const infoY = 125;
    doc.rect(ML, infoY, CW, 58).fill("#f8fafc").stroke("#e0e0e0");
    doc
      .fillColor("#1a3c6e")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("INFORMASI PEGAWAI", ML + 15, infoY + 8);
    doc.fillColor("#333").font("Helvetica").fontSize(9);
    const col1X = ML + 15,
      col2X = ML + CW / 2;
    doc.text(`Nama  : ${pegawai.nama || "-"}`, col1X, infoY + 22);
    doc.text(`NIK   : ${pegawai.nik || "-"}`, col1X, infoY + 34);
    doc.text(`No HP : ${pegawai.no_hp || "-"}`, col2X, infoY + 22);
    doc.text(`Alamat: ${pegawai.alamat || "-"}`, col2X, infoY + 34);

    const rekY = infoY + 72;
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
      { label: "Alfa", value: alfa, color: "#c62828" },
      { label: "Libur", value: libur, color: "#37474f" },
      { label: "Total Kerja", value: total_kerja, color: "#333333" },
      { label: "Total Hari", value: total, color: "#333333" },
    ];

    const boxW = Math.floor((CW - 30) / summaryItems.length) - 4;
    const boxH = 44;
    const startX = ML + 15;
    summaryItems.forEach((item, i) => {
      const x = startX + i * (boxW + 4),
        y = rekY + 20;
      doc.rect(x, y, boxW, boxH).fill("#ffffff").stroke("#e0e0e0");
      doc
        .fillColor(item.color)
        .font("Helvetica-Bold")
        .fontSize(17)
        .text(String(item.value), x, y + 6, { width: boxW, align: "center" });
      doc
        .fillColor("#555555")
        .font("Helvetica")
        .fontSize(7.5)
        .text(item.label, x, y + 28, { width: boxW, align: "center" });
    });

    const tableTop = rekY + 82,
      ROW_H = 22;
    const colWidths = {
      no: Math.round(CW * 0.037),
      tanggal: Math.round(CW * 0.135),
      shift: Math.round(CW * 0.06),
      masuk: Math.round(CW * 0.082),
      areaMasuk: Math.round(CW * 0.082),
      pulang: Math.round(CW * 0.082),
      areaPulang: Math.round(CW * 0.082),
      status: Math.round(CW * 0.082),
      ket: 0,
    };
    const usedW = Object.values(colWidths).reduce((a, b) => a + b, 0);
    colWidths.ket = CW - usedW;

    const col = {};
    let xCursor = ML;
    for (const [key, w] of Object.entries(colWidths)) {
      col[key] = { x: xCursor, w };
      xCursor += w;
    }

    const tblHeaders = [
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
      tblHeaders.forEach(({ key, label, align }) => {
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
        const isLibur = item.status === "Libur";
        const ketText =
          nonHadir || isLibur
            ? item.keterangan || "-"
            : [item.keterangan, item.keterangan_pulang]
                .filter(Boolean)
                .join(" · ") || "-";

        const ketW = col.ket.w - 8;
        const charsPerLine = Math.floor(ketW / 5.2);
        const lines = Math.ceil(ketText.length / Math.max(charsPerLine, 1));
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
        doc.text(
          nonHadir || isLibur ? "-" : item.shift_kode || "-",
          col.shift.x + 3,
          cy,
          { width: col.shift.w - 6, align: "center" },
        );
        doc.text(
          nonHadir || isLibur
            ? "-"
            : item.jam_masuk
              ? item.jam_masuk.slice(0, 5)
              : "-",
          col.masuk.x + 3,
          cy,
          { width: col.masuk.w - 6, align: "center" },
        );

        const areaMasuk = nonHadir || isLibur ? "-" : item.status_area || "-";
        doc
          .fillColor(getAreaColor(areaMasuk))
          .text(areaMasuk, col.areaMasuk.x + 3, cy, {
            width: col.areaMasuk.w - 6,
            align: "center",
          });

        doc
          .fillColor("#333333")
          .text(
            nonHadir || isLibur
              ? "-"
              : item.jam_pulang
                ? item.jam_pulang.slice(0, 5)
                : "-",
            col.pulang.x + 3,
            cy,
            { width: col.pulang.w - 6, align: "center" },
          );

        const areaPulang =
          nonHadir || isLibur ? "-" : item.status_area_pulang || "-";
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
        rowY + 10,
        { align: "right", width: CW },
      );

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent)
      res.status(500).json({ message: "Gagal generate PDF" });
  }
});

export default router;
