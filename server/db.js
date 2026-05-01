import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "", // kosong untuk XAMPP default
  database: "absensi_db",
});

export { db };
export default db;
