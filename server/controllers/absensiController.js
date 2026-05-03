import { db } from "../db.js";

const OFFICE_LAT = 1.1198;
const OFFICE_LNG = 104.1104;
const MAX_RADIUS = 100;

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Konversi TIME string ke menit
function toMenit(timeStr) {
  const [h, m] = timeStr.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

// Deteksi shift berdasarkan jam absen
// Logika: ambil shift yang jam_masuk <= jamAbsen < jam_masuk shift berikutnya
function detectShift(shifts, jamAbsen) {
  const menitNow = toMenit(jamAbsen);

  // Urutkan berdasarkan jam_masuk
  const sorted = [...shifts].sort(
    (a, b) => toMenit(a.jam_masuk) - toMenit(b.jam_masuk),
  );

  let shiftTerpilih = null;

  for (let i = 0; i < sorted.length; i++) {
    const menitMasuk = toMenit(sorted[i].jam_masuk);
    const menitMasukBerikutnya =
      i + 1 < sorted.length
        ? toMenit(sorted[i + 1].jam_masuk)
        : toMenit(sorted[0].jam_masuk) + 1440; // shift pertama + 24jam

    // Handle tengah malam
    if (menitNow >= menitMasuk && menitNow < menitMasukBerikutnya) {
      shiftTerpilih = sorted[i].kode;
      break;
    }
  }

  // Handle shift malam (jam < jam masuk shift pertama)
  if (!shiftTerpilih) {
    const shiftMalam = sorted[sorted.length - 1];
    const menitMalamMasuk = toMenit(shiftMalam.jam_masuk);
    if (
      menitNow >= menitMalamMasuk ||
      menitNow < toMenit(sorted[0].jam_masuk)
    ) {
      shiftTerpilih = shiftMalam.kode;
    }
  }

  return shiftTerpilih;
}

// ================= ABSEN MASUK =================
export const absenMasuk = async (req, res) => {
  try {
    const { pegawai_id, lat, lng, accuracy, tipe, keterangan } = req.body;

    console.log("📥 Data diterima:", req.body);

    if (!pegawai_id) {
      return res.status(400).json({ message: "pegawai_id tidak ditemukan" });
    }

    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Jakarta",
    });
    const now = new Date().toLocaleTimeString("en-GB", {
      hour12: false,
      timeZone: "Asia/Jakarta",
    });

    console.log("🕐 WIB:", now, "| Tanggal:", today);

    // CEK SUDAH ABSEN
    const [cek] = await db.query(
      "SELECT * FROM absensi WHERE pegawai_id = ? AND tanggal = ?",
      [pegawai_id, today],
    );
    if (cek.length > 0) {
      return res.status(400).json({ message: "Sudah absen hari ini" });
    }

    // DETEKSI SHIFT OTOMATIS
    const [shifts] = await db.query(
      "SELECT * FROM shift ORDER BY jam_masuk ASC",
    );
    const shift_kode = detectShift(shifts, now);
    console.log("🔄 Shift terdeteksi:", shift_kode);

    // STATUS — hanya untuk tipe Hadir
    let status = tipe || "Hadir";
    if (tipe === "Hadir" || !tipe) {
      if (shift_kode) {
        const shiftData = shifts.find((s) => s.kode === shift_kode);
        if (shiftData) {
          const menitBatas = toMenit(shiftData.jam_masuk);
          const menitNow = toMenit(now);
          status = menitNow > menitBatas ? "Terlambat" : "Hadir";
        }
      } else {
        status = now.slice(0, 5) > "08:00" ? "Terlambat" : "Hadir";
      }
    }

    // HITUNG JARAK
    let distance = 0;
    let status_area = "DALAM";
    if (lat && lng) {
      distance = Math.round(getDistance(lat, lng, OFFICE_LAT, OFFICE_LNG));
      status_area = distance <= MAX_RADIUS ? "DALAM" : "LUAR";
    }

    // INSERT
    await db.query(
      `INSERT INTO absensi 
      (pegawai_id, tanggal, jam_masuk, status, latitude, longitude, accuracy, distance, status_area, tipe, shift_kode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        tipe || "Hadir",
        keterangan || null,
        shift_kode,
      ],
    );

    console.log("✅ Absen masuk berhasil:", {
      pegawai_id,
      status,
      jam_masuk: now,
      shift_kode,
    });

    res.json({
      message: "Absen masuk berhasil",
      status,
      jam_masuk: now,
      distance,
      dalam_area: status_area === "DALAM",
      shift_kode,
    });
  } catch (err) {
    console.error("❌ Error absen masuk:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= ABSEN PULANG =================
export const absenPulang = async (req, res) => {
  try {
    const { pegawai_id } = req.body;

    if (!pegawai_id) {
      return res.status(400).json({ message: "pegawai_id tidak ditemukan" });
    }

    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Jakarta",
    });
    const now = new Date().toLocaleTimeString("en-GB", {
      hour12: false,
      timeZone: "Asia/Jakarta",
    });

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

    // Cek tipe — Izin/Sakit/Cuti tidak perlu absen pulang
    const tipeAbsen = data[0].tipe;
    if (tipeAbsen === "Izin" || tipeAbsen === "Sakit" || tipeAbsen === "Cuti") {
      return res.status(400).json({
        message: `Absen pulang tidak diperlukan untuk tipe ${tipeAbsen}`,
      });
    }

    await db.query(
      "UPDATE absensi SET jam_pulang = ? WHERE pegawai_id = ? AND tanggal = ?",
      [now, pegawai_id, today],
    );

    console.log("✅ Absen pulang berhasil:", { pegawai_id, jam_pulang: now });

    res.json({
      message: "Absen pulang berhasil",
      jam_pulang: now,
    });
  } catch (err) {
    console.error("❌ Error absen pulang:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
