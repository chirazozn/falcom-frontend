const express = require("express");
const router = express.Router();
const {
  login,
  forgotPassword,
  verifyCode,
  resetPassword,
  changePassword,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-code", verifyCode);
router.post("/reset-password", resetPassword);

router.post("/change-password", authenticate, changePassword);

module.exports = router;