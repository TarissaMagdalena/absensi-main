// ═══════════════════════════════════════════════════════════════
// MAIN.JSX — Entry point aplikasi React
// Ini adalah file PERTAMA yang dijalankan saat aplikasi dibuka
// Yang dilakukan di sini:
//   1. Inisialisasi React → hubungkan ke <div id="root"> di index.html
//   2. Bungkus dengan BrowserRouter → aktifkan routing berbasis URL
//   3. Bungkus dengan StrictMode   → aktifkan pemeriksaan ekstra (development)
//   4. Import semua CSS global
// ═══════════════════════════════════════════════════════════════
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./styles.css";
import "./styles/global.css";
import "./styles/dashboard.css";
import "./styles/table.css";
import "./styles/modal.css";
import "./styles/profile.css";
import "./styles/responsive.css";
import "leaflet/dist/leaflet.css";

// ── Render aplikasi ke DOM ────────────────────────────────────────────────────
// createRoot + render menggantikan ReactDOM.render() yang lama (React 18+)
createRoot(document.getElementById("root")).render(
  // StrictMode: aktifkan pemeriksaan tambahan DAN jalankan effect dua kali
  <StrictMode>
    {/* BrowserRouter: aktifkan navigasi berbasis URL (/admin/beranda, /dashboard, dll) */}
    <BrowserRouter>
      {/* ← semua route dan halaman didefinisikan di App.jsx */}
      <App />
    </BrowserRouter>
  </StrictMode>,
);
