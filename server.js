const express = require("express");
const cors = require("cors");
const path = require("path");
const { renderFunnelLanding, renderFunnelForm } = require("./funnel-renderer");

const app = express();
const PORT = 3001;

// Middlewares básicos
app.use(cors()); // Permitir todos los orígenes para no bloquear peticiones desde el frontend en producción
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ─────────────────────────────────────────────
// Endpoints de autenticación SSO
// ─────────────────────────────────────────────

/**
 * POST /api/auth/set-token
 * El frontend llama a este endpoint al recibir el token de KiuFlow via URL param.
 * Almacena el JWT del usuario y lo usa para todas las llamadas a la API de KiuFlow.
 */
app.post("/api/auth/set-token", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token requerido" });
  
  try {
    const { setExternalToken } = require("./services/kiuflowAuth");
    setExternalToken(token);
    res.json({ ok: true, message: "Token registrado correctamente" });
  } catch (e) {
    res.status(500).json({ error: "Error al registrar token" });
  }
});

/**
 * POST /api/auth/logout
 * Limpia el token externo (cuando el usuario cierra sesión en KiuFlow)
 */
app.post("/api/auth/logout", (req, res) => {
  const { clearExternalToken } = require("./services/kiuflowAuth");
  clearExternalToken();
  res.json({ ok: true });
});

// Rutas
app.use("/api/clients", require("./routes/clients"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/templates", require("./routes/templates"));
app.use("/api/funnels", require("./routes/funnels"));
app.use("/api/funnels", require("./routes/leads"));
app.use("/api/crm", require("./routes/crm"));

/**
 * Interceptores de SSR (Server-Side Rendering)
 * Manejan las rutas públicas compartidas para inyectar dinámicamente
 * el código HTML y CSS almacenado en el CRM.
 */
app.use("/", require("./routes/public"));

// Ruta para estado de KiuFlow
app.get("/api/kiuflow/status", async (req, res) => {
  try {
    const kiuflowService = require("./services/kiuflowService");
    const { getValidToken } = require("./services/kiuflowAuth");

    const subs = await kiuflowService.getSuscriptions();
    const subId = Number(process.env.KIUFLOW_SUBSCRIPTION_ID) || 117;
    const mySub = subs.find((s) => s.id === subId) || subs[0];

    const token = await getValidToken();
    let userId = "Desconocido";
    let userName = "Admin";
    let userRole = "Admin (API)";

    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString(),
      );
      userId = payload.userId || payload.sub || "Admin";

      /**
       * Obtención de perfil del usuario logueado.
       * Cruza el identificador del token JWT con la lista de admins
       * para determinar el nombre real y el rol dentro de la suscripción.
       */
      const admins = await kiuflowService.getAdmins(subId);
      const myAdmin = admins.find((a) => a.user && a.user.id === userId);
      if (myAdmin) {
        userName = myAdmin.user.name || myAdmin.name || "Admin";
        userRole = myAdmin.propietary ? "Propietario" : "Admin";
      }
    } catch (e) {}

    res.json({
      connected: true,
      subscription: mySub ? mySub.name : "Suscripción Desconocida",
      user: {
        id: userId,
        name: userName,
        role: userRole,
      },
    });
  } catch (error) {
    res.json({ connected: false, error: error.message });
  }
});
// Servir frontend estático de React
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.get("/api/kiuflow/subscriptions", async (req, res) => {
  try {
    const kiuflowService = require("./services/kiuflowService");
    const subs = await kiuflowService.getSuscriptions();
    
    const result = subs.map(s => ({
      id: s.id,
      name: s.name,
      role: s.userRoles.propietary ? "Propietario" 
          : s.userRoles.admin ? "Admin" 
          : s.userRoles.agent ? "Agente" 
          : "Cliente"
    }));

    res.json({ subscriptions: result });
  } catch (error) {
    res.json({ subscriptions: [], error: error.message });
  }
});

/**
 * Catch-all Handler (Single Page Application fallback)
 * Redirige cualquier petición no capturada hacia la app de React estática.
 */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// Arrancar server
app.listen(PORT, "0.0.0.0", () => {
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
