const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/funnels?client_id=X
router.get("/", async (req, res) => {
  const { client_id } = req.query;
  if (!client_id) return res.status(400).json({ error: "client_id requerido" });

  const client = await db.getClient(client_id);
  if (!client) return res.status(404).json({ error: "Cliente no encontrado" });

  let funnels = await db.getFunnels(client_id);
  funnels = funnels.map(f => ({
    ...f,
    form_fields: f.form_fields ? JSON.parse(f.form_fields) : []
  }));
  res.json({ funnels });
});

// GET /api/funnels/:id
router.get("/:id", async (req, res) => {
  const funnel = await db.getFunnel(req.params.id);
  if (!funnel) return res.status(404).json({ error: "Funnel no encontrado" });
  res.json({ funnel: { ...funnel, form_fields: funnel.form_fields ? JSON.parse(funnel.form_fields) : [] } });
});

// POST /api/funnels
router.post("/", async (req, res) => {
  const { client_id, title, video_url } = req.body;

  if (!client_id || !title || !video_url) {
    return res.status(400).json({ error: "client_id, title y video_url son requeridos" });
  }

  const client = await db.getClient(client_id);
  if (!client) return res.status(404).json({ error: "Cliente no encontrado" });

  const clientFunnels = await db.getFunnels(client_id);
  if (clientFunnels.length >= 5) {
    return res.status(400).json({ error: "Límite máximo de 5 funnels alcanzado." });
  }

  const funnel = await db.createFunnel(req.body);
  res.status(201).json({ funnel: { ...funnel, form_fields: funnel.form_fields ? JSON.parse(funnel.form_fields) : [] } });
});

// PUT /api/funnels/:id
router.put("/:id", async (req, res) => {
  const funnel = await db.updateFunnel(req.params.id, req.body);
  if (!funnel) return res.status(404).json({ error: "Funnel no encontrado" });
  res.json({ funnel: { ...funnel, form_fields: funnel.form_fields ? JSON.parse(funnel.form_fields) : [] } });
});

// PUT /api/funnels/:id/publish
router.put("/:id/publish", async (req, res) => {
  const funnel = await db.publishFunnel(req.params.id);
  if (!funnel) return res.status(404).json({ error: "Funnel no encontrado" });
  res.json({ funnel: { ...funnel, form_fields: funnel.form_fields ? JSON.parse(funnel.form_fields) : [] } });
});

// PUT /api/funnels/:id/unpublish
router.put("/:id/unpublish", async (req, res) => {
  const funnel = await db.unpublishFunnel(req.params.id);
  if (!funnel) return res.status(404).json({ error: "Funnel no encontrado" });
  res.json({ funnel: { ...funnel, form_fields: funnel.form_fields ? JSON.parse(funnel.form_fields) : [] } });
});

// DELETE /api/funnels/:id
router.delete("/:id", async (req, res) => {
  const { client_id } = req.query;
  await db.deleteFunnel(req.params.id, client_id);
  res.json({ ok: true });
});

module.exports = router;
