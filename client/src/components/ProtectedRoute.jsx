// ═══════════════════════════════════════════════════════════════
// PROTECTED ROUTE — Penjaga halaman, cek login + role
// ═══════════════════════════════════════════════════════════════
import { Navigate } from "react-router-dom";
export default function ProtectedRoute({ children, requiredRole }) {
  let user = null;
  try {
    const stored = localStorage.getItem("user");
    user = stored ? JSON.parse(stored) : null;
  } catch {
    user = null;
  }

  // ═══════════════════════════════════════════════════════════════
  // Belum login → paksa ke halaman login
  // ═══════════════════════════════════════════════════════════════
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // ═══════════════════════════════════════════════════════════════
  // Cek kesesuaian role
  // ═══════════════════════════════════════════════════════════════
  const { role } = user; // "admin" | "pegawai"
  if (requiredRole && role !== requiredRole) {
    if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (role === "pegawai") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  // ═══════════════════════════════════════════════════════════════
  // Lolos semua pengecekan → tampilkan halaman
  // ═══════════════════════════════════════════════════════════════
  return children;
}
