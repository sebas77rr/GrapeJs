const express = require("express");
const router = express.Router();

const kiuflowService = require("../services/kiuflowService");

/**
 * GET /api/funnels
 * Lista todos los Video Funnels. 
 * Extrae el identificador público (`public_slug`) dinámicamente desde la URL del CMS.
 */
router.get("/", async (req, res) => {
  try {
    const subId = req.query.sub_id && req.query.sub_id !== "undefined"
      ? req.query.sub_id
      : process.env.KIUFLOW_SUBSCRIPTION_ID;

    const kfPages = await kiuflowService.listWebpages(subId);

    const videoFunnels = kfPages.filter((p) => p.type === "VIDEO_FUNNEL");

    const funnels = videoFunnels.map((page) => {
      let slug = "";
      if (page.url && page.url.includes("/f/")) {
        slug = page.url.split("/f/")[1];
      }

      return {
        id: page.id,
        title: page.name || "Sin Nombre",
        url: page.url,
        public_slug: slug,
        is_published: page.published === true || page.published === "true" ? 1 : 0,
        created_at: new Date().toISOString(),
        ...(page.jsonData || {}),
      };
    });

    res.json({ funnels });
  } catch (error) {
    console.error("Error al obtener funnels de KiuFlow:", error.message);
    res.status(500).json({ error: "No se pudieron obtener los funnels de KiuFlow" });
  }
});

/**
 * GET /api/funnels/:id
 * Recupera la metadata y el contenido (jsonData) de un Video Funnel específico.
 */
router.get("/:id", async (req, res) => {
  const subIdToUse = req.query.sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
  try {
    const kfPage = await kiuflowService.getWebpage(req.params.id, subIdToUse);
    if (!kfPage || kfPage.type !== "VIDEO_FUNNEL") {
      return res.status(404).json({ error: "Funnel no encontrado en KiuFlow" });
    }

    let slug = "";
    if (kfPage.url && kfPage.url.includes("/f/")) {
      slug = kfPage.url.split("/f/")[1];
    }

    const funnel = {
      id: kfPage.id,
      title: kfPage.name,
      url: kfPage.url,
      public_slug: slug,
      is_published: (kfPage.published === true || kfPage.published === "true") ? 1 : 0,
      ...(kfPage.jsonData || {}),
    };

    res.json({ funnel });
  } catch (error) {
    console.error("Error al obtener funnel:", error.message);
    res.status(500).json({ error: "No se pudo obtener el funnel" });
  }
});

/**
 * POST /api/funnels
 * Registra un nuevo Video Funnel en KiuFlow.
 * Asigna una URL pública generada localmente y estado borrador por defecto.
 */
router.post("/", async (req, res) => {
  const { title, video_url, sub_id, ...rest } = req.body;
  if (!title) {
    return res.status(400).json({ error: "El título es requerido" });
  }

  const subIdToUse = sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;

  try {
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "funnel";
    const domain = process.env.APP_DOMAIN || "https://builder-api.kiuflow.online";
    const identifier = Date.now().toString(36);

    const pageData = {
      name: title,
      url: `${domain}/f/tmp/${safeTitle}`, // URL temporal
      published: "true",
      type: "VIDEO_FUNNEL",
      origin: process.env.APP_ORIGIN || "KiuFlow",
      jsonData: { video_url: video_url || "", suscription_id: subIdToUse, ...rest },
    };

    const result = await kiuflowService.createWebpage(pageData, subIdToUse);
    const code = result.code || identifier;
    const finalUrl = `${domain}/f/${code}/${safeTitle}`;

    // Actualizar la URL en KiuFlow con el código real
    await kiuflowService.updateWebpage(result.id, { ...pageData, url: finalUrl }, subIdToUse);

    res.status(201).json({
      funnel: {
        id: result.id,
        title,
        video_url,
        url: finalUrl,
        public_slug: `${code}/${safeTitle}`,
        is_published: 1,
        ...rest,
      },
    });
  } catch (error) {
    console.error("Error creando funnel:", error.message);
    res.status(500).json({ error: "Error al crear el funnel en KiuFlow: " + error.message });
  }
});

