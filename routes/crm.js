const express = require("express");
const router = express.Router();
const kiuflowService = require("../services/kiuflowService");

// GET /api/crm/channels
router.get("/channels", async (req, res) => {
  try {
    const subIdToUse = req.query.sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
    const channels = await kiuflowService.getChannels(subIdToUse);
    //console.log("CANALES RAW:", JSON.stringify(channels[0], null, 2));
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
    //console.log("TEMPLATES RAW:", JSON.stringify(templates, null, 2));
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
    const agents = await kiuflowService.getAgents(subIdToUse);
    if (!agents || agents.length === 0)
      return res.status(400).json({ error: "No hay agentes disponibles" });
    const agentId = String(agents[0].id);

    const result = await kiuflowService.createAppointment({
      clientId: String(clientId),
      agentId,
      date,
      confirmed: "true",
      attended: "false",
    }, subIdToUse);

    // Crear Recordatorios de cita R2, R3, R4 según flujo definido
    if (funnelId) {
      try {
        const funnel = await kiuflowService.getWebpage(funnelId, subIdToUse);
        const reminders = funnel?.jsonData?.reminders || [];
        const citaDate = new Date(date);
        const ahora = new Date();
        const msHastaCita = citaDate - ahora;

        const offsets = [
          msHastaCita - 24 * 3600000, // R2: 24h antes
          msHastaCita - 3 * 3600000, // R3: 3h antes
          msHastaCita - 5 * 60000, // R4: 5 mins antes
        ];

        for (let i = 0; i < offsets.length; i++) {
          const rem = reminders[i + 1]; // R2=index 1, R3=index 2, R4=index 3
          if (!rem || !rem.channelId) continue;
          if (offsets[i] <= 0) continue; // ya pasó ese momento

          const remindAt = new Date(ahora.getTime() + offsets[i]).toISOString();
          try {
            await kiuflowService.createReminder({
              clientId: String(clientId),
              channelId: rem.channelId,
              templateId: rem.templateId || null,
              content: rem.content,
              remindAt,
            }, subIdToUse);
          } catch (err) {
            console.error(`Error creando R${i + 2}:`, err.message);
          }
        }
      } catch (err) {
        console.error("Error creando recordatorios de cita:", err.message);
      }
    }

    res.status(201).json({ ok: true, appointment: result });
  } catch (error) {
    console.error("ERROR APPOINTMENT:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
