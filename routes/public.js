const express = require("express");
const router = express.Router();
const kiuflowService = require("../services/kiuflowService");
const { renderFunnelLanding, renderFunnelForm } = require("../funnel-renderer");

/**
 * Función auxiliar para buscar una página a través de todas las suscripciones
 * disponibles para el administrador actual.
 */
async function findPageAcrossSubscriptions(fullPath, type) {
  try {
    const subs = await kiuflowService.getSuscriptions();
    for (const sub of subs) {
      const pages = await kiuflowService.listWebpages(sub.id);
      const page = pages.find(
        (p) => p.type === type && p.url && p.url.includes(fullPath)
      );
      if (page) {
        return { page, subId: sub.id };
      }
    }
  } catch (err) {
    console.error("Error buscando página en suscripciones:", err);
  }
  return null;
}

// GET /p/* (Landing page tradicional)
router.get("/p/*", async (req, res) => {
  try {
    const fullPath = req.originalUrl;
    
    // Buscar la landing en cualquier suscripción
    const result = await findPageAcrossSubscriptions(fullPath, "LANDING_PAGE");

    if (!result || !result.page) {
      return res.status(404).send("<h1>Landing Page no encontrada</h1>");
    }

    const landing = result.page;


    if (landing.published !== true && landing.published !== "true") {
      return res
        .status(403)
        .send("<h1>Esta p&aacute;gina no est&aacute; publicada</h1>");
    }

    const html = landing.jsonData?.gjs_html || "";
    const css = landing.jsonData?.gjs_css || "";
    const finalHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${landing.name || "Landing"}</title>
          <style>${css}</style>
        </head>
        <body>${html}</body>
      </html>
    `;
    res.send(finalHtml);
  } catch (error) {
    console.error("Error en public landing:", error);
    res.status(500).send("<h1>Error cargando landing</h1>");
  }
});

// GET /f/* (Video Funnel Landing) - excluye rutas que terminan en /form
router.get(/^\/f\/(?!.*\/form$).+/, async (req, res) => {

  try {
    const fullPath = req.originalUrl;
    
    const result = await findPageAcrossSubscriptions(fullPath, "VIDEO_FUNNEL");

    if (!result || !result.page) {
      return res.status(404).send("<h1>Video Funnel no encontrado</h1>");
    }

    const funnelPage = result.page;


    if (funnelPage.published !== true && funnelPage.published !== "true") {
      return res
        .status(403)
        .send("<h1>Este embudo no est&aacute; publicado</h1>");
    }

    const funnel = {
      id: funnelPage.id,
      sub_id: result.subId,
      title: funnelPage.name,
      public_slug:
        funnelPage.url && funnelPage.url.includes("/f/")
          ? funnelPage.url.split("/f/")[1]
          : "",
      ...funnelPage.jsonData,
    };

    const finalHtml = renderFunnelLanding(funnel);
    res.send(finalHtml);
  } catch (error) {
    console.error("Error en public funnel:", error);
    res.status(500).send("<h1>Error cargando funnel</h1>");
  }
});

// GET /f/**/form (Formulario del Funnel - maneja slugs con múltiples segmentos)
router.get(/^\/f\/.+\/form$/, async (req, res) => {
  try {
    const basePath = req.originalUrl.replace("/form", "");
    
    const result = await findPageAcrossSubscriptions(basePath, "VIDEO_FUNNEL");

    if (!result || !result.page) {
      return res.status(404).send("<h1>Formulario no encontrado</h1>");
    }

    const funnelPage = result.page;

    const funnel = {
      id: funnelPage.id,
      sub_id: result.subId,
      title: funnelPage.name,
      public_slug:
        funnelPage.url && funnelPage.url.includes("/f/")
          ? funnelPage.url.split("/f/")[1]
          : "",
      ...funnelPage.jsonData,
    };

    const formHtml = renderFunnelForm(funnel);
    res.send(formHtml);
  } catch (error) {
    console.error("Error en public funnel form:", error);
    res.status(500).send("<h1>Error cargando formulario</h1>");
  }
});

module.exports = router;

