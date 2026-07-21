// ═══════════════════════════════════════════════════════════════
// API UTILITY — Helper request ke backend
// ═══════════════════════════════════════════════════════════════
import axios from "axios";
// ── Base URL backend — GANTI jika deploy ke server lain ──────────────────────
const BASE_URL = "http://localhost:5000/api";

// ── Helper: auto-logout jika dapat 401 dan user sudah login ──────────────────
function handleUnauthorized() {
  localStorage.removeItem("user");
  window.location.href = "/";
}

// ── apiFetch — wrapper fetch native dengan auto-logout ─────────────────────────────────────────
export async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);

  // Jika 401 DAN sudah pernah login → auto logout
  if (res.status === 401 && localStorage.getItem("user")) {
    handleUnauthorized();
    return null; // hentikan eksekusi pemanggil
  }

  return res;
}

// ── api — axios instance dengan baseURL + interceptor  ──────────────────────────────────
// Digunakan untuk request yang butuh fitur axios (multipart, interceptor, dll).
// Base URL sudah dikonfigurasi — cukup tulis path relatif: api.get("/pegawai")
export const api = axios.create({
  baseURL: BASE_URL,
});

// Interceptor response axios — tangkap 401 dan auto-logout
api.interceptors.response.use(
  (res) => res, // response sukses — teruskan apa adanya
  (err) => {
    // Hanya redirect jika user sudah login sebelumnya (bukan saat proses login)
    if (err.response?.status === 401 && localStorage.getItem("user")) {
      handleUnauthorized();
    }
    return Promise.reject(err); // tetap lempar error agar pemanggil bisa handle
  },
);
