import { Navigate } from "react-router-dom";
export default function ProtectedRoute({ children, requiredRole }) {
  // ── Baca data user dari localStorage ─────────────────────────────────────
  let user = null;
  try {
    const stored = localStorage.getItem("user");
    user = stored ? JSON.parse(stored) : null;
  } catch {
    // JSON rusak atau localStorage tidak tersedia → anggap belum login
    user = null;
  }

  // ── 1. Belum login → paksa ke halaman login ───────────────────────────────
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // ── 2. Cek kesesuaian role ────────────────────────────────────────────────
  const { role } = user; // "admin" | "pegawai"

  if (requiredRole && role !== requiredRole) {
    // Arahkan ke dashboard yang sesuai dengan role aktual pengguna
    if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (role === "pegawai") return <Navigate to="/dashboard" replace />;

    // Role tidak dikenal → paksa logout ke halaman login
    return <Navigate to="/" replace />;
  }

  // ── 3. Lolos semua pengecekan → render halaman yang dilindungi ────────────
  return children;
}
