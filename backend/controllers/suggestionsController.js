const pool = require("../db");

// ── GET /api/suggestions  ────────────────────────────────────────────────────
// Admin gets all; projectowner gets 'all' + their own
const getSuggestions = async (req, res) => {
  try {
    const { id, role } = req.user;

    let rows;
    if (role === "admin") {
      [rows] = await pool.query(
        `SELECT s.*,
                u.name AS target_user_name,
                DATE_FORMAT(s.created_at, '%Y-%m-%d') AS date,
                (SELECT COUNT(*) FROM suggestion_likes sl WHERE sl.suggestion_id = s.id) AS likes
         FROM suggestions s
         LEFT JOIN users u ON u.id = s.target_user
         ORDER BY s.created_at DESC`
      );
    } else {
      [rows] = await pool.query(
        `SELECT s.*,
                DATE_FORMAT(s.created_at, '%Y-%m-%d') AS date,
                (SELECT COUNT(*) FROM suggestion_likes sl WHERE sl.suggestion_id = s.id) AS likes,
                EXISTS(
                  SELECT 1 FROM suggestion_likes sl2
                  WHERE sl2.suggestion_id = s.id AND sl2.user_id = ?
                ) AS liked_by_me
         FROM suggestions s
         WHERE s.target_type = 'all' OR s.target_user = ?
         ORDER BY s.created_at DESC`,
        [id, id]
      );
    }

    return res.json(rows);
  } catch (err) {
    console.error("getSuggestions error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ── POST /api/suggestions  (admin only) ─────────────────────────────────────
const createSuggestion = async (req, res) => {
  try {
    const { title, body, target_type, target_user } = req.body;
    const adminId = req.user.id;

    if (!title || !body)
      return res.status(400).json({ message: "Title and body are required." });

    const type = target_type === "user" ? "user" : "all";
    const targetUserId = type === "user" ? (target_user || null) : null;

    const [result] = await pool.query(
      `INSERT INTO suggestions (title, body, target_type, target_user, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [title.trim(), body.trim(), type, targetUserId, adminId]
    );

    const [newRow] = await pool.query(
      `SELECT s.*,
              u.name AS target_user_name,
              DATE_FORMAT(s.created_at, '%Y-%m-%d') AS date,
              0 AS likes
       FROM suggestions s
       LEFT JOIN users u ON u.id = s.target_user
       WHERE s.id = ?`,
      [result.insertId]
    );

    return res.status(201).json(newRow[0]);
  } catch (err) {
    console.error("createSuggestion error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ── POST /api/suggestions/:id/like  (project owner) ─────────────────────────
const likeSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if already liked
    const [existing] = await pool.query(
      "SELECT 1 FROM suggestion_likes WHERE suggestion_id = ? AND user_id = ?",
      [id, userId]
    );

    if (existing[0]) {
      // Toggle off
      await pool.query(
        "DELETE FROM suggestion_likes WHERE suggestion_id = ? AND user_id = ?",
        [id, userId]
      );
    } else {
      // Like
      await pool.query(
        "INSERT INTO suggestion_likes (suggestion_id, user_id) VALUES (?, ?)",
        [id, userId]
      );
    }

    const [[{ likes }]] = await pool.query(
      "SELECT COUNT(*) AS likes FROM suggestion_likes WHERE suggestion_id = ?",
      [id]
    );

    return res.json({ liked: !existing[0], likes: Number(likes) });
  } catch (err) {
    console.error("likeSuggestion error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ── DELETE /api/suggestions/:id  (admin only) ────────────────────────────────
const deleteSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM suggestions WHERE id = ?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Suggestion not found." });
    return res.json({ message: "Suggestion deleted." });
  } catch (err) {
    console.error("deleteSuggestion error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

module.exports = { getSuggestions, createSuggestion, likeSuggestion, deleteSuggestion };