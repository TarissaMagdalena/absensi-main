import ntpClient from "ntp-client";

// ── Helper: fetch dengan timeout ──────────────────────────────────────────────
async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── Sumber 1: NTP ─────────────────────────────────────────────────────────────
function getFromNTP() {
  return new Promise((resolve, reject) => {
    // Timeout manual 5 detik agar tidak hang
    const timer = setTimeout(() => reject(new Error("NTP timeout")), 5000);
    ntpClient.getNetworkTime("pool.ntp.org", 123, (err, date) => {
      clearTimeout(timer);
      if (err) return reject(err);
      if (!date || isNaN(date.getTime()))
        return reject(new Error("NTP date tidak valid"));
      // Validasi: tahun harus masuk akal (> 2020)
      if (date.getFullYear() < 2020)
        return reject(
          new Error(`NTP tahun tidak valid: ${date.getFullYear()}`),
        );
      resolve(date);
    });
  });
}

// ── Sumber 2: TimeAPI.io ──────────────────────────────────────────────────────
async function getFromTimeAPI() {
  const res = await fetchWithTimeout(
    "https://timeapi.io/api/Time/current/zone?timeZone=Asia%2FJakarta",
  );
  const data = await res.json();
  if (!data?.year) throw new Error("Response tidak valid");
  const isoStr = `${data.year}-${String(data.month).padStart(2, "0")}-${String(data.day).padStart(2, "0")}T${String(data.hour).padStart(2, "0")}:${String(data.minute).padStart(2, "0")}:${String(data.seconds).padStart(2, "0")}+07:00`;
  return new Date(isoStr);
}

// ── Sumber 3: Header Date dari Cloudflare ────────────────────────────────────
async function getFromHTTPHeader() {
  const res = await fetchWithTimeout("https://www.cloudflare.com", {
    method: "HEAD",
  });
  const dateHeader = res.headers.get("date");
  if (!dateHeader) throw new Error("Header Date tidak ada");
  const parsed = new Date(dateHeader);
  if (isNaN(parsed.getTime())) throw new Error("Header Date tidak valid");
  return parsed;
}

// ── Export utama ──────────────────────────────────────────────────────────────
export async function getWIBTime() {
  // Sumber 1: NTP
  try {
    const t = await getFromNTP();
    console.log("[Time] ✅ NTP pool.ntp.org:", t.toISOString());
    return t;
  } catch (err) {
    console.warn("[Time] ⚠️ NTP gagal:", err.message);
  }

  // Sumber 2: TimeAPI.io
  try {
    const t = await getFromTimeAPI();
    console.log("[Time] ✅ TimeAPI.io:", t.toISOString());
    return t;
  } catch (err) {
    console.warn("[Time] ⚠️ TimeAPI.io gagal:", err.message);
  }

  // Sumber 3: HTTP Header Cloudflare
  try {
    const t = await getFromHTTPHeader();
    console.log("[Time] ✅ HTTP Header Date:", t.toISOString());
    return t;
  } catch (err) {
    console.warn("[Time] ⚠️ HTTP Header Date gagal:", err.message);
  }

  // Semua gagal
  console.error("[Time] ❌ Semua sumber waktu tidak tersedia");
  throw new Error(
    "WAKTU_TIDAK_TERSEDIA: Tidak dapat memverifikasi waktu. " +
      "Pastikan server memiliki koneksi internet.",
  );
}

// ── Export helper ─────────────────────────────────────────────────────────────
export function formatWIB(date) {
  return {
    today: date.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }),
    now: date.toLocaleTimeString("en-GB", {
      hour12: false,
      timeZone: "Asia/Jakarta",
    }),
  };
}
