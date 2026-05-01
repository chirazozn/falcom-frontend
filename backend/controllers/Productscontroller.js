const pool = require("../db");

// ── GET /api/products ────────────────────────────────────────────────────────
const getProducts = async (req, res) => {
  try {
    const { id, role } = req.user;
    const { owner_id } = req.query;

    let rows;
    if (role === "admin") {
      const filter = owner_id ? "WHERE p.owner_id = ?" : "";
      const params = owner_id ? [owner_id] : [];
      [rows] = await pool.query(
        `SELECT p.id, p.owner_id, p.name, p.description, p.image_url,
                p.price, p.stock, p.created_at, p.updated_at,
                u.name AS owner_name,
                COALESCE(SUM(s.qty_sold), 0) AS total_sold,
                COALESCE(SUM(s.total),    0) AS total_revenue
         FROM products p
         JOIN users u ON u.id = p.owner_id
         LEFT JOIN sales s ON s.product_id = p.id
         ${filter}
         GROUP BY p.id, p.owner_id, p.name, p.description, p.image_url,
                  p.price, p.stock, p.created_at, p.updated_at, u.name
         ORDER BY p.created_at DESC`,
        params
      );
    } else {
      [rows] = await pool.query(
        `SELECT p.id, p.owner_id, p.name, p.description, p.image_url,
                p.price, p.stock, p.created_at, p.updated_at,
                COALESCE(SUM(s.qty_sold), 0) AS total_sold,
                COALESCE(SUM(s.total),    0) AS total_revenue
         FROM products p
         LEFT JOIN sales s ON s.product_id = p.id
         WHERE p.owner_id = ?
         GROUP BY p.id, p.owner_id, p.name, p.description, p.image_url,
                  p.price, p.stock, p.created_at, p.updated_at
         ORDER BY p.created_at DESC`,
        [id]
      );
    }
    return res.json(rows);
  } catch (err) {
    console.error("getProducts error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ── POST /api/products ───────────────────────────────────────────────────────
const createProduct = async (req, res) => {
  try {
    const { owner_id, name, description, image_url, price, stock } = req.body;
    if (!owner_id || !name)
      return res.status(400).json({ message: "Owner and product name are required." });

    const [result] = await pool.query(
      `INSERT INTO products (owner_id, name, description, image_url, price, stock)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [owner_id, name.trim(), description?.trim()||null,
       image_url?.trim()||null, price||0, stock||0]
    );

    const [newRow] = await pool.query(
      `SELECT p.id, p.owner_id, p.name, p.description, p.image_url,
              p.price, p.stock, p.created_at, p.updated_at,
              u.name AS owner_name, 0 AS total_sold, 0 AS total_revenue
       FROM products p JOIN users u ON u.id = p.owner_id
       WHERE p.id = ?`, [result.insertId]
    );
    return res.status(201).json(newRow[0]);
  } catch (err) {
    console.error("createProduct error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ── PUT /api/products/:id ────────────────────────────────────────────────────
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image_url, price, stock } = req.body;
    if (!name) return res.status(400).json({ message: "Product name is required." });

    await pool.query(
      `UPDATE products SET name=?, description=?, image_url=?, price=?, stock=? WHERE id=?`,
      [name.trim(), description?.trim()||null, image_url?.trim()||null, price||0, stock||0, id]
    );

    const [updated] = await pool.query(
      `SELECT p.id, p.owner_id, p.name, p.description, p.image_url,
              p.price, p.stock, p.created_at, p.updated_at,
              u.name AS owner_name,
              COALESCE(SUM(s.qty_sold), 0) AS total_sold,
              COALESCE(SUM(s.total),    0) AS total_revenue
       FROM products p
       JOIN users u ON u.id = p.owner_id
       LEFT JOIN sales s ON s.product_id = p.id
       WHERE p.id = ?
       GROUP BY p.id, p.owner_id, p.name, p.description, p.image_url,
                p.price, p.stock, p.created_at, p.updated_at, u.name`, [id]
    );
    if (!updated[0]) return res.status(404).json({ message: "Product not found." });
    return res.json(updated[0]);
  } catch (err) {
    console.error("updateProduct error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ── DELETE /api/products/:id ─────────────────────────────────────────────────
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM products WHERE id=?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Product not found." });
    return res.json({ message: "Product deleted." });
  } catch (err) {
    console.error("deleteProduct error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ── GET /api/products/:id/sales ──────────────────────────────────────────────
const getSales = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    if (role !== "admin") {
      const [prod] = await pool.query(
        "SELECT owner_id FROM products WHERE id=? LIMIT 1", [id]
      );
      if (!prod[0] || prod[0].owner_id !== userId)
        return res.status(403).json({ message: "Access denied." });
    }

    const [rows] = await pool.query(
      `SELECT id, product_id, owner_id, qty_sold, unit_price, total, note,
              DATE_FORMAT(sold_at, '%Y-%m-%d') AS date,
              DATE_FORMAT(sold_at, '%H:%i')    AS time,
              sold_at, created_by
       FROM sales WHERE product_id = ?
       ORDER BY sold_at DESC`, [id]
    );
    return res.json(rows);
  } catch (err) {
    console.error("getSales error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ── POST /api/products/:id/sales ─────────────────────────────────────────────
const addSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { qty_sold, unit_price, note, sold_at } = req.body;
    const adminId = req.user.id;

    if (!qty_sold || !unit_price)
      return res.status(400).json({ message: "Quantity and price are required." });

    const [prod] = await pool.query(
      "SELECT owner_id, stock FROM products WHERE id=? LIMIT 1", [id]
    );
    if (!prod[0]) return res.status(404).json({ message: "Product not found." });

    const total    = parseFloat(qty_sold) * parseFloat(unit_price);
    const saleDate = sold_at ? new Date(sold_at) : new Date();

    const [result] = await pool.query(
      `INSERT INTO sales (product_id, owner_id, qty_sold, unit_price, total, note, sold_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, prod[0].owner_id, qty_sold, unit_price, total, note?.trim()||null, saleDate, adminId]
    );

    await pool.query(
      "UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id=?",
      [qty_sold, id]
    );

    const [newSale] = await pool.query(
      `SELECT id, product_id, owner_id, qty_sold, unit_price, total, note,
              DATE_FORMAT(sold_at,'%Y-%m-%d') AS date,
              DATE_FORMAT(sold_at,'%H:%i')    AS time
       FROM sales WHERE id=?`, [result.insertId]
    );
    return res.status(201).json(newSale[0]);
  } catch (err) {
    console.error("addSale error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ── DELETE /api/products/:id/sales/:saleId ───────────────────────────────────
const deleteSale = async (req, res) => {
  try {
    const { id, saleId } = req.params;
    const [sale] = await pool.query(
      "SELECT qty_sold FROM sales WHERE id=? LIMIT 1", [saleId]
    );
    if (sale[0]) {
      await pool.query(
        "UPDATE products SET stock = stock + ? WHERE id=?",
        [sale[0].qty_sold, id]
      );
    }
    await pool.query("DELETE FROM sales WHERE id=?", [saleId]);
    return res.json({ message: "Sale deleted." });
  } catch (err) {
    console.error("deleteSale error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct, getSales, addSale, deleteSale };