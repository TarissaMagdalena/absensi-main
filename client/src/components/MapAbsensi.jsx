import { useEffect, useRef } from "react";
import L from "leaflet";

export default function MapAbsensi({ onLocation }) {
  const mapRef = useRef(null);

  const OFFICE = {
    lat: 1.1198,
    lng: 104.1104,
  };

  useEffect(() => {
    if (mapRef.current) return;

    // 🔥 INIT MAP
    const map = L.map("map").setView([OFFICE.lat, OFFICE.lng], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    // 🔥 MARKER KANTOR
    L.marker([OFFICE.lat, OFFICE.lng])
      .addTo(map)
      .bindPopup("Lokasi Kantor")
      .openPopup();

    // 🔥 RADIUS AREA
    L.circle([OFFICE.lat, OFFICE.lng], {
      radius: 100,
      color: "green",
      fillColor: "#4caf50",
      fillOpacity: 0.2,
    }).addTo(map);

    // 🔥 AMBIL LOKASI USER
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        // 🔥 marker user
        L.marker([lat, lng]).addTo(map).bindPopup("Lokasi Anda").openPopup();

        map.setView([lat, lng], 17);

        // 🔥 kirim ke parent (Dashboard)
        onLocation({ lat, lng, accuracy });
      },
      (err) => {
        alert("Gagal mengambil lokasi");
        console.log(err);
      },
    );

    mapRef.current = map;
  });

  return (
    <div
      id="map"
      style={{
        height: "180px",
        borderRadius: "12px",
        marginBottom: "20px",
      }}
    />
  );
}
