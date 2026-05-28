const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/projects?client_id=X
router.get("/", async (req, res) => {
  const { client_id } = req.query;
  if (!client_id) return res.status(400).json({ error: "client_id requerido" });

  const client = await db.getClient(client_id);
  if (!client) return res.status(404).json({ error: "Cliente no encontrado" });

  let projects = await db.getProjects(client_id);
  projects = projects.map(p => ({
    ...p,
    json_data: p.json_data ? JSON.parse(p.json_data) : null
  }));
  res.json({ projects, used: projects.length, max: client.max_landings });
});

// GET /api/projects/:id?client_id=X
router.get("/:id", async (req, res) => {
  const { client_id } = req.query;
  const project = await db.getProject(req.params.id, client_id);
  if (!project) return res.status(404).json({ error: "Proyecto no encontrado" });
  res.json({ project: { ...project, json_data: project.json_data ? JSON.parse(project.json_data) : null } });
});

// POST /api/projects
router.post("/", async (req, res) => {
  const { client_id, name, template_id } = req.body;
  if (!client_id || !name)
    return res.status(400).json({ error: "client_id y name son requeridos" });

  const client = await db.getClient(client_id);
  if (!client) return res.status(404).json({ error: "Cliente no encontrado" });

  const currentProjects = await db.getProjects(client_id);
  const count = currentProjects.length;
  if (count >= client.max_landings) {
    return res.status(403).json({
      error: "LIMIT_REACHED",
      message: `Este cliente ya tiene ${count}/${client.max_landings} landing page(s). Límite alcanzado.`,
      used: count,
      max: client.max_landings,
    });
  }

  let initialJson = null;
  if (template_id) {
    const tpl = await db.getTemplate(template_id);
    if (tpl) {
      initialJson = {
        pages: [{ name: "index", component: tpl.html, styles: tpl.css || "" }]
      };
    }
  }

  let project = await db.createProject({ client_id, name, template_id, json_data: initialJson });
  res.status(201).json({ project: { ...project, json_data: project.json_data ? JSON.parse(project.json_data) : null } });
});

// GET /api/projects/:id/preview
router.get("/:id/preview", async (req, res) => {
  const { client_id } = req.query;
  const project = await db.getProject(req.params.id, client_id);
  if (!project) return res.status(404).send("Proyecto no encontrado");

  const html = project.html || "<h1>Aún no hay contenido</h1>";
  const css = project.css || "";

  res.send(`<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"><title>${project.name}</title><style>${css}</style></head>
  <body>${html}</body>
</html>`);
});

// PUT /api/projects/:id
router.put("/:id", async (req, res) => {
  const { client_id, json_data, html, css } = req.body;
  if (!client_id) return res.status(400).json({ error: "client_id requerido" });

  const updated = await db.updateProject(req.params.id, client_id, json_data, html, css);
  if (!updated) return res.status(404).json({ error: "Proyecto no encontrado" });

  res.json({ ok: true, savedAt: new Date().toISOString() });
});

// DELETE /api/projects/:id
router.delete("/:id", async (req, res) => {
  const { client_id } = req.query;
  await db.deleteProject(req.params.id, client_id);
  res.json({ ok: true });
});

module.exports = router;
