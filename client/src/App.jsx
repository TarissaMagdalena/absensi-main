import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/login";
import ProtectedRoute from "./components/ProtectedRoute";

// ── Admin ─────────────────────────────────────────────────────────────────────
import DashboardAdmin from "./pages/Admin/DashboardAdmin";
import JadwalShift from "./pages/admin/JadwalShift";
import DataAbsensi from "./pages/admin/DataAbsensi";
import LaporanAbsensi from "./pages/admin/LaporanAbsensi";
import DataPegawai from "./pages/admin/DataPegawai";
import ManajemenAkun from "./pages/admin/ManajemenAkun";
import ProfilAdmin from "./pages/admin/Pengaturan";

// ── Pegawai ───────────────────────────────────────────────────────────────────
import Dashboard from "./pages/Pegawai/Dashboard";
import RekapKehadiran from "./pages/Pegawai/RekapKehadiran";
import PengaturanPegawai from "./pages/pegawai/PengaturanPegawai";

function App() {
  return (
    <Routes>
      {/* ── Halaman login (publik) ─────────────────────────────────────────── */}
      <Route path="/" element={<LoginGuard />} />

      {/* ── Route ADMIN — hanya bisa diakses role "admin" ─────────────────── */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <DashboardAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/jadwal"
        element={
          <ProtectedRoute requiredRole="admin">
            <JadwalShift />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/absensi"
        element={
          <ProtectedRoute requiredRole="admin">
            <DataAbsensi />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/laporan"
        element={
          <ProtectedRoute requiredRole="admin">
            <LaporanAbsensi />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/datapegawai"
        element={
          <ProtectedRoute requiredRole="admin">
            <DataPegawai />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/manajemenakun"
        element={
          <ProtectedRoute requiredRole="admin">
            <ManajemenAkun />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/profil"
        element={
          <ProtectedRoute requiredRole="admin">
            <ProfilAdmin />
          </ProtectedRoute>
        }
      />

      {/* ── Route PEGAWAI — hanya bisa diakses role "pegawai" ─────────────── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="pegawai">
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rekapkehadiran"
        element={
          <ProtectedRoute requiredRole="pegawai">
            <RekapKehadiran />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pengaturan"
        element={
          <ProtectedRoute requiredRole="pegawai">
            <PengaturanPegawai />
          </ProtectedRoute>
        }
      />

      {/* ── Catch-all: route tidak dikenal → redirect ke login ────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ── LoginGuard ────────────────────────────────────────────────────────────────
// Jika user sudah login dan mengakses "/", langsung redirect ke dashboard
// sesuai rolenya. Jika belum login, tampilkan halaman login.
function LoginGuard() {
  let user = null;
  try {
    const stored = localStorage.getItem("user");
    user = stored ? JSON.parse(stored) : null;
  } catch {
    user = null;
  }

  if (!user) return <Login />;
  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (user.role === "pegawai") return <Navigate to="/dashboard" replace />;
  return <Login />;
}

export default App;
