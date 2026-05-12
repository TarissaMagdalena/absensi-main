import { useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";
import L from "leaflet";

// ── Koordinat & konfigurasi kantor ───────────────────────────────────────────
const OFFICE = {
  lat: 1.1168748359584304,
  lng: 104.09293169994906,
};
const RADIUS_METER = 100; // radius area absensi yang diizinkan (meter)

export default function MapAbsensi({ onLocation }) {
  // Ref untuk mencegah map diinisialisasi lebih dari sekali
  const mapRef = useRef(null);

  // Ref untuk onLocation agar useEffect tidak perlu re-run saat fungsi berubah
  const onLocationRef = useRef(onLocation);
  useEffect(() => {
    onLocationRef.current = onLocation;
  }, [onLocation]);

  useEffect(() => {
    // Jika map sudah diinisialisasi, skip
    if (mapRef.current) return;

    // ── Inisialisasi map dengan titik awal kantor ─────────────────────────
    const map = L.map("map-absensi").setView([OFFICE.lat, OFFICE.lng], 16);

    // ── Tile layer OpenStreetMap ──────────────────────────────────────────
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // ── Marker posisi kantor ──────────────────────────────────────────────
    L.marker([OFFICE.lat, OFFICE.lng]).addTo(map).bindPopup("📍 Lokasi Kantor");

    // ── Lingkaran radius area absensi yang diizinkan ──────────────────────
    L.circle([OFFICE.lat, OFFICE.lng], {
      radius: RADIUS_METER,
      color: "green",
      fillColor: "#4caf50",
      fillOpacity: 0.2,
    }).addTo(map);

    // ── Ambil lokasi pengguna dari browser ────────────────────────────────
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;

        // Marker posisi pengguna saat ini
        L.marker([lat, lng]).addTo(map).bindPopup("🧍 Lokasi Anda").openPopup();

        // Pindahkan tampilan map ke posisi pengguna
        map.setView([lat, lng], 17);

        // Kirim koordinat & akurasi ke komponen induk (Dashboard)
        // Gunakan ref agar selalu memanggil versi terbaru tanpa re-run useEffect
        onLocationRef.current({ lat, lng, accuracy });
      },
      (err) => {
        console.error("Gagal mengambil lokasi:", err);
        alert("Gagal mengambil lokasi. Pastikan izin lokasi diaktifkan.");
      },
      {
        enableHighAccuracy: true, // gunakan GPS presisi tinggi
        timeout: 10000, // batas waktu 10 detik
        maximumAge: 0, // selalu ambil lokasi terbaru
      },
    );

    // Simpan instance map ke ref agar tidak dibuat ulang
    mapRef.current = map;
  }, []); // hanya dijalankan sekali saat komponen mount — onLocation via ref

  return (
    <Box
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        mb: 2,
        border: "1px solid #e0e0e0",
      }}
    >
      {/* Container map Leaflet — id unik agar tidak konflik jika ada map lain */}
      <div id="map-absensi" style={{ height: 200, width: "100%" }} />

      {/* Keterangan warna lingkaran radius */}
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        px={1.5}
        py={0.75}
        sx={{ backgroundColor: "#f9f9f9" }}
      >
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#4caf50",
          }}
        />
        <Typography variant="caption" color="text.secondary">
          Area absensi valid (radius {RADIUS_METER} m dari kantor)
        </Typography>
      </Box>
    </Box>
  );
}
