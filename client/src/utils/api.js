// src/utils/api.js
import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

// ── Helper: auto-logout jika dapat 401 dan user sudah login ──────────────────
function handleUnauthorized() {
  localStorage.removeItem("user");
  window.location.href = "/";
}

// ── apiFetch — wrapper fetch native ─────────────────────────────────────────
// Digunakan untuk request yang tidak perlu axios (simple GET/POST).
// Mengembalikan Response object apa adanya — pemanggil yang handle error.
// Jika 401 dan user sudah login → auto logout & redirect ke halaman login.
export async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);

  // Hanya auto-logout jika user sudah login sebelumnya (bukan saat proses login)
  if (res.status === 401 && localStorage.getItem("user")) {
    handleUnauthorized();
    return null; // hentikan eksekusi pemanggil
  }

  return res;
}

// ── api — axios instance ─────────────────────────────────────────────────────
// Digunakan untuk request yang butuh fitur axios (multipart, interceptor, dll).
// Base URL sudah dikonfigurasi — cukup tulis path relatif: api.get("/pegawai")
export const api = axios.create({
  baseURL: BASE_URL,
});

// Interceptor response — tangkap 401 dan auto-logout
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
