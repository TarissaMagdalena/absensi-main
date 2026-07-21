// ═══════════════════════════════════════════════════════════════
// MAP ABSENSI — Peta interaktif Leaflet untuk validasi lokasi GPS
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";
import L from "leaflet";

// ── Koordinat & konfigurasi kantor ─────────────────────────────
const OFFICE = {
  lat: 1.1168748359584304,
  lng: 104.09293169994906,
  // lat: 1.1198625933680553,
  // lng: 104.11315981359179,
  // lat: 1.118160414526369,
  // lng: 104.04857401962516,
};
// ── Radius area absensi yang diizinkan ─────────────────────────
const RADIUS_METER = 100;

// ═══════════════════════════════════════════════════════════════
// KOMPONEN MAP ABSENSI
// ═══════════════════════════════════════════════════════════════
export default function MapAbsensi({ onLocation }) {
  // Ref untuk mencegah map diinisialisasi lebih dari sekali
  const mapRef = useRef(null);

  // Ref untuk onLocation agar useEffect tidak perlu re-run saat fungsi berubah
  const onLocationRef = useRef(onLocation);
  useEffect(() => {
    onLocationRef.current = onLocation;
  }, [onLocation]);

  // ── Inisialisasi peta — hanya sekali saat komponen mount ─────
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

        // Kirim koordinat & akurasi ke komponen (Dashboard)
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

    mapRef.current = map;
  }, []);
  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <Box
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        mb: 1,
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
            backgroundColor: "#ff0000",
          }}
        />
        <Typography variant="caption" color="text.secondary">
          Area absensi valid (radius {RADIUS_METER} m dari kantor)
        </Typography>
      </Box>
    </Box>
  );
}
