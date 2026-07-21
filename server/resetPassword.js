// ═══════════════════════════════════════════════════════════════
// RESET PASSWORD — Script utilitas untuk reset password admin
// CARA MENJALANKAN: (Lupa pass admin)
//   1. Buka terminal di folder server/
//   2. Jalankan: node resetPassword.js
//   3. Cek output: "Password berhasil direset!"
//   4. Login dengan password baru yang sudah diset di sini
import bcrypt from "bcrypt";
import { db } from "./db.js";

// ── Password baru yang akan diset ────────────────────────────────────────────
const newPassword = "admin123";
// ── Hash password plain text sebelum disimpan ke database ────────────────────
const hashed = await bcrypt.hash(newPassword, 10);

// ── Update password di database ──────────────────────────────────────────────
await db.query("UPDATE users SET password = ? WHERE email = ?", [
  hashed,
  "admin@absensi.com",
]);

console.log("Password berhasil direset!");
console.log("Hash baru:", hashed);
process.exit();
