const express = require("express");
const router = express.Router();
const {
  getUsers, getMe, createUser, updateUser, toggleStatus, deleteUser,
} = require("../controllers/usersController");
const { authenticate, requireAdmin } = require("../middleware/auth");

// ⚠️  /me MUST be declared before /:id  — otherwise Express matches "me" as an id
router.get("/me",           authenticate, getMe);           // any logged-in user
router.get("/",             authenticate, requireAdmin, getUsers);
router.post("/",            authenticate, requireAdmin, createUser);
router.put("/:id",          authenticate, requireAdmin, updateUser);
router.patch("/:id/status", authenticate, requireAdmin, toggleStatus);
router.delete("/:id",       authenticate, requireAdmin, deleteUser);

module.exports = router;