const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "falcom_secret_change_in_prod";

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer "))
    return res.status(401).json({ message: "Authentication required." });

  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin")
    return res.status(403).json({ message: "Admin access required." });
  next();
};

module.exports = { authenticate, requireAdmin };