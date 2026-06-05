const express = require("express");
const router = express.Router();

// GET /api/templates
router.get("/", async (req, res) => {
  // Ya no usamos templates locales, todo en KiuFlow
  res.json([]);
});

// GET /api/templates/:id
router.get("/:id", (req, res) => {
  res.status(404).json({ error: "Plantilla no encontrada" });
});

module.exports = router;
