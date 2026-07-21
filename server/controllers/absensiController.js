// ═══════════════════════════════════════════════════════════════
// ABSENSI CONTROLLER — Logic absen masuk, pulang, dan cek hari ini
// ═══════════════════════════════════════════════════════════════
import { db } from "../db.js";
import { getWIBTime, formatWIB } from "../utils/getTime.js";

// ── Koordinat kantor ─────────────────────────────────────────────────────────────────
const OFFICE_LAT = 1.1168748359584304;
const OFFICE_LNG = 104.09293169994906;
// const OFFICE_LAT = 1.1198625933680553;
// const OFFICE_LNG = 104.11315981359179;
// const OFFICE_LAT = 1.118160414526369;
// const OFFICE_LNG = 104.04857401962516;
const MAX_RADIUS = 100; // meter — radius area absen yang diizinkan
const BATAS_AWAL_MENIT = 120; // menit — berapa lama sebelum shift absen boleh dibuka

// ── Helper: cek apakah error karena waktu eksternal tidak tersedia ────────────
function isWaktuTidakTersedia(err) {
  return err?.message?.startsWith("WAKTU_TIDAK_TERSEDIA");
}

// ── Formula Haversine — hitung jarak dua koordinat GPS (meter) ───────────────
// Digunakan untuk menghitung jarak pegawai dari kantor
// Return: jarak dalam meter
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Helper: konversi "HH:MM:SS" ke total menit ───────────────────────────────
function toMenit(timeStr) {
  const [h, m] = timeStr.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

// ── Keterangan status berdasarkan waktu masuk vs jadwal shift ────────────────
// Return: { status: "Hadir"|"Terlambat", keterangan: string }
// Menangani shift normal DAN shift malam (melewati tengah malam)
function hitungKeteranganMasuk(jamAbsen, jamMasukShift) {
  if (!jamMasukShift) return { status: "Hadir", keterangan: "Hadir" };

  const menitAbsen = toMenit(jamAbsen);
  const menitShift = toMenit(jamMasukShift);
  let selisih = menitAbsen - menitShift;

  // Normalisasi selisih untuk shift lintas tengah malam
  if (selisih > 720) selisih -= 1440;
  if (selisih < -720) selisih += 1440;

  if (selisih < 0) {
    const menit = Math.abs(selisih);
    if (menit >= 60) {
      const jam = Math.floor(menit / 60);
      const sisa = menit % 60;
      return {
        status: "Hadir",
        keterangan:
          sisa > 0
            ? `Datang ${jam} jam ${sisa} menit lebih awal`
            : `Datang ${jam} jam lebih awal`,
      };
    }
    return { status: "Hadir", keterangan: `Datang ${menit} menit lebih awal` };
  }

  if (selisih === 0) return { status: "Hadir", keterangan: "Tepat waktu" };

  if (selisih >= 60) {
    const jam = Math.floor(selisih / 60);
    const sisa = selisih % 60;
    return {
      status: "Terlambat",
      keterangan:
        sisa > 0
          ? `Terlambat ${jam} jam ${sisa} menit`
          : `Terlambat ${jam} jam`,
    };
  }

  return { status: "Terlambat", keterangan: `Terlambat ${selisih} menit` };
}

// ── Helper: keterangan absen pulang ──────────────────────────────────────────
function hitungKeteranganPulang(
  jamPulangAktual,
  jamPulangShift,
  jamMasukShift,
) {
  if (!jamPulangShift) return "Jam pulang tercatat";

  const menitAktual = toMenit(jamPulangAktual);
  const menitShift = toMenit(jamPulangShift);
  const menitMasuk = toMenit(jamMasukShift || "00:00");

  // Normalisasi untuk shift malam (jam pulang < jam masuk)
  const isShiftMalam = menitShift < menitMasuk;
  let menitAktualNorm = menitAktual;
  let menitShiftNorm = menitShift;

  if (isShiftMalam) {
    menitShiftNorm = menitShift + 1440;
    if (menitAktual < menitMasuk) menitAktualNorm = menitAktual + 1440;
  }

  const selisih = menitAktualNorm - menitShiftNorm;

  if (selisih < -30) {
    const menit = Math.abs(selisih);
    if (menit >= 60) {
      const jam = Math.floor(menit / 60);
      const sisa = menit % 60;
      return sisa > 0
        ? `Pulang lebih awal ${jam} jam ${sisa} menit`
        : `Pulang lebih awal ${jam} jam`;
    }
    return `Pulang lebih awal ${menit} menit`;
  }

  if (selisih <= 15) return "Pulang tepat waktu";

  if (selisih >= 60) {
    const jam = Math.floor(selisih / 60);
    const sisa = selisih % 60;
    return sisa > 0 ? `Lembur ${jam} jam ${sisa} menit` : `Lembur ${jam} jam`;
  }

  return `Lembur ${selisih} menit`;
}

// ═════════════════════════════════════════════════════════════════════════════
// ABSEN MASUK
// ═════════════════════════════════════════════════════════════════════════════
export const absenMasuk = async (req, res) => {
  try {
    const { pegawai_id, lat, lng, accuracy } = req.body;

    // ── Validasi akurasi GPS ──────────────────────────────────────────────────
    // Akurasi > 150m = sinyal GPS terlalu buruk → tolak
    // Akurasi < 5m  = terlalu sempurna → tandai mencurigakan (fake GPS?)
    if (accuracy && accuracy > 150) {
      return res.status(400).json({
        message: `Akurasi GPS terlalu rendah (±${Math.round(accuracy)}m). Pindah ke tempat dengan sinyal GPS lebih baik dan coba lagi.`,
      });
    }

    // Tandai suspicious jika akurasi terlalu sempurna (< 5m = kemungkinan fake GPS)
    const isSuspicious = accuracy !== null && accuracy < 5;

    if (!pegawai_id) {
      return res.status(400).json({ message: "pegawai_id tidak ditemukan" });
    }

    //  Ambil waktu dari API eksternal — tidak bisa dimanipulasi user/server
    const realTime = await getWIBTime();
    const { today, now } = formatWIB(realTime);

    console.log("🕐 WIB:", now, "| Tanggal:", today);

    // ── Cek sudah absen hari ini ──────────────────────────────────────────
    const [cek] = await db.query(
      "SELECT * FROM absensi WHERE pegawai_id = ? AND tanggal = ?",
      [pegawai_id, today],
    );
    if (cek.length > 0) {
      return res.status(400).json({ message: "Sudah absen hari ini" });
    }

    // ── Ambil jadwal shift ────────────────────────────────────────────────
    const [jadwalRows] = await db.query(
      `SELECT j.shift_kode, s.jam_masuk, s.jam_pulang, s.nama
       FROM jadwal_pegawai j
       JOIN shift s ON j.shift_kode = s.kode
       WHERE j.pegawai_id = ? AND DATE(j.tanggal) = ?
       LIMIT 1`,
      [pegawai_id, today],
    );

    if (jadwalRows.length === 0) {
      return res.status(400).json({
        message: "Tidak ada jadwal shift hari ini. Hubungi admin.",
      });
    }

    const jadwal = jadwalRows[0];
    const shift_kode = jadwal.shift_kode;
    // ── Validasi shift: L (Libur) dan CT (Cuti) tidak absen ──────
    if (shift_kode === "L") {
      return res.status(400).json({ message: "Hari ini kamu terjadwal libur" });
    }
    if (shift_kode === "CT") {
      return res.status(400).json({
        message: "Kamu sedang cuti hari ini. Absen tidak diperlukan.",
      });
    }

    // ── Validasi tidak boleh absen terlalu awal ───────────────────────────
    const menitNow = toMenit(now);
    const menitMasukShift = toMenit(jadwal.jam_masuk);
    let menitMenunggu = menitMasukShift - menitNow;
    if (menitMenunggu < -720) menitMenunggu += 1440;

    if (menitMenunggu > BATAS_AWAL_MENIT) {
      return res.status(400).json({
        message: `Terlalu awal untuk absen. Shift ${shift_kode} (${jadwal.nama}) mulai jam ${jadwal.jam_masuk.slice(0, 5)} WIB. Absen dibuka ${BATAS_AWAL_MENIT} menit sebelumnya.`,
      });
    }

    // ── Validasi tidak boleh absen setelah jam kerja selesai ─────────────
    if (jadwal.jam_pulang) {
      const menitPulangShift = toMenit(jadwal.jam_pulang);
      const menitMasukShift = toMenit(jadwal.jam_masuk);

      let sudahLewatJamPulang = false;

      // Shift malam, contoh 19:00 - 07:00
      if (menitPulangShift < menitMasukShift) {
        sudahLewatJamPulang =
          menitNow > menitPulangShift && menitNow < menitMasukShift;
      } else {
        // Shift normal, contoh 07:00 - 16:00
        sudahLewatJamPulang = menitNow > menitPulangShift;
      }

      if (sudahLewatJamPulang) {
        return res.status(400).json({
          message:
            "Waktu absensi masuk telah berakhir. Silakan hubungi admin jika terdapat kendala.",
        });
      }
    }

    // ── Hitung status & keterangan ────────────────────────────────────────
    const { status, keterangan } = hitungKeteranganMasuk(now, jadwal.jam_masuk);

    // ── Hitung jarak dari kantor ──────────────────────────────────────────
    let distance = 0;
    let status_area = "DALAM";
    if (lat && lng) {
      distance = Math.round(getDistance(lat, lng, OFFICE_LAT, OFFICE_LNG));
      status_area = distance <= MAX_RADIUS ? "DALAM" : "LUAR";
    }

    // Blokir absen jika di luar area kantor
    if (status_area === "LUAR") {
      return res.status(400).json({
        message: `Kamu berada di luar area kantor (${distance} m). Absensi hanya dapat dilakukan di dalam area kantor BMKG Batam.`,
      });
    }

    // ── Simpan ke database ────────────────────────────────────────────────
    await db.query(
      `INSERT INTO absensi 
   (pegawai_id, tanggal, jam_masuk, status, latitude, longitude, 
    accuracy, distance, status_area, tipe, shift_kode, keterangan, is_suspicious)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pegawai_id,
        today,
        now,
        status,
        lat || null,
        lng || null,
        accuracy || 0,
        distance,
        status_area,
        "Hadir",
        shift_kode,
        keterangan,
        isSuspicious ? 1 : 0, // ← tambah ini
      ],
    );

    res.json({
      message: "Absen masuk berhasil",
      status,
      keterangan,
      jam_masuk: now,
      distance,
      dalam_area: status_area === "DALAM",
      shift_kode,
      is_pengajuan: false,
    });
  } catch (err) {
    // Tangkap error waktu tidak tersedia secara eksplisit
    // Ini terjadi ketika semua sumber waktu eksternal tidak bisa dijangkau
    if (isWaktuTidakTersedia(err)) {
      return res.status(503).json({
        message:
          "Sistem tidak dapat memverifikasi waktu saat ini. " +
          "Pastikan koneksi internet server aktif dan coba lagi.",
      });
    }
    console.error("❌ Error absen masuk:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// ABSEN PULANG
// ═════════════════════════════════════════════════════════════════════════════
export const absenPulang = async (req, res) => {
  try {
    const { pegawai_id, lat, lng, accuracy } = req.body;

    if (!pegawai_id) {
      return res.status(400).json({ message: "pegawai_id tidak ditemukan" });
    }
    if (!lat || !lng) {
      return res.status(400).json({ message: "Lokasi belum siap" });
    }

    //  Waktu dari sumber eksternal — tidak bisa dimanipulasi
    const realTime = await getWIBTime();
    const { today, now } = formatWIB(realTime);

    // ── Cek data absensi hari ini ─────────────────────────────────────────
    const [data] = await db.query(
      "SELECT * FROM absensi WHERE pegawai_id = ? AND tanggal = ?",
      [pegawai_id, today],
    );

    if (data.length === 0) {
      return res.status(400).json({ message: "Belum absen masuk" });
    }
    if (data[0].jam_pulang) {
      return res.status(400).json({ message: "Sudah absen pulang" });
    }
    if (["Izin", "Sakit", "Cuti"].includes(data[0].tipe)) {
      return res.status(400).json({
        message: `Absen pulang tidak diperlukan untuk tipe ${data[0].tipe}`,
      });
    }

    // ── Hitung jarak pulang ───────────────────────────────────────────────
    const distance_pulang = Math.round(
      getDistance(lat, lng, OFFICE_LAT, OFFICE_LNG),
    );
    const status_area_pulang = distance_pulang <= MAX_RADIUS ? "DALAM" : "LUAR";

    // Blokir absen pulang jika di luar area kantor
    if (status_area_pulang === "LUAR") {
      return res.status(400).json({
        message: `Kamu berada di luar area kantor (${distance_pulang} m). Absensi pulang hanya dapat dilakukan di dalam area kantor BMKG Batam.`,
      });
    }

    // ── Hitung keterangan pulang (lembur/tepat waktu/lebih awal) ─────────
    let keterangan_pulang = "Jam pulang tercatat";
    try {
      const [jadwalRows] = await db.query(
        `SELECT j.shift_kode, s.jam_masuk, s.jam_pulang
         FROM jadwal_pegawai j
         JOIN shift s ON j.shift_kode = s.kode
         WHERE j.pegawai_id = ? AND DATE(j.tanggal) = ? LIMIT 1`,
        [pegawai_id, today],
      );
      if (jadwalRows.length > 0 && jadwalRows[0].jam_pulang) {
        keterangan_pulang = hitungKeteranganPulang(
          now,
          jadwalRows[0].jam_pulang,
          jadwalRows[0].jam_masuk,
        );
      }
    } catch (err) {
      console.warn(
        "Gagal ambil jadwal shift untuk keterangan pulang:",
        err.message,
      );
    }

    // ── Simpan ke database ────────────────────────────────────────────────
    await db.query(
      `UPDATE absensi 
       SET jam_pulang = ?, keterangan_pulang = ?, status_area_pulang = ?
       WHERE pegawai_id = ? AND tanggal = ?`,
      [now, keterangan_pulang, status_area_pulang, pegawai_id, today],
    );

    res.json({
      message: "Absen pulang berhasil",
      jam_pulang: now,
      keterangan_pulang,
      status_area: status_area_pulang,
    });
  } catch (err) {
    // Tangkap error waktu tidak tersedia
    if (isWaktuTidakTersedia(err)) {
      return res.status(503).json({
        message:
          "Sistem tidak dapat memverifikasi waktu saat ini. " +
          "Pastikan koneksi internet server aktif dan coba lagi.",
      });
    }
    console.error("❌ Error absen pulang:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET TODAY ABSENSI
// ═════════════════════════════════════════════════════════════════════════════
export const getTodayAbsensi = async (req, res) => {
  try {
    // Waktu dari sumber eksternal
    const realTime = await getWIBTime();
    const { today } = formatWIB(realTime);

    // Ambil pegawai yang punya jadwal hari ini (kecuali libur & cuti)
    const [jadwal] = await db.query(
      `SELECT p.id, p.nama, s.jam_masuk, s.jam_pulang
       FROM jadwal_pegawai j
       JOIN pegawai p ON j.pegawai_id = p.id
       JOIN shift s   ON j.shift_kode = s.kode
       WHERE DATE(j.tanggal) = ? AND j.shift_kode NOT IN ('L', 'CT')`,
      [today],
    );

    // Ambil data absensi hari ini
    const [absensi] = await db.query(
      "SELECT * FROM absensi WHERE tanggal = ?",
      [today],
    );

    // Gabungkan jadwal + status absensi
    const result = jadwal.map((p) => {
      const absen = absensi.find((a) => a.pegawai_id === p.id);
      return {
        ...p,
        status: absen?.status ?? "Alfa",
        tipe: absen?.tipe ?? "Alfa",
        jam_masuk: absen?.jam_masuk ?? null,
        jam_pulang: absen?.jam_pulang ?? null,
      };
    });

    res.json(result);
  } catch (err) {
    // getTodayAbsensi dipanggil dari dashboard — jika waktu tidak tersedia,
    // kembalikan array kosong agar dashboard tetap bisa tampil
    if (isWaktuTidakTersedia(err)) {
      console.warn(
        "[getTodayAbsensi] Waktu tidak tersedia, kembalikan array kosong",
      );
      return res.json([]);
    }
    console.error("❌ Error getTodayAbsensi:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
