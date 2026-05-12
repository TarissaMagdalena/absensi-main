import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "absensi_db",
  waitForConnections: true,
  connectionLimit: 10,
  timezone: "+07:00",
});
export default db;
