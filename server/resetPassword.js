import bcrypt from "bcrypt";
import { db } from "./db.js";

const newPassword = "admin123";
const hashed = await bcrypt.hash(newPassword, 10);

await db.query("UPDATE users SET password = ? WHERE email = ?", [
  hashed,
  "admin@absensi.com",
]);

console.log("Password berhasil direset!");
console.log("Hash baru:", hashed);
process.exit();
