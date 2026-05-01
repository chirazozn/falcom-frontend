const jwt = require("jsonwebtoken");
const pool = require("../db");
const { sendResetEmail } = require("../utils/mailer");

const JWT_SECRET = process.env.JWT_SECRET || "falcom_secret_change_in_prod";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "8h";

// ── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required." });

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email.trim().toLowerCase()]
    );

    const user = rows[0];

    if (!user)
      return res.status(401).json({ message: "Invalid email or password." });

    if (user.status === "suspended")
      return res.status(403).json({ message: "Your account has been suspended. Contact your administrator." });

    // Plain text password check
    if (password !== user.password_hash)
      return res.status(401).json({ message: "Invalid email or password." });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email, avatar: user.avatar, project_name: user.project_name, joinDate: user.created_at },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        project_name: user.project_name,
        joinDate: user.created_at,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ── POST /api/auth/forgot-password ──────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const [rows] = await pool.query(
      "SELECT id, name FROM users WHERE email = ? AND status = 'active' LIMIT 1",
      [email.trim().toLowerCase()]
    );

    if (!rows[0])
      return res.json({ message: "If that email exists, a code has been sent." });

    const user = rows[0];

    await pool.query(
      "UPDATE reset_tokens SET used = 1 WHERE user_id = ? AND used = 0",
      [user.id]
    );

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      "INSERT INTO reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user.id, code, expiresAt]
    );

    await sendResetEmail(email.trim(), user.name, code);

    return res.json({ message: "If that email exists, a code has been sent." });
  } catch (err) {
    console.error("forgotPassword error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ── POST /api/auth/verify-code ──────────────────────────────────────────────
const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code)
      return res.status(400).json({ message: "Email and code are required." });

    const [rows] = await pool.query(
      `SELECT rt.id, rt.expires_at
       FROM reset_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE u.email = ? AND rt.token = ? AND rt.used = 0
       ORDER BY rt.created_at DESC
       LIMIT 1`,
      [email.trim().toLowerCase(), code.trim()]
    );

    if (!rows[0])
      return res.status(400).json({ message: "Invalid or expired code." });

    if (new Date() > new Date(rows[0].expires_at))
      return res.status(400).json({ message: "Code has expired. Please request a new one." });

    return res.json({ valid: true });
  } catch (err) {
    console.error("verifyCode error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ── POST /api/auth/reset-password ───────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword)
      return res.status(400).json({ message: "All fields are required." });

    if (newPassword.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters." });

    const [rows] = await pool.query(
      `SELECT rt.id, u.id AS user_id, rt.expires_at
       FROM reset_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE u.email = ? AND rt.token = ? AND rt.used = 0
       ORDER BY rt.created_at DESC
       LIMIT 1`,
      [email.trim().toLowerCase(), code.trim()]
    );

    if (!rows[0])
      return res.status(400).json({ message: "Invalid or expired code." });

    if (new Date() > new Date(rows[0].expires_at))
      return res.status(400).json({ message: "Code has expired. Please request a new one." });

    // Store plain text password
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
      newPassword, rows[0].user_id,
    ]);

    await pool.query("UPDATE reset_tokens SET used = 1 WHERE id = ?", [rows[0].id]);

    return res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};


// ── POST /api/auth/change-password ──────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "All fields are required." });

    if (newPassword.length < 6)
      return res.status(400).json({ message: "New password must be at least 6 characters." });

    const [rows] = await pool.query(
      "SELECT password_hash FROM users WHERE id = ? LIMIT 1", [userId]
    );
    if (!rows[0]) return res.status(404).json({ message: "User not found." });

    if (currentPassword !== rows[0].password_hash)
      return res.status(401).json({ message: "Current password is incorrect." });

    if (newPassword === currentPassword)
      return res.status(400).json({ message: "New password must be different from current password." });

    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [newPassword, userId]);

    return res.json({ message: "Password changed successfully." });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

module.exports = { login, forgotPassword, verifyCode, resetPassword, changePassword };