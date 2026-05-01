const express = require("express");
const router = express.Router();
const {
  getSuggestions,
  createSuggestion,
  likeSuggestion,
  deleteSuggestion,
} = require("../controllers/suggestionsController");
const { authenticate, requireAdmin } = require("../middleware/auth");

// All routes require login
router.get("/", authenticate, getSuggestions);
router.post("/", authenticate, requireAdmin, createSuggestion);
router.post("/:id/like", authenticate, likeSuggestion);
router.delete("/:id", authenticate, requireAdmin, deleteSuggestion);

module.exports = router;