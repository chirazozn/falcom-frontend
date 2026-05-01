require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const authRoutes        = require("./routes/authRoutes");
const usersRoutes       = require("./routes/usersRoutes");
const suggestionsRoutes = require("./routes/suggestionsRoutes");
const productsRoutes    = require("./routes/productsRoutes");

require("./db");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth",        authRoutes);
app.use("/api/users",       usersRoutes);
app.use("/api/suggestions", suggestionsRoutes);
app.use("/api/products",    productsRoutes);

app.get("/api/health", (req, res) => res.json({ status:"ok", project:"FALCOM" }));
app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }));
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("════════════════════════════════════════");
  console.log(`🚀  FALCOM backend  →  http://localhost:${PORT}`);
  console.log(`📡  Frontend origin →  ${process.env.CLIENT_ORIGIN || "http://localhost:3000"}`);
  console.log("════════════════════════════════════════");
});