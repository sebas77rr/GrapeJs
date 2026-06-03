const express = require("express");
const router = express.Router();

const kiuflowService = require("../services/kiuflowService");

// GET /api/projects?client_id=X
router.get("/", async (req, res) => {
  try {
    const subId = req.query.sub_id && req.query.sub_id !== "undefined"
      ? req.query.sub_id
      : process.env.KIUFLOW_SUBSCRIPTION_ID;

    const kfPages = await kiuflowService.listWebpages(subId);
    
    /**
     * Filtrar los registros traídos del backend para aislar
     * únicamente los correspondientes al módulo de Landing Pages.
     */
    const landingPages = kfPages.filter(p => p.type === "LANDING_PAGE");

    const projects = landingPages.map(p => ({
      id: p.id,
      name: p.name || "Sin Nombre",
      client_id: "kiuflow_user",
      template_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      json_data: p.jsonData || null,
      html: p.jsonData?.gjs_html || "",
      css: p.jsonData?.gjs_css || "",
      url: p.url || ""
    }));

    res.json({ projects, used: projects.length, max: 999 });
  } catch (error) {
    console.error("Error obteniendo proyectos de KiuFlow:", error.message);
    res.status(500).json({ error: "Error conectando con KiuFlow" });
  }
});

// GET /api/projects/:id
router.get("/:id", async (req, res) => {
  try {
    const subIdToUse = req.query.sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
    const kfPage = await kiuflowService.getWebpage(req.params.id, subIdToUse);
    if (!kfPage) return res.status(404).json({ error: "Proyecto no encontrado" });

    const project = {
      id: kfPage.id,
      name: kfPage.name,
      client_id: "kiuflow_user",
      json_data: kfPage.jsonData?.gjs_components || null,
      html: kfPage.jsonData?.gjs_html || "<h1>Aún no hay contenido</h1>",
      css: kfPage.jsonData?.gjs_css || ""
    };
    
    res.json({ project });
  } catch(error) {
    console.error("Error obteniendo proyecto:", error.message);
    res.status(500).json({ error: "Error conectando con KiuFlow" });
  }
});

// POST /api/projects
router.post("/", async (req, res) => {
  const { name, template_id, sub_id } = req.body;
  if (!name) return res.status(400).json({ error: "name es requerido" });

  const subIdToUse = sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;

  try {
    const kfPages = await kiuflowService.listWebpages(subIdToUse);
    const count = kfPages.filter(p => p.type === "LANDING_PAGE").length;
    
    /**
     * Validación de cuota/límites:
     * Verifica que el número de páginas no exceda el límite definido en la suscripción.
     */
    if (count >= 999) {
      return res.status(403).json({
        error: "LIMIT_REACHED",
        message: "Límite de landings alcanzado."
      });
    }

    const safeName = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'landing';
    const domain = process.env.APP_DOMAIN || "https://builder-api.kiuflow.online";
    const identifier = Date.now().toString(36);
    const finalUrl = `${domain}/p/${identifier}/${safeName}`;

    /**
     * Ensamblado del Payload (WebPage):
     * KiuFlow requiere el campo 'origin' para la métrica,
     * y empaqueta la metadata (html, css) dentro del nodo jsonData.
     */
    const pageData = {
      name: name,
      url: finalUrl,
      published: "true",
      type: "LANDING_PAGE",
      origin: process.env.APP_ORIGIN || "KiuFlow",
      jsonData: {
        gjs_html: "",
        gjs_css: "",
        template_id: template_id || ""
      }
    };

    const kfResponse = await kiuflowService.createWebpage(pageData, subIdToUse);

    const project = {
      id: kfResponse.id || kfResponse.pageId || Date.now(),
      name: name,
      client_id: "kiuflow_user",
      json_data: pageData.jsonData.gjs_components || null,
      html: "",
      css: ""
    };

    res.status(201).json({ project });
  } catch (error) {
    console.error("Error creando landing en KiuFlow:", error.message);
    res.status(500).json({ error: "No se pudo crear en KiuFlow" });
  }
});

// GET /api/projects/:id/preview
router.get("/:id/preview", async (req, res) => {
  const subIdToUse = req.query.sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
  try {
    const kfPage = await kiuflowService.getWebpage(req.params.id, subIdToUse);
    if (!kfPage) return res.status(404).send("Proyecto no encontrado");

    const html = kfPage.jsonData?.gjs_html || "<h1>Aún no hay contenido</h1>";
    const css = kfPage.jsonData?.gjs_css || "";

    res.send(`<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"><title>${kfPage.name}</title><style>${css}</style></head>
  <body>${html}</body>
</html>`);
  } catch(error) {
    res.status(500).send("Error conectando con KiuFlow");
  }
});

// PUT /api/projects/:id
router.put("/:id", async (req, res) => {
  const { json_data, html, css, name, sub_id } = req.body;
  const subIdToUse = sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
  
  try {
    /**
     * Preservación del Estado:
     * Obtenemos la versión actual desde KiuFlow antes de actualizar 
     * para no sobreescribir la URL ni las configuraciones ajenas a GrapesJS.
     */
    const kfPage = await kiuflowService.getWebpage(req.params.id, subIdToUse);
    if (!kfPage) return res.status(404).json({ error: "Proyecto no encontrado en KiuFlow" });

    /**
     * Payload de Actualización Parcial:
     * Merge del JSONData existente con los nuevos componentes, HTML y CSS.
     */
    const pageData = {
      name: name || kfPage.name,
      url: kfPage.url,
      published: "true",
      type: "LANDING_PAGE",
      origin: process.env.APP_ORIGIN || "KiuFlow",
      jsonData: {
        ...(kfPage.jsonData || {}),
        gjs_html: html !== undefined ? html : kfPage.jsonData?.gjs_html,
        gjs_css: css !== undefined ? css : kfPage.jsonData?.gjs_css,
        gjs_components: json_data !== undefined ? json_data : kfPage.jsonData?.gjs_components
      }
    };

    await kiuflowService.updateWebpage(req.params.id, pageData, subIdToUse);
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch(error) {
    console.error("Error guardando proyecto:", error.message);
    res.status(500).json({ error: "Error al guardar en KiuFlow" });
  }
});

// DELETE /api/projects/:id
router.delete("/:id", async (req, res) => {
  const subIdToUse = req.query.sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
  try {
    await kiuflowService.deleteWebpage(req.params.id, subIdToUse);
    res.json({ ok: true });
  } catch(error) {
    console.error("Error eliminando:", error.message);
    res.status(500).json({ error: "Error al eliminar en KiuFlow" });
  }
});

module.exports = router;