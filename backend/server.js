const express = require("express");
const cors = require("cors");
const db = require("./db"); // initializes DB on first import
const path = require("path");
const { renderFunnelLanding, renderFunnelForm } = require("./funnel-renderer");

const app = express();
const PORT = 3001;

// ── MIDDLEWARE ──────────────────────────────────────────────────────────────
app.use(cors({ origin: /^http:\/\/localhost(:\d+)?$/ }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ── ROUTES ─────────────────────────────────────────────────────────────────
app.use("/api/projects", require("./routes/projects"));
app.use("/api/templates", require("./routes/templates"));
app.use("/api/funnels", require("./routes/funnels"));   // CRUD de video funnels
app.use("/api/funnels", require("./routes/leads"));     // Captura y consulta de leads

// ── SERVE STATIC FRONTEND (Vite /dist) ────────────────────────────────────
app.use(express.static(path.join(__dirname, "../dist")));

// GET /api/clients  →  lista de clientes para el selector de la demo
app.get("/api/clients", async (req, res) => {
  res.json(await db.getClients());
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ── DOMINIOS TEMPORALES (PÚBLICOS) ─────────────────────────────────────────
app.get("/p/:slug", async (req, res) => {
  const project = await db.getProjectBySlug(req.params.slug);
  if (!project) {
    return res.status(404).send(`
      <div style="text-align:center; padding: 50px; font-family: sans-serif;">
        <h1>404 - Página no encontrada</h1>
        <p>El enlace que buscas no existe o ha sido desactivado.</p>
      </div>
    `);
  }

  const html = project.html || "<h1>Aún no hay contenido</h1>";
  const css = project.css || "";

  // ¡SORPRESA PARA EL JEFE! Un badge inyectado dinámicamente
  const badgeHtml = `
    <div style="position: fixed; bottom: 20px; right: 20px; background: #fff; padding: 10px 15px; border-radius: 50px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); font-family: 'Segoe UI', sans-serif; font-size: 13px; font-weight: bold; color: #333; z-index: 999999; display: flex; align-items: center; gap: 8px; border: 1px solid #eee;">
      <span style="font-size: 16px;">🚀</span> Powered by <strong>Nuestra Plataforma</strong>
    </div>
  `;

  res.send(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${project.name}</title>
    <style>${css}</style>
  </head>
  <body>
    ${html}
    ${badgeHtml}
  </body>
</html>`);
});

// ── VIDEO FUNNELS (PÚBLICOS) ───────────────────────────────────────────────

// Landing del funnel con video y CTA bloqueado
app.get("/f/:slug", async (req, res) => {
  const funnel = await db.getFunnelBySlug(req.params.slug);
  if (!funnel) {
    return res.status(404).send(`
      <div style="text-align:center; padding: 50px; font-family: sans-serif;">
        <h1>404 - Funnel no encontrado</h1>
        <p>El enlace que buscas no existe o ha sido desactivado.</p>
      </div>
    `);
  }
  res.send(renderFunnelLanding({ ...funnel, form_fields: funnel.form_fields ? JSON.parse(funnel.form_fields) : [] }));
});

// Formulario del funnel (se muestra al desbloquear el CTA)
app.get("/f/:slug/form", async (req, res) => {
  const funnel = await db.getFunnelBySlug(req.params.slug);
  if (!funnel) {
    return res.status(404).send(`
      <div style="text-align:center; padding: 50px; font-family: sans-serif;">
        <h1>404 - Funnel no encontrado</h1>
        <p>El enlace que buscas no existe o ha sido desactivado.</p>
      </div>
    `);
  }
  res.send(renderFunnelForm({ ...funnel, form_fields: funnel.form_fields ? JSON.parse(funnel.form_fields) : [] }));
});

// ── CATCH-ALL PARA EL ROUTER DEL FRONTEND ─────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// ── START ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Backend corriendo en http://localhost:${PORT}`);
  console.log(`   Endpoints disponibles:`);
  console.log(`   GET  /api/clients`);
  console.log(`   GET  /api/projects?client_id=X`);
  console.log(`   POST /api/projects`);
  console.log(`   GET  /api/projects/:id?client_id=X`);
  console.log(`   PUT  /api/projects/:id`);
  console.log(`   GET  /api/templates`);
  console.log(`   ── Video Funnels ──`);
  console.log(`   GET  /api/funnels?client_id=X`);
  console.log(`   POST /api/funnels`);
  console.log(`   GET  /api/funnels/:id`);
  console.log(`   PUT  /api/funnels/:id`);
  console.log(`   PUT  /api/funnels/:id/publish`);
  console.log(`   DEL  /api/funnels/:id`);
  console.log(`   POST /api/funnels/:id/leads`);
  console.log(`   GET  /api/funnels/:id/leads?client_id=X`);
  console.log(`   GET  /api/funnels/:id/leads/export?client_id=X`);
  console.log(`   ── Páginas públicas ──`);
  console.log(`   GET  /p/:slug   (landing page)`);
  console.log(`   GET  /f/:slug   (video funnel)`);
  console.log(`   GET  /f/:slug/form\n`);
});
