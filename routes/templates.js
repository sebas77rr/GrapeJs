const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/templates  — catálogo para templates.onLoad del Studio SDK
router.get("/", async (req, res) => {
  const templates = await db.getTemplates();

  const formatted = templates.map((t) => ({
    id: String(t.id),
    label: t.name,
    description: t.description || "",
    category: t.category,
    thumbnail: t.thumbnail || "",
    project: {
      pages: [{ component: t.html, styles: t.css || "" }],
    },
  }));

  res.json(formatted);
});

// GET /api/templates/:id
router.get("/:id", (req, res) => {
  const template = db.getTemplate(req.params.id);
  if (!template) return res.status(404).json({ error: "Plantilla no encontrada" });
  res.json(template);
});

module.exports = router;
