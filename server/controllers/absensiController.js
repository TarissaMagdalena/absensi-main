import db from "../db.js";

const OFFICE_LAT = 1.1198;
const OFFICE_LNG = 104.1104;
const MAX_RADIUS = 10000;
const MAX_ACCURACY = 10000; // toleransi untuk WiFi/browser

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

// ================= ABSEN MASUK =================
// ================= ABSEN MASUK =================
export const absenMasuk = async (req, res) => {
  try {
    const { pegawai_id, lat, lng, accuracy, tipe } = req.body;

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toLocaleTimeString("id-ID", { hour12: false });

    // 🔥 CEK SUDAH ABSEN
    const [cek] = await db.query(
      "SELECT * FROM absensi WHERE pegawai_id = ? AND tanggal = ?",
      [pegawai_id, today],
    );

    if (cek.length > 0) {
      return res.status(400).json({ message: "Sudah absen hari ini" });
    }

    // 🔥 STATUS HADIR / TERLAMBAT
    const batas = "08:00:00";
    const status = now > batas ? "Terlambat" : "Hadir";

    // 🔥 HITUNG JARAK (tanpa validasi — untuk testing)
    let distance = 0;
    let status_area = "DALAM";

    if (lat && lng) {
      distance = Math.round(getDistance(lat, lng, OFFICE_LAT, OFFICE_LNG));
      status_area = distance <= MAX_RADIUS ? "DALAM" : "LUAR";
    }

    // 🔥 INSERT
    await db.query(
      `INSERT INTO absensi 
      (pegawai_id, tanggal, jam_masuk, status, latitude, longitude, accuracy, distance, status_area, tipe)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      ],
    );

    res.json({
      message: "Absen masuk berhasil",
      status,
      jam_masuk: now,
      distance,
      dalam_area: status_area === "DALAM",
    });
  } catch (err) {
    console.error("Error absen masuk:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ================= ABSEN PULANG =================
export const absenPulang = async (req, res) => {
  try {
    const { pegawai_id } = req.body;

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toLocaleTimeString("id-ID", { hour12: false });

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

    await db.query(
      "UPDATE absensi SET jam_pulang = ? WHERE pegawai_id = ? AND tanggal = ?",
      [now, pegawai_id, today],
    );

    res.json({
      message: "Absen pulang berhasil",
      jam_pulang: now,
    });
  } catch (err) {
    console.error("Error absen pulang:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
