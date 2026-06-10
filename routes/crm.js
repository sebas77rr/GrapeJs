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

    const validDateObj = new Date(date);
    if (isNaN(validDateObj.getTime())) {
      throw new Error("Fecha invalida enviada desde el frontend");
    }
    
    // El frontend envia "YYYY-MM-DDTHH:mm:ss" sin zona horaria.
    // Si usamos .toISOString(), el servidor Node (que puede estar en UTC) moverá las horas.
    // Para respetar la zona horaria local de KiuFlow, enviamos la cadena tal cual.
    const localStartDateStr = date; 
    
    // Calcular endDate sumando 30 mins
    const endObj = new Date(validDateObj.getTime() + 30 * 60000);
    const pad = (n) => n.toString().padStart(2, '0');
    const localEndDateStr = `${endObj.getFullYear()}-${pad(endObj.getMonth()+1)}-${pad(endObj.getDate())}T${pad(endObj.getHours())}:${pad(endObj.getMinutes())}:00`;

    const apptData = {
      clientId: String(clientId),
      date: localStartDateStr,
      startDate: localStartDateStr,
      start: localStartDateStr,
      endDate: localEndDateStr,
      end: localEndDateStr,
      confirmed: "true",
      attended: "false",
      virtual: "true",
    };
    if (agentId) apptData.agentId = agentId;

    const resultRes = await axios.post(`${API_URL}/api/v1/suscription/${subIdToUse}/appointment/create`, apptData, { headers: authHeaders });
    if (!resultRes.data.success) throw new Error(resultRes.data.message);
    const result = resultRes.data.data;

    // Crear Recordatorios de cita R2, R3, R4 según flujo definido
    const { reminders } = req.body;
    if (Array.isArray(reminders)) {
      try {
        const citaDate = new Date(date); // Fecha local tal como llegó
        
        const offsets = [
          24 * 3600000, // R2: 24h antes
          3 * 3600000,  // R3: 3h antes
          5 * 60000,    // R4: 5 mins antes
        ];

        const pad = (n) => n.toString().padStart(2, '0');

        for (let i = 0; i < offsets.length; i++) {
          const rem = reminders[i + 1]; // R2=index 1, R3=index 2, R4=index 3
          if (!rem || !rem.channelId) continue;

          // Restamos el offset directamente a la fecha local de la cita
          const remDate = new Date(citaDate.getTime() - offsets[i]);
          
          // Formateamos como "YYYY-MM-DDTHH:mm:ss" sin la Z para que KiuFlow use su zona horaria
          const remindAt = `${remDate.getFullYear()}-${pad(remDate.getMonth()+1)}-${pad(remDate.getDate())}T${pad(remDate.getHours())}:${pad(remDate.getMinutes())}:00`;
          
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

    res.status(201).json({ ok: true, appointment: result });
  } catch (error) {
    console.error("ERROR APPOINTMENT:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
