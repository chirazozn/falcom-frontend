// ============================================================
//  db.js  —  FALCOM  |  TiDB Serverless Connection
// ============================================================
require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || "gateway01.eu-central-1.prod.aws.tidbcloud.com",
  port:     process.env.DB_PORT     || 4000,
  user:     process.env.DB_USER     || "tbdRXVuaY9SEoGL.root",
  password: process.env.DB_PASSWORD || "tR5XzCGHYYH8RFrg",
  database: process.env.DB_NAME     || "falcommvp1",

  ssl: { rejectUnauthorized: true },  // TiDB requires SSL — no cert file needed

  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           "+00:00",
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0,
});

// ── Test connection on startup ────────────────────────────────
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅  TiDB connected  →  falcommvp1");
    conn.release();
  } catch (err) {
    console.error("❌  TiDB connection FAILED:", err.message);
    process.exit(1);
  }
})();

module.exports = pool;