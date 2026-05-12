import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../db.js";

const router = express.Router();

function isValidBulan(bulan) {
  return /^\d{4}-\d{2}$/.test(bulan);
}

// ── Multer setup surat cuti ───────────────────────────────────────────────────
const uploadDir = "uploads/surat_cuti";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Format file tidak didukung"));
};

const uploadSuratCuti = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

// ================= GET SEMUA SHIFT =================
router.get("/shift", async (req, res) => {
  try {
    const [data] = await db.query("SELECT * FROM shift ORDER BY id ASC");
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= GET JADWAL PEGAWAI HARI INI =================
router.get("/pegawai/:pegawai_id", async (req, res) => {
  try {
    const { pegawai_id } = req.params;
    const { tanggal } = req.query;
    if (!tanggal)
      return res.status(400).json({ message: "Parameter tanggal diperlukan" });

    const [rows] = await db.query(
      `SELECT j.shift_kode, j.keterangan, s.nama, s.jam_masuk, s.jam_pulang
       FROM jadwal_pegawai j
       LEFT JOIN shift s ON j.shift_kode = s.kode
       WHERE j.pegawai_id = ? AND DATE(j.tanggal) = ?
       LIMIT 1`,
      [pegawai_id, tanggal],
    );

    if (rows.length === 0) return res.json(null);
    return res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= GET JADWAL BULAN TERTENTU =================
router.get("/", async (req, res) => {
  const { bulan } = req.query;
  if (!bulan)
    return res.status(400).json({ message: "Parameter bulan wajib diisi" });
  if (!isValidBulan(bulan))
    return res.status(400).json({ message: "Format bulan tidak valid" });

  try {
    const [data] = await db.query(
      `SELECT 
        j.id, j.pegawai_id, p.nama,
        DATE_FORMAT(j.tanggal, '%Y-%m-%d') as tanggal,
        j.shift_kode, j.keterangan,
        s.nama as shift_nama, s.jam_masuk, s.jam_pulang
       FROM jadwal_pegawai j
       JOIN pegawai p ON j.pegawai_id = p.id
       LEFT JOIN shift s ON j.shift_kode = s.kode
       WHERE DATE_FORMAT(j.tanggal, '%Y-%m') = ?
       ORDER BY j.tanggal ASC, p.nama ASC`,
      [bulan],
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= GET JATAH CUTI =================
router.get("/jatah-cuti", async (req, res) => {
  try {
    const tahun = req.query.tahun || new Date().getFullYear();
    const [data] = await db.query(
      `SELECT 
        p.id as pegawai_id, p.nama,
        COALESCE(jc.jatah, 12) as jatah,
        COALESCE(jc.terpakai, 0) as terpakai
       FROM pegawai p
       LEFT JOIN jatah_cuti jc ON p.id = jc.pegawai_id AND jc.tahun = ?
       ORDER BY p.nama ASC`,
      [tahun],
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= UPDATE JATAH CUTI =================
router.post("/jatah-cuti", async (req, res) => {
  try {
    const { tahun, jatahList } = req.body;
    for (const item of jatahList) {
      await db.query(
        `INSERT INTO jatah_cuti (pegawai_id, tahun, jatah, terpakai)
         VALUES (?, ?, ?, 0)
         ON DUPLICATE KEY UPDATE jatah = ?`,
        [item.pegawai_id, tahun, item.jatah, item.jatah],
      );
    }
    res.json({ message: "Jatah cuti berhasil disimpan" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= SIMPAN JADWAL BULK =================
router.post("/bulk", uploadSuratCuti.any(), async (req, res) => {
  let bulan, jadwal;
  try {
    bulan = req.body.bulan;
    jadwal = JSON.parse(req.body.jadwal);
  } catch {
    return res.status(400).json({ message: "Format data tidak valid" });
  }

  if (!bulan || !jadwal || !Array.isArray(jadwal) || jadwal.length === 0) {
    return res.status(400).json({ message: "Data tidak lengkap" });
  }

  const suratMap = {};
  (req.files || []).forEach((file) => {
    const key = file.fieldname.replace("surat_cuti__", "");
    suratMap[key] = file.filename;
  });

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    const tanggalList = [...new Set(jadwal.map((j) => j.tanggal))];
    const pegawaiIdList = [...new Set(jadwal.map((j) => j.pegawai_id))];

    const [ctLama] = await conn.query(
      `SELECT pegawai_id, DATE_FORMAT(tanggal, '%Y-%m-%d') as tanggal
       FROM jadwal_pegawai
       WHERE pegawai_id IN (?) AND tanggal IN (?) AND shift_kode = 'CT'`,
      [pegawaiIdList, tanggalList],
    );
    const setCtLama = new Set(
      ctLama.map((r) => `${r.pegawai_id}|${r.tanggal}`),
    );

    for (const j of jadwal) {
      if (j.shift_kode) {
        await conn.query(
          `INSERT INTO jadwal_pegawai (pegawai_id, tanggal, shift_kode, keterangan)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             shift_kode = VALUES(shift_kode),
             keterangan = VALUES(keterangan)`,
          [j.pegawai_id, j.tanggal, j.shift_kode, j.keterangan || null],
        );
      } else {
        await conn.query(
          `DELETE FROM jadwal_pegawai WHERE pegawai_id = ? AND tanggal = ?`,
          [j.pegawai_id, j.tanggal],
        );
      }
    }

    const setCtBaru = new Set(
      jadwal
        .filter((j) => j.shift_kode === "CT")
        .map((j) => `${j.pegawai_id}|${j.tanggal}`),
    );
    const ctDitambah = [...setCtBaru].filter((k) => !setCtLama.has(k));
    const ctDicabut = [...setCtLama].filter(
      (k) =>
        !setCtBaru.has(k) &&
        jadwal.some((j) => `${j.pegawai_id}|${j.tanggal}` === k),
    );

    for (const key of ctDitambah) {
      const [pegawaiId, tanggal] = key.split("|");
      const ketCT =
        jadwal.find((j) => `${j.pegawai_id}|${j.tanggal}` === key)
          ?.keterangan || "Dijadwalkan cuti oleh admin";
      const suratCuti = suratMap[key] || null;

      const [existing] = await conn.query(
        `SELECT id FROM absensi WHERE pegawai_id = ? AND tanggal = ? LIMIT 1`,
        [pegawaiId, tanggal],
      );

      if (existing.length === 0) {
        await conn.query(
          `INSERT INTO absensi (pegawai_id, tanggal, status, keterangan, surat_cuti, is_from_jadwal) 
           VALUES (?, ?, 'Cuti', ?, ?, 1)`,
          [pegawaiId, tanggal, ketCT, suratCuti],
        );
      } else {
        if (suratCuti) {
          const [[lama]] = await conn.query(
            "SELECT surat_cuti FROM absensi WHERE id = ?",
            [existing[0].id],
          );
          if (lama?.surat_cuti) {
            const oldPath = `uploads/surat_cuti/${lama.surat_cuti}`;
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
        }
        await conn.query(
          `UPDATE absensi 
           SET status = 'Cuti', keterangan = ?, is_from_jadwal = 1
             ${suratCuti ? ", surat_cuti = ?" : ""}
           WHERE pegawai_id = ? AND tanggal = ?`,
          suratCuti
            ? [ketCT, suratCuti, pegawaiId, tanggal]
            : [ketCT, pegawaiId, tanggal],
        );
      }

      const tahun = tanggal.substring(0, 4);
      const [upd] = await conn.query(
        `UPDATE jatah_cuti SET terpakai = terpakai + 1 WHERE pegawai_id = ? AND tahun = ?`,
        [pegawaiId, tahun],
      );
      if (upd.affectedRows === 0) {
        await conn.query(
          `INSERT INTO jatah_cuti (pegawai_id, tahun, jatah, terpakai) VALUES (?, ?, 12, 1)`,
          [pegawaiId, tahun],
        );
      }
    }

    for (const key of ctDicabut) {
      const [pegawaiId, tanggal] = key.split("|");
      const [[lama]] = await conn.query(
        "SELECT surat_cuti FROM absensi WHERE pegawai_id = ? AND tanggal = ? AND status = 'Cuti'",
        [pegawaiId, tanggal],
      );
      if (lama?.surat_cuti) {
        const p = `uploads/surat_cuti/${lama.surat_cuti}`;
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
      await conn.query(
        `DELETE FROM absensi WHERE pegawai_id = ? AND tanggal = ? AND status = 'Cuti'`,
        [pegawaiId, tanggal],
      );
      const tahun = tanggal.substring(0, 4);
      await conn.query(
        `UPDATE jatah_cuti SET terpakai = GREATEST(0, terpakai - 1) WHERE pegawai_id = ? AND tahun = ?`,
        [pegawaiId, tahun],
      );
    }

    await conn.commit();
    res.json({
      message: "Jadwal berhasil disimpan",
      total: jadwal.length,
      cuti_ditambah: ctDitambah.length,
      cuti_dicabut: ctDicabut.length,
    });
  } catch (err) {
    await conn.rollback();
    (req.files || []).forEach((f) => {
      if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
    });
    console.error("Bulk save error:", err);
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

// ================= SALIN JADWAL BULAN LALU =================
router.post("/salin", async (req, res) => {
  const { dari, ke } = req.body;

  if (!dari || !ke)
    return res
      .status(400)
      .json({ message: "Parameter dari dan ke wajib diisi" });
  if (!isValidBulan(dari) || !isValidBulan(ke))
    return res.status(400).json({ message: "Format bulan tidak valid" });
  if (dari === ke)
    return res
      .status(400)
      .json({ message: "Bulan sumber dan tujuan tidak boleh sama" });

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    const [sumber] = await conn.query(
      `SELECT pegawai_id, DATE_FORMAT(tanggal, '%Y-%m-%d') as tanggal, shift_kode, keterangan
       FROM jadwal_pegawai WHERE DATE_FORMAT(tanggal, '%Y-%m') = ?`,
      [dari],
    );

    if (sumber.length === 0) {
      await conn.rollback();
      conn.release();
      return res
        .status(404)
        .json({ message: "Tidak ada jadwal di bulan sumber" });
    }

    const [tahunDari, bulanDari] = dari.split("-").map(Number);
    const [tahunKe, bulanKe] = ke.split("-").map(Number);

    await conn.query(
      `DELETE FROM jadwal_pegawai WHERE DATE_FORMAT(tanggal, '%Y-%m') = ?`,
      [ke],
    );

    const values = sumber.map((j) => {
      const [tTahun, tBulan, tHari] = j.tanggal.split("-").map(Number);
      let bulanBaru =
        tBulan - 1 + (bulanKe - bulanDari) + (tahunKe - tahunDari) * 12;
      let tahunBaru = tTahun + Math.floor(bulanBaru / 12);
      bulanBaru = ((bulanBaru % 12) + 12) % 12;
      const maxHari = new Date(tahunBaru, bulanBaru + 1, 0).getDate();
      const hariBaru = Math.min(tHari, maxHari);
      const tglBaru = `${tahunBaru}-${String(bulanBaru + 1).padStart(2, "0")}-${String(hariBaru).padStart(2, "0")}`;
      return [j.pegawai_id, tglBaru, j.shift_kode, j.keterangan || null];
    });

    await conn.query(
      `INSERT INTO jadwal_pegawai (pegawai_id, tanggal, shift_kode, keterangan) VALUES ?`,
      [values],
    );

    await conn.commit();
    res.json({
      message: `Jadwal dari ${dari} berhasil disalin ke ${ke}`,
      total: values.length,
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

// ================= DOWNLOAD PDF JADWAL =================
router.get("/download-pdf", async (req, res) => {
  const { bulan } = req.query;

  if (!bulan || !isValidBulan(bulan)) {
    return res.status(400).json({ message: "Parameter bulan tidak valid" });
  }

  try {
    // ── Ambil data ────────────────────────────────────────────────────────────
    const [pegawaiList] = await db.query(
      "SELECT id, nama FROM pegawai ORDER BY nama ASC",
    );
    const [jadwal] = await db.query(
      `SELECT 
        j.pegawai_id,
        DATE_FORMAT(j.tanggal, '%Y-%m-%d') as tanggal,
        j.shift_kode
       FROM jadwal_pegawai j
       WHERE DATE_FORMAT(j.tanggal, '%Y-%m') = ?
       ORDER BY j.tanggal ASC`,
      [bulan],
    );
    const [shiftData] = await db.query(
      "SELECT kode, nama, jam_masuk, jam_pulang FROM shift ORDER BY id ASC",
    );

    // Buat grid { pegawai_id: { tanggal: shift_kode } }
    const grid = {};
    jadwal.forEach((j) => {
      if (!grid[j.pegawai_id]) grid[j.pegawai_id] = {};
      grid[j.pegawai_id][j.tanggal] = j.shift_kode;
    });

    // ── Konstanta ─────────────────────────────────────────────────────────────
    const [tahun, bln] = bulan.split("-").map(Number);
    const jumlahHari = new Date(tahun, bln, 0).getDate();

    const NAMA_BULAN = [
      "",
      "JANUARI",
      "FEBRUARI",
      "MARET",
      "APRIL",
      "MEI",
      "JUNI",
      "JULI",
      "AGUSTUS",
      "SEPTEMBER",
      "OKTOBER",
      "NOVEMBER",
      "DESEMBER",
    ];
    const NAMA_HARI = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];

    const tanggalList = Array.from({ length: jumlahHari }, (_, i) => {
      const d = i + 1;
      const tgl = `${tahun}-${String(bln).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const hari = new Date(tahun, bln - 1, d).getDay();
      return { d, tgl, hari };
    });

    // Warna background shift (RGB)
    const SHIFT_BG = {
      P: [227, 242, 253],
      PK: [232, 245, 233],
      MR: [237, 231, 246],
      MK: [252, 228, 236],
      PR: [224, 247, 250],
      CT: [255, 248, 225],
      L: [245, 245, 245],
    };

    // Warna teks shift
    const SHIFT_COLOR = {
      P: [21, 101, 192],
      PK: [46, 125, 50],
      MR: [69, 39, 160],
      MK: [136, 14, 79],
      PR: [0, 105, 92],
      CT: [245, 127, 23],
      L: [117, 117, 117],
    };

    // Warna border tegas per sel (lebih gelap dari sebelumnya)
    const BORDER_COLOR = [80, 80, 80];
    const BORDER_HEADER = [20, 20, 20];

    // ── Init PDF ──────────────────────────────────────────────────────────────
    const PDFDocument = (await import("pdfkit")).default;
    const doc = new PDFDocument({
      margin: 20,
      size: "A3",
      layout: "landscape",
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=jadwal-${bulan}.pdf`,
    );
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // ── Layout ────────────────────────────────────────────────────────────────
    const pageWidth = doc.page.width - 40;
    const noWidth = 24;
    const namaWidth = 110;
    const fixedWidth = noWidth + namaWidth;
    const sisaWidth = pageWidth - fixedWidth;
    const hariWidth = Math.floor(sisaWidth / jumlahHari);
    const rowHeight = 22;
    const headerH1 = 16;
    const headerH2 = 14;
    const totalHeaderH = headerH1 + headerH2;
    const startX = 20;
    const tanggalStartX = startX + fixedWidth;
    const tanggalTotalW = hariWidth * jumlahHari;
    let y = 20;

    // Helper: gambar sel dengan border tegas
    function drawCell(x, cy, w, h, bgColor, borderColor) {
      doc.rect(x, cy, w, h).fillColor(bgColor).fill();
      doc.rect(x, cy, w, h).strokeColor(borderColor).lineWidth(0.5).stroke();
    }

    // ── JUDUL ─────────────────────────────────────────────────────────────────
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#1c2b4a")
      .text(`BULAN - ${NAMA_BULAN[bln]} ${tahun}`, startX, y, {
        width: pageWidth,
        align: "center",
      });
    y += 24;

    // ── HEADER BARIS 1: NO | NAMA | TANGGAL ──────────────────────────────────
    // Sel NO (span 2 baris)
    drawCell(startX, y, noWidth, totalHeaderH, [28, 43, 74], BORDER_HEADER);
    doc
      .font("Helvetica-Bold")
      .fontSize(7)
      .fillColor("white")
      .text("NO", startX, y + totalHeaderH / 2 - 4, {
        width: noWidth,
        align: "center",
      });

    // Sel NAMA (span 2 baris)
    drawCell(
      startX + noWidth,
      y,
      namaWidth,
      totalHeaderH,
      [28, 43, 74],
      BORDER_HEADER,
    );
    doc
      .font("Helvetica-Bold")
      .fontSize(7)
      .fillColor("white")
      .text("NAMA", startX + noWidth, y + totalHeaderH / 2 - 4, {
        width: namaWidth,
        align: "center",
      });

    // Sel TANGGAL label (baris atas, gabung semua kolom hari)
    drawCell(
      tanggalStartX,
      y,
      tanggalTotalW,
      headerH1,
      [28, 43, 74],
      BORDER_HEADER,
    );
    doc
      .font("Helvetica-Bold")
      .fontSize(7)
      .fillColor("white")
      .text("TANGGAL", tanggalStartX, y + 5, {
        width: tanggalTotalW,
        align: "center",
      });

    // Baris angka + nama hari
    tanggalList.forEach(({ d, hari }) => {
      const cx = tanggalStartX + (d - 1) * hariWidth;
      const isMinggu = hari === 0;
      const isSabtu = hari === 6;
      const bg = isMinggu
        ? [183, 28, 28]
        : isSabtu
          ? [21, 101, 192]
          : [28, 43, 74];
      const halfH = headerH2 / 2;

      // Angka tanggal
      drawCell(cx, y + headerH1, hariWidth, halfH, bg, BORDER_HEADER);
      doc
        .font("Helvetica-Bold")
        .fontSize(6)
        .fillColor("white")
        .text(String(d), cx, y + headerH1 + 1, {
          width: hariWidth,
          align: "center",
        });

      // Nama hari
      drawCell(cx, y + headerH1 + halfH, hariWidth, halfH, bg, BORDER_HEADER);
      doc
        .font("Helvetica")
        .fontSize(5)
        .fillColor("white")
        .text(NAMA_HARI[hari], cx, y + headerH1 + halfH + 2, {
          width: hariWidth,
          align: "center",
        });
    });

    y += totalHeaderH;

    // ── BARIS DATA PEGAWAI ────────────────────────────────────────────────────
    pegawaiList.forEach((p, pi) => {
      const rowBg = pi % 2 === 0 ? [255, 255, 255] : [248, 250, 252];

      // Kolom NO
      drawCell(startX, y, noWidth, rowHeight, rowBg, BORDER_COLOR);
      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor("#333333")
        .text(String(pi + 1), startX, y + 7, {
          width: noWidth,
          align: "center",
        });

      // Kolom NAMA
      drawCell(startX + noWidth, y, namaWidth, rowHeight, rowBg, BORDER_COLOR);
      doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor("#1c2b4a")
        .text(p.nama.toUpperCase(), startX + noWidth + 3, y + 7, {
          width: namaWidth - 6,
          align: "left",
          lineBreak: false,
        });

      // Kolom shift per hari
      tanggalList.forEach(({ d, tgl, hari }) => {
        const cx = tanggalStartX + (d - 1) * hariWidth;
        const kode = grid[p.id]?.[tgl] || "";
        const bg = kode
          ? SHIFT_BG[kode] || (hari === 0 ? [255, 248, 248] : rowBg)
          : hari === 0
            ? [255, 248, 248]
            : rowBg;

        drawCell(cx, y, hariWidth, rowHeight, bg, BORDER_COLOR);

        if (kode) {
          const txtColor = SHIFT_COLOR[kode] || [51, 51, 51];
          doc
            .font("Helvetica-Bold")
            .fontSize(6)
            .fillColor(txtColor)
            .text(kode, cx, y + 8, { width: hariWidth, align: "center" });
        }
      });

      y += rowHeight;
    });

    // ── KETERANGAN — vertikal ke bawah ────────────────────────────────────────
    y += 16;
    doc
      .font("Helvetica-Bold")
      .fontSize(7)
      .fillColor("#333333")
      .text("KETERANGAN:", startX, y);
    y += 12;

    const boxW = 12;
    const boxH = 9;
    const rowGap = 13; // jarak antar baris legend

    // Gabungkan shiftData + L jika belum ada
    const legendItems = [...shiftData];
    if (!legendItems.find((s) => s.kode === "L")) {
      legendItems.push({
        kode: "L",
        nama: "Libur",
        jam_masuk: null,
        jam_pulang: null,
      });
    }

    // ✅ Tampilkan satu per baris (vertikal ke bawah)
    legendItems.forEach((s) => {
      const bg = SHIFT_BG[s.kode] || [255, 255, 255];
      const jm = s.jam_masuk ? s.jam_masuk.slice(0, 5) : "";
      const jp = s.jam_pulang ? s.jam_pulang.slice(0, 5) : "";
      const jamTeks = jm && jp ? `  (${jm} - ${jp} WIB)` : "";
      const label = `${s.kode} = ${s.nama.toUpperCase()}${jamTeks}`;

      // Kotak warna dengan border tipis
      doc.rect(startX, y, boxW, boxH).fillColor(bg).fill();
      doc
        .rect(startX, y, boxW, boxH)
        .strokeColor([160, 160, 160])
        .lineWidth(0.4)
        .stroke();

      // Teks keterangan — font 6.5pt
      doc
        .font("Helvetica")
        .fontSize(6.5)
        .fillColor("#333333")
        .text(label, startX + boxW + 4, y + 1, { lineBreak: false });

      y += rowGap;
    });

    doc.end();
  } catch (err) {
    console.error("Download PDF jadwal error:", err);
    res.status(500).json({ message: err.message });
  }
});
// UPDATE JAM SHIFT
router.put("/shift/:kode", async (req, res) => {
  try {
    const { kode } = req.params;
    const { nama, jam_masuk, jam_pulang } = req.body;

    await db.query(
      "UPDATE shift SET nama = ?, jam_masuk = ?, jam_pulang = ? WHERE kode = ?",
      [nama, jam_masuk || null, jam_pulang || null, kode],
    );

    res.json({ message: "Shift berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
