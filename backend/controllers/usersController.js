const pool = require("../db");

const makeAvatar = (name) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

// ── GET /api/users ───────────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, role, status, avatar, project_name,
              orders_link, website_link, credit_email, credit_password,
              DATE_FORMAT(created_at, '%Y-%m-%d') AS joinDate
       FROM users WHERE role = 'projectowner'
       ORDER BY created_at DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error("getUsers error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ── GET /api/users/me ────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, role, status, avatar, project_name,
              orders_link, website_link, credit_email, credit_password,
              DATE_FORMAT(created_at, '%Y-%m-%d') AS joinDate
       FROM users WHERE id = ? LIMIT 1`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "User not found." });
    return res.json(rows[0]);
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ── POST /api/users ──────────────────────────────────────────────────────────
const createUser = async (req, res) => {
  try {
    const { name, email, password, project_name, status,
            orders_link, website_link, credit_email, credit_password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email and password are required." });

    const [exists] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email.trim().toLowerCase()]
    );
    if (exists[0]) return res.status(409).json({ message: "Email already in use." });

    const avatar = makeAvatar(name);

    const [result] = await pool.query(
      `INSERT INTO users
         (name, email, password_hash, role, status, avatar, project_name,
          orders_link, website_link, credit_email, credit_password)
       VALUES (?, ?, ?, 'projectowner', ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(), email.trim().toLowerCase(), password,
        status || "active", avatar, project_name?.trim() || null,
        orders_link?.trim() || null, website_link?.trim() || null,
        credit_email?.trim() || null, credit_password || null,
      ]
    );

    const [newUser] = await pool.query(
      `SELECT id, name, email, role, status, avatar, project_name,
              orders_link, website_link, credit_email, credit_password,
              DATE_FORMAT(created_at, '%Y-%m-%d') AS joinDate
       FROM users WHERE id = ?`,
      [result.insertId]
    );
    return res.status(201).json(newUser[0]);
  } catch (err) {
    console.error("createUser error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ── PUT /api/users/:id ───────────────────────────────────────────────────────
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, project_name, status,
            orders_link, website_link, credit_email, credit_password } = req.body;

    if (!name || !email) return res.status(400).json({ message: "Name and email are required." });

    const [dup] = await pool.query(
      "SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1",
      [email.trim().toLowerCase(), id]
    );
    if (dup[0]) return res.status(409).json({ message: "Email already in use." });

    const avatar = makeAvatar(name);

    if (password) {
      await pool.query(
        `UPDATE users SET name=?, email=?, password_hash=?, project_name=?, status=?, avatar=?,
         orders_link=?, website_link=?, credit_email=?, credit_password=?
         WHERE id=? AND role='projectowner'`,
        [name.trim(), email.trim().toLowerCase(), password,
         project_name?.trim()||null, status||"active", avatar,
         orders_link?.trim()||null, website_link?.trim()||null,
         credit_email?.trim()||null, credit_password||null, id]
      );
    } else {
      await pool.query(
        `UPDATE users SET name=?, email=?, project_name=?, status=?, avatar=?,
         orders_link=?, website_link=?, credit_email=?, credit_password=?
         WHERE id=? AND role='projectowner'`,
        [name.trim(), email.trim().toLowerCase(),
         project_name?.trim()||null, status||"active", avatar,
         orders_link?.trim()||null, website_link?.trim()||null,
         credit_email?.trim()||null, credit_password||null, id]
      );
    }

    const [updated] = await pool.query(
      `SELECT id, name, email, role, status, avatar, project_name,
              orders_link, website_link, credit_email, credit_password,
              DATE_FORMAT(created_at, '%Y-%m-%d') AS joinDate
       FROM users WHERE id=?`, [id]
    );
    if (!updated[0]) return res.status(404).json({ message: "User not found." });
    return res.json(updated[0]);
  } catch (err) {
    console.error("updateUser error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ── PATCH /api/users/:id/status ──────────────────────────────────────────────
const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT id, status FROM users WHERE id=? AND role='projectowner' LIMIT 1", [id]
    );
    if (!rows[0]) return res.status(404).json({ message: "User not found." });
    const newStatus = rows[0].status === "active" ? "suspended" : "active";
    await pool.query("UPDATE users SET status=? WHERE id=?", [newStatus, id]);
    return res.json({ id: Number(id), status: newStatus });
  } catch (err) {
    console.error("toggleStatus error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ── DELETE /api/users/:id ────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "DELETE FROM users WHERE id=? AND role='projectowner'", [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found." });
    return res.json({ message: "User deleted." });
  } catch (err) {
    console.error("deleteUser error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

module.exports = { getUsers, getMe, createUser, updateUser, toggleStatus, deleteUser };