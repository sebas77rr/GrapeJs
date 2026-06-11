const express = require("express");
const router = express.Router();
const kiuflowService = require("../services/kiuflowService");

// GET /api/crm/channels
router.get("/channels", async (req, res) => {
  try {
    const subIdToUse = req.query.sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
    const channels = await kiuflowService.getChannels(subIdToUse);
    // solo canales WhatsApp
    const whatsappChannels = channels.filter(
      (c) => c.type?.name === "WhatsApp",
    );

    res.json({ channels: whatsappChannels });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/crm/templates
router.get("/templates", async (req, res) => {
  try {
    const { channelId, sub_id } = req.query;
    if (!channelId) {
      return res.status(400).json({ error: "channelId es requerido" });
    }
    const subIdToUse = sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
    const templates = await kiuflowService.getTemplates(channelId, subIdToUse);
    res.json({ templates });
  } catch (error) {
    console.error("ERROR templates:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/crm/files
router.get("/files", async (req, res) => {
  try {
    // Si no se pasa directoryId, Usara el 85 por defecto
    const directoryId = req.query.directoryId
      ? Number(req.query.directoryId)
      : 85;
    const subIdToUse = req.query.sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
    const filesResponse = await kiuflowService.getFiles(directoryId, subIdToUse);

    const files = filesResponse.map((f) => ({
      ...f,
      url: `https://storage.googleapis.com/kiuflow/FJjQzdTc4EfU6ppKTtS2/${f.fileName}`,
    }));

    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

// POST /api/crm/appointment
router.post("/appointment", async (req, res) => {
  try {
    const { clientId, date, funnelId, sub_id } = req.body;
    if (!clientId || !date)
      return res.status(400).json({ error: "clientId y date son requeridos" });

    const subIdToUse = sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
    const API_URL = process.env.KIUFLOW_API_URL || "https://apiengine.kiuflow.online";
    const axios = require("axios");
    const authHeaders = {
      'Authorization': req.headers.authorization || "",
      'Content-Type': 'application/json'
    };

    let agentId = "";
    try {
      const agentsRes = await axios.post(`${API_URL}/api/v1/suscription/${subIdToUse}/agent/list`, {}, { headers: authHeaders });
      const agents = agentsRes.data?.data || [];
      if (agents.length > 0) agentId = String(agents[0].id);
    } catch (e) {
      console.warn("No se pudieron obtener agentes, se enviará vacío", e.message);
    }

    // Extraer la fecha y hora cruda (ej: "2026-07-09T14:00:00") descartando el timezone
    const localStr = date.substring(0, 19);
    
    // Crear un objeto Date tratando la fecha local como si fuera UTC para poder manipularla sin desfase de servidor
    const fakeUtcObj = new Date(localStr + "Z");
    if (isNaN(fakeUtcObj.getTime())) {
      throw new Error("Fecha invalida enviada desde el frontend");
    }
    
    // Formato que espera KiuFlow (los numeros de la hora local con la Z pegada)
    const isoDate = fakeUtcObj.toISOString();
    
    // Calcular endDate sumando 30 mins a nuestro fake UTC
    const endObj = new Date(fakeUtcObj.getTime() + 30 * 60000);
    const endIsoDate = endObj.toISOString();

    const apptData = {
      clientId: String(clientId),
      date: isoDate,
      startDate: isoDate,
      start: isoDate,
      endDate: endIsoDate,
      end: endIsoDate,
      confirmed: "true",
      attended: "false",
      virtual: "true",
    };
    if (agentId) apptData.agentId = agentId;

    const resultRes = await axios.post(`${API_URL}/api/v1/suscription/${subIdToUse}/appointment/create`, apptData, { headers: authHeaders });
    if (!resultRes.data.success) throw new Error(resultRes.data.message);
    const result = resultRes.data.data;

    // Crear Recordatorios de cita R2, R3, R4 según flujo definido
    const { reminders, surveyId, surveyChannelId } = req.body;
    if (Array.isArray(reminders)) {
      try {
        // R1: Confirmación inmediata (index 0)
        const rem1 = reminders[0];
        if (rem1 && rem1.channelId) {
          try {
            await axios.post(`${API_URL}/api/v1/suscription/${subIdToUse}/appointment/reminders/create`, {
              clientId: String(clientId),
              channelId: rem1.channelId,
              templateId: rem1.templateId || null,
              content: rem1.content,
              remindAt: new Date().toISOString(), // Inmediato (Ahora)
            }, { headers: authHeaders });
          } catch (err) {
            console.error("Error creando R1 (Inmediato):", err.message);
          }
        }

        const offsets = [
          24 * 3600000, // R2: 24h antes
          3 * 3600000,  // R3: 3h antes
          5 * 60000,    // R4: 5 mins antes
        ];

        for (let i = 0; i < offsets.length; i++) {
          const rem = reminders[i + 1]; // R2=index 1, R3=index 2, R4=index 3
          if (!rem || !rem.channelId) continue;

          // Restamos el offset directamente al fake UTC
          const remDate = new Date(fakeUtcObj.getTime() - offsets[i]);
          const remindAt = remDate.toISOString();
          
          try {
            await axios.post(`${API_URL}/api/v1/suscription/${subIdToUse}/appointment/reminders/create`, {
              clientId: String(clientId),
              channelId: rem.channelId,
              templateId: rem.templateId || null,
              content: rem.content,
              remindAt,
            }, { headers: authHeaders });
          } catch (err) {
            console.error(`Error creando R${i + 2}:`, err.message);
          }
        }
      } catch (err) {
        console.error("Error creando recordatorios de cita:", err.message);
      }
    }

    // ── Recordatorio de Encuesta Post-Cita (1 hora después de endDate) ──
    if (surveyId && surveyChannelId) {
      try {
        const domain = process.env.APP_DOMAIN || 'https://builder.kiuflow.online';
        const surveyUrl = `${domain}/s/${surveyId}?client=${clientId}&sub=${subIdToUse}`;
        const surveyMessage = `¡Hola! Esperamos que tu sesión haya sido excelente. ¿Nos regalas 2 minutos para contarnos cómo te fue? Tu opinión nos ayuda a mejorar cada día 🙏\n\n👉 ${surveyUrl}`;

        // Disparar 1 hora después de que termine la cita
        const surveyRemindAt = new Date(endObj.getTime() + 60 * 60000).toISOString();

        await axios.post(
          `${API_URL}/api/v1/suscription/${subIdToUse}/reminder/create`,
          {
            clientId: String(clientId),
            channelId: surveyChannelId,
            content: surveyMessage,
            remindAt: surveyRemindAt,
          },
          { headers: authHeaders }
        );

        console.log(`✅ Survey reminder scheduled for client ${clientId} at ${surveyRemindAt}`);
      } catch (surveyErr) {
        // No bloqueamos la respuesta si falla el recordatorio de encuesta
        console.error('Error creando recordatorio de encuesta:', surveyErr.message);
      }
    }

    res.status(201).json({ ok: true, appointment: result });
  } catch (error) {
    console.error("ERROR APPOINTMENT:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/crm/surveys
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

// GET /api/crm/surveys/:id/questions
router.get("/surveys/:id/questions", async (req, res) => {
  try {
    const { id } = req.params;
    const subIdToUse = req.query.sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
    const questions = await kiuflowService.getSurveyQuestions(id, subIdToUse);
    res.json({ questions });
  } catch (error) {
    console.error("ERROR survey questions:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
