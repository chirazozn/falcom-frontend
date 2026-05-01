const express = require("express");
const router  = express.Router();
const {
  getProducts, createProduct, updateProduct, deleteProduct,
  getSales, addSale, deleteSale,
} = require("../controllers/productsController");
const { authenticate, requireAdmin } = require("../middleware/auth");

router.get("/",                          authenticate, getProducts);
router.post("/",                         authenticate, requireAdmin, createProduct);
router.put("/:id",                       authenticate, requireAdmin, updateProduct);
router.delete("/:id",                    authenticate, requireAdmin, deleteProduct);

router.get("/:id/sales",                 authenticate, getSales);
router.post("/:id/sales",                authenticate, requireAdmin, addSale);
router.delete("/:id/sales/:saleId",      authenticate, requireAdmin, deleteSale);

module.exports = router;