/**
 * PUT /api/funnels/:id
 * Actualiza la metadata o configuración interna de un Video Funnel 
 * preservando los campos inmutables como la URL.
 */
router.put("/:id", async (req, res) => {
  const { title, sub_id, ...rest } = req.body;
  const subIdToUse = sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
  try {
    const kfPage = await kiuflowService.getWebpage(req.params.id, subIdToUse);

    const pageData = {
      name: title || kfPage.name,
      url: kfPage.url,
      published: kfPage.published,
      type: "VIDEO_FUNNEL",
      origin: kfPage.origin || process.env.APP_ORIGIN || "KiuFlow",
      jsonData: {
        ...(kfPage.jsonData || {}),
        suscription_id: subIdToUse,
        ...rest,
      },
    };

    await kiuflowService.updateWebpage(req.params.id, pageData, subIdToUse);

    const updatedFunnel = {
      id: req.params.id,
      title: pageData.name,
      url: kfPage.url,
      is_published: kfPage.published === true || kfPage.published === "true" ? 1 : 0,
      ...(pageData.jsonData || {}),
    };

    res.json({ ok: true, savedAt: new Date().toISOString(), funnel: updatedFunnel });
  } catch (error) {
    console.error("Error guardando funnel:", error.message);
    res.status(500).json({ error: "Error al guardar el funnel en KiuFlow" });
  }
});

/**
 * PUT /api/funnels/:id/publish
 * Habilita el acceso público al Video Funnel.
 */
router.put("/:id/publish", async (req, res) => {
  const subIdToUse = req.body.sub_id || req.query.sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
  try {
    const kfPage = await kiuflowService.getWebpage(req.params.id, subIdToUse);
    const pageData = {
      name: kfPage.name,
      url: kfPage.url,
      published: "true",
      type: kfPage.type,
      origin: kfPage.origin || process.env.APP_ORIGIN || "KiuFlow",
      jsonData: kfPage.jsonData || {},
    };

    await kiuflowService.updateWebpage(req.params.id, pageData, subIdToUse);
    res.json({ ok: true });
  } catch (error) {
    console.error("Error publicando funnel:", error.message);
    res.status(500).json({ error: "Error al publicar en KiuFlow" });
  }
});

/**
 * PUT /api/funnels/:id/unpublish
 * Cambia el estado del Video Funnel a borrador (inaccesible públicamente).
 */
router.put("/:id/unpublish", async (req, res) => {
  const subIdToUse = req.body.sub_id || req.query.sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
  try {
    const kfPage = await kiuflowService.getWebpage(req.params.id, subIdToUse);
    const pageData = {
      name: kfPage.name,
      url: kfPage.url,
      published: "false",
      type: kfPage.type,
      origin: kfPage.origin || process.env.APP_ORIGIN || "KiuFlow",
      jsonData: kfPage.jsonData || {},
    };
    await kiuflowService.updateWebpage(req.params.id, pageData, subIdToUse);
    res.json({ ok: true });
  } catch (error) {
    console.error("Error despublicando funnel:", error.message);
    res.status(500).json({ error: "Error al despublicar en KiuFlow" });
  }
});

/**
 * DELETE /api/funnels/:id
 * Elimina permanentemente el Video Funnel del repositorio.
 */
router.delete("/:id", async (req, res) => {
  const subIdToUse = req.query.sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
  try {
    await kiuflowService.deleteWebpage(req.params.id, subIdToUse);
    res.json({ ok: true });
  } catch (error) {
    console.error("Error eliminando funnel:", error.message);
    res.status(500).json({ error: "Error al eliminar en KiuFlow" });
  }
});

module.exports = router;