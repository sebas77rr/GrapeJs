const express = require("express");
const cors = require("cors");
const path = require("path");
const { renderFunnelLanding, renderFunnelForm } = require("./funnel-renderer");
const { AsyncLocalStorage } = require('async_hooks');

const app = express();
const PORT = 3001;

const asyncLocalStorage = new AsyncLocalStorage();
module.exports.asyncLocalStorage = asyncLocalStorage;

// Middlewares básicos
// Permitir orígenes configurables en producción, fallback a * en dev
app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Inyectar el token en el contexto de la petición
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }
  asyncLocalStorage.run(token, () => {
    next();
  });
});

// ─────────────────────────────────────────────
// Endpoints de autenticación SSO
// ─────────────────────────────────────────────

/**
 * POST /api/auth/set-token
 * Compatibilidad hacia atrás: El frontend guarda el token localmente ahora.
 */
app.post("/api/auth/set-token", (req, res) => {
  res.json({ ok: true, message: "Token registrado localmente en el cliente" });
});

/**
 * POST /api/auth/logout
 * Compatibilidad hacia atrás: El frontend limpia su propio token ahora.
 */
app.post("/api/auth/logout", (req, res) => {
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
    } catch (e) {
      // Silenciar error si la suscripción no tiene admins o no se encontró
    }

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
      role: s.userRoles?.propietary ? "Propietario" 
          : s.userRoles?.admin ? "Admin" 
          : s.userRoles?.agent ? "Agente" 
          : "Cliente"
    }));

    res.json({ subscriptions: result });
  } catch (error) {
    res.json({ subscriptions: [], error: error.message });
  }
});

app.get("/api/kiuflow/user-settings", async (req, res) => {
  try {
    const { getValidToken } = require("./services/kiuflowAuth");
    const axios = require("axios");
    const token = await getValidToken();
    const apiUrl = process.env.KIUFLOW_API_URL?.replace(/\/api\/v1\/?$/, "") || "https://apiengine.kiuflow.online";
    const response = await axios.post(`${apiUrl}/api/v1/user/settings`, {}, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    });
    const data = response.data?.data || {};
    res.json(data);
  } catch (error) {
    res.json({ theme_colorTheme: "pink" });
  }
});


/**
 * Catch-all Handler (Single Page Application fallback)
 * Solo actúa si el frontend está en la misma máquina que el backend.
 * En producción, el frontend corre como servidor separado, así que
 * este handler simplemente devuelve 404 en vez de tirar un error ENOENT.
 */
app.get("*", (req, res) => {
  const indexPath = path.join(__dirname, "../frontend/dist/index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      // Frontend no está en esta máquina (entorno producción separado)
      res.status(404).json({ error: "Not found" });
    }
  });
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
