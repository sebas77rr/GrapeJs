const express = require("express");
const router = express.Router();
const axios = require("axios");
const kiuflowService = require("../services/kiuflowService");
const { getValidToken } = require("../services/kiuflowAuth");

// ──────────────────────────────────────────────────────────
// GET /api/crm/channels
// ──────────────────────────────────────────────────────────
router.get("/channels", async (req, res) => {
  try {
    const subIdToUse = req.query.sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
    const channels = await kiuflowService.getChannels(subIdToUse);
    const whatsappChannels = channels.filter(c => c.type?.name === "WhatsApp");
    res.json({ channels: whatsappChannels });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/crm/templates
// ──────────────────────────────────────────────────────────
router.get("/templates", async (req, res) => {
  try {
    const { channelId, sub_id } = req.query;
    if (!channelId) return res.status(400).json({ error: "channelId es requerido" });
    const subIdToUse = sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
    const templates = await kiuflowService.getTemplates(channelId, subIdToUse);
    res.json({ templates });
  } catch (error) {
    console.error("ERROR templates:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/crm/files
// ──────────────────────────────────────────────────────────
router.get("/files", async (req, res) => {
  try {
    const directoryId = req.query.directoryId ? Number(req.query.directoryId) : 85;
    const subIdToUse = req.query.sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
    const filesResponse = await kiuflowService.getFiles(directoryId, subIdToUse);
    const files = filesResponse.map(f => ({
      ...f,
      url: `https://storage.googleapis.com/kiuflow/${process.env.GCS_BUCKET_PATH || "FJjQzdTc4EfU6ppKTtS2"}/${f.fileName}`,
    }));
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/crm/availability
// ──────────────────────────────────────────────────────────
router.get("/availability", async (req, res) => {
  try {
    const { date, sub_id } = req.query;
    if (!date) return res.status(400).json({ error: "date es requerido" });
    const subIdToUse = sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
    const slots = await kiuflowService.getAvailability(date, subIdToUse);
    res.json({ slots });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/crm/appointment
// Crea una cita y programa los 4 recordatorios de WhatsApp
// (R1 inmediato, R2 24h antes, R3 3h antes, R4 5 min antes)
// más el R5 de encuesta post-cita (1h después de endDate).
// ──────────────────────────────────────────────────────────
router.post("/appointment", async (req, res) => {
  try {
    const { clientId, date, funnelId, sub_id, reminders, surveyId, surveyChannelId } = req.body;
    if (!clientId || !date) {
      return res.status(400).json({ error: "clientId y date son requeridos" });
    }

    const subIdToUse = sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
    const API_URL = process.env.KIUFLOW_API_URL || "https://apiengine.kiuflow.online";

    // Token: primero el del usuario (SSO desde el Builder), luego el de servicio
    const authToken = req.headers.authorization || `Bearer ${await getValidToken()}`;
    const authHeaders = { Authorization: authToken, "Content-Type": "application/json" };

    // Obtener agente disponible para asignarlo a la cita
    let agentId = "";
    try {
      const agentsRes = await axios.post(
        `${API_URL}/api/v1/suscription/${subIdToUse}/agent/list`,
        {},
        { headers: authHeaders }
      );
      agentId = String(agentsRes.data?.data?.[0]?.id || "");
    } catch (e) {
      console.warn("No se pudieron obtener agentes:", e.message);
    }

    const startObj = new Date(date);
    if (isNaN(startObj.getTime())) throw new Error("Fecha inválida recibida desde el frontend");
    const endObj = new Date(startObj.getTime() + 30 * 60000);

    // Crear la cita
    const apptData = {
      clientId: String(clientId),
      date: startObj.toISOString(),
      startDate: startObj.toISOString(),
      start: startObj.toISOString(),
      endDate: endObj.toISOString(),
      end: endObj.toISOString(),
      confirmed: "true",
      attended: "false",
      virtual: "true",
      ...(agentId && { agentId }),
    };

    const resultRes = await axios.post(
      `${API_URL}/api/v1/suscription/${subIdToUse}/appointment/create`,
      apptData,
      { headers: authHeaders }
    );
    if (!resultRes.data.success) throw new Error(resultRes.data.message);
    const appointment = resultRes.data.data;

    // ── Recordatorios R1–R4 (solo si el Funnel los tiene configurados) ──
    if (Array.isArray(reminders)) {
      // R1: Confirmación inmediata al agendar
      const rem1 = reminders[0];
      if (rem1?.channelId) {
        try {
          const r1RemindAt = new Date(Date.now() + 10000).toISOString();
          await axios.post(
            `${API_URL}/api/v1/suscription/${subIdToUse}/appointment/reminders/create`,
            { clientId: String(clientId), channelId: rem1.channelId, templateId: rem1.templateId || null, content: rem1.content, remindAt: r1RemindAt },
            { headers: authHeaders }
          );
        } catch (err) { console.error("Error creando R1:", err.message); }
      }

      // R2 (24h antes), R3 (3h antes), R4 (5 min antes)
      const OFFSETS = [24 * 3600000, 3 * 3600000, 5 * 60000];
      for (let i = 0; i < OFFSETS.length; i++) {
        const rem = reminders[i + 1];
        if (!rem?.channelId) continue;
        const remindAt = new Date(startObj.getTime() - OFFSETS[i]).toISOString();
        try {
          await axios.post(
            `${API_URL}/api/v1/suscription/${subIdToUse}/appointment/reminders/create`,
            { clientId: String(clientId), channelId: rem.channelId, templateId: rem.templateId || null, content: rem.content, remindAt },
            { headers: authHeaders }
          );
        } catch (err) { console.error(`Error creando R${i + 2}:`, err.message); }
      }
    }

    // ── R5: Recordatorio de Encuesta post-cita (1h después de que termina la cita) ──
    // La URL solo lleva el fid (ID del Funnel). El servidor extrae logo/color internamente
    // al renderizar la encuesta, sin exponer datos sensibles en la URL.
    if (surveyId && surveyChannelId && funnelId) {
      try {
        const domain = process.env.APP_DOMAIN || "https://builder.kiuflow.online";
        const surveyUrl = `${domain}/s/${surveyId}?client=${clientId}&sub=${subIdToUse}&fid=${funnelId}`;
        const surveyMessage = `¡Hola! Esperamos que tu sesión haya sido excelente. ¿Nos regalas 2 minutos para contarnos cómo te fue? Tu opinión nos ayuda a mejorar cada día 🙏\n\n👉 ${surveyUrl}`;
        const r5RemindAt = new Date(endObj.getTime() + 60 * 60000).toISOString();

        await axios.post(
          `${API_URL}/api/v1/suscription/${subIdToUse}/appointment/reminders/create`,
          { clientId: String(clientId), channelId: surveyChannelId, content: surveyMessage, remindAt: r5RemindAt },
          { headers: authHeaders }
        );
        console.log(`✅ R5 (encuesta) programado para el cliente ${clientId} a las ${r5RemindAt}`);
      } catch (surveyErr) {
        console.error("Error creando R5 (encuesta):", surveyErr.message);
      }
    }

    res.status(201).json({ ok: true, appointment });
  } catch (error) {
    console.error("ERROR APPOINTMENT:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/crm/surveys
// ──────────────────────────────────────────────────────────
router.get("/surveys", async (req, res) => {
  try {
    const subIdToUse = req.query.sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
    const surveys = await kiuflowService.getSurveys(subIdToUse);
    res.json({ surveys });
  } catch (error) {
    console.error("ERROR surveys:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/crm/surveys/:id/questions
// ──────────────────────────────────────────────────────────
router.get("/surveys/:id/questions", async (req, res) => {
  try {
    const subIdToUse = req.query.sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
    const questions = await kiuflowService.getSurveyQuestions(req.params.id, subIdToUse);
    res.json({ questions });
  } catch (error) {
    console.error("ERROR survey questions:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
