const express = require("express");
const router = express.Router();
const axios = require("axios");
const kiuflowService = require("../services/kiuflowService");
const { renderFunnelLanding, renderFunnelForm } = require("../funnel-renderer");
const { renderSurveyPage } = require("../survey-renderer");

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const API_URL = process.env.KIUFLOW_API_URL || "https://apiengine.kiuflow.online";

// GET /api/public/appointment
router.get("/api/public/appointment", async (req, res) => {
  try {
    const { client_id, sub_id } = req.query;
    if (!client_id || !sub_id) {
      return res.status(400).json({ error: "Faltan parámetros requeridos" });
    }

    const appointments = await kiuflowService.getAppointments(sub_id);
    if (!appointments || appointments.length === 0) {
      return res.status(404).json({ error: "No se encontraron citas" });
    }

    const now = new Date();
    const clientAppointments = appointments
      .filter((a) => a.client && a.client.id === parseInt(client_id, 10))
      .filter((a) => new Date(a.startDate) >= now || new Date(a.endDate) >= now)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    if (clientAppointments.length === 0) {
      return res.status(404).json({ error: "No tienes citas próximas agendadas" });
    }

    const appt = clientAppointments[0];
    res.json({
      appointment_id: appt.id,
      startDate: appt.startDate,
      endDate: appt.endDate,
      confirmed: appt.confirmed,
    });
  } catch (error) {
    console.error("Error buscando cita pública:", error.message);
    res.status(500).json({ error: "Error al buscar la cita" });
  }
});

// POST /api/public/appointment/cancel
router.post("/api/public/appointment/cancel", async (req, res) => {
  try {
    const { client_id, sub_id, appointment_id } = req.body;
    if (!client_id || !appointment_id || !sub_id) {
      return res.status(400).json({ error: "Faltan parámetros" });
    }

    // Actualizamos la cita en KiuFlow para marcarla como cancelada
    await kiuflowService.updateAppointment(appointment_id, { confirmed: "false" }, sub_id);

    // Intentamos buscar y eliminar todos los recordatorios futuros (R2, R3, R4) 
    // que estén asociados a ese cliente y que aún estén pendientes.
    try {
      const remindersRes = await kiuflowService.getReminders(sub_id);
      const allReminders = Array.isArray(remindersRes) ? remindersRes : (remindersRes.reminders || remindersRes.data || []);
      
      const clientReminders = allReminders.filter(r => 
        String(r.client?.id) === String(client_id) && 
        r.status?.name === "Pendiente"
      );

      for (const r of clientReminders) {
        await kiuflowService.removeReminder(r.id, sub_id);
      }
    } catch (err) {
      console.error("Error al limpiar recordatorios tras cancelar:", err.message);
      // No bloqueamos la respuesta, ya que la cita sí se canceló
    }

    res.json({ ok: true, message: "Cita cancelada correctamente" });
  } catch (error) {
    console.error("Error cancelando cita:", error.message);
    res.status(500).json({ error: "Error al cancelar la cita" });
  }
});

// POST /api/public/appointment/reschedule
router.post("/api/public/appointment/reschedule", async (req, res) => {
  try {
    const { client_id, sub_id, appointment_id, date, funnel_id } = req.body;
    if (!client_id || !appointment_id || !date || !sub_id) {
      return res.status(400).json({ error: "Faltan parámetros" });
    }

    // 1. Update the appointment with the new date
    const newStartDate = new Date(date);
    if (isNaN(newStartDate.getTime())) return res.status(400).json({ error: "Fecha inválida" });
    const endObj = new Date(newStartDate.getTime() + 30 * 60000); // Asumimos 30 min por defecto
    const updatedAppt = await kiuflowService.updateAppointment(appointment_id, { 
      date: new Date(date).toISOString().substring(0, 19),
      startDate: new Date(date).toISOString().substring(0, 19),
      start: new Date(date).toISOString().substring(0, 19),
      endDate: endObj.toISOString().substring(0, 19),
      end: endObj.toISOString().substring(0, 19),
      confirmed: "true" 
    }, sub_id);

    // 2. Fetch all reminders for this subscription
    try {
      const remindersRes = await kiuflowService.getReminders(sub_id);
      const allReminders = Array.isArray(remindersRes) ? remindersRes : (remindersRes.reminders || remindersRes.data || []);
      
      // Filter pending reminders that belong to this client and cancel them
      const clientReminders = allReminders.filter(r => 
        String(r.client?.id) === String(client_id) && 
        r.status?.name === "Pendiente"
      );

      for (const r of clientReminders) {
        await kiuflowService.removeReminder(r.id, sub_id);
      }
    } catch (err) {
      console.error("Error limpiando recordatorios antiguos:", err.message);
      // No bloqueamos el reagendamiento si falla limpiar recordatorios
    }

    // 3. Create new reminders based on the Funnel config
    if (funnel_id) {
      try {
        const funnel = await kiuflowService.getWebpage(funnel_id, sub_id);
        const reminders = funnel?.jsonData?.reminders || [];
        const citaDate = new Date(date);
        const ahora = new Date();

        const offsets = [
          24 * 3600000, // R2: 24h antes
          3 * 3600000,  // R3: 3h antes
          5 * 60000,    // R4: 5 mins antes
        ];

        for (let i = 0; i < offsets.length; i++) {
          const rem = reminders[i + 1]; // R2=index 1, R3=index 2, R4=index 3
          if (!rem || !rem.channelId) continue;
          
          const remindAt = new Date(citaDate.getTime() - offsets[i]).toISOString().substring(0, 19);
          if (new Date(remindAt) <= ahora) continue; // skip si ya pasó
          try {
            await kiuflowService.createReminder({
              clientId: String(client_id),
              channelId: rem.channelId,
              templateId: rem.templateId || null,
              content: rem.content,
              remindAt,
            }, sub_id);
          } catch (err) {
            console.error(`Error creando nuevo R${i + 2}:`, err.message);
          }
        }
      } catch (err) {
        console.error("Error creando nuevos recordatorios:", err.message);
      }
    }

    res.json({ ok: true, appointment: updatedAppt });
  } catch (error) {
    console.error("Error reagendando cita:", error.message);
    res.status(500).json({ error: "Error al reagendar la cita" });
  }
});

router.get("/p/*", async (req, res) => {
  try {
    const parts = req.path.split("/");
    const code = parts[2];
    if (!code) return res.status(404).send("<h1>Landing Page no encontrada</h1>");

    const kfResponse = await axios.post(`${API_URL}/api/v1/webpage/${code}/get`);
    if (!kfResponse.data || !kfResponse.data.data) {
      return res.status(404).send("<h1>Landing Page no encontrada</h1>");
    }

    const landing = kfResponse.data.data;

    if (landing.published !== true && landing.published !== "true") {
      return res.status(403).send("<h1>Esta p&aacute;gina no est&aacute; publicada</h1>");
    }

    const html = landing.jsonData?.gjs_html || "";
    const css = landing.jsonData?.gjs_css || "";
    const subIdToInject = landing.suscription_id || landing.subscription_id || landing.suscriptionId || landing.jsonData?.suscription_id || process.env.KIUFLOW_SUBSCRIPTION_ID || "";
    const jwtScript = `<script>
      window.KF_PUBLIC_JWT = ${JSON.stringify(landing.jwt || '')};
      window.KF_SUB_ID = ${JSON.stringify(subIdToInject)};
    </script>`;

    const finalHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${escapeHtml(landing.name || "Landing")}</title>
          <style>${css}</style>
          ${jwtScript}
        </head>
        <body>${html}</body>
      </html>
    `;
    res.send(finalHtml);
  } catch (error) {
    console.error("Error en public landing:", error.message);
    res.status(500).send("<h1>Error cargando landing</h1>");
  }
});

// GET /f/* (Video Funnel Landing) - excluye rutas que terminan en /form
router.get(/^\/f\/(?!.*(\/form|\/survey)$).+/, async (req, res) => {
  try {
    const parts = req.path.split("/");
    const code = parts[2];
    if (!code) return res.status(404).send("<h1>Video Funnel no encontrado</h1>");

    const kfResponse = await axios.post(`${API_URL}/api/v1/webpage/${code}/get`);
    if (!kfResponse.data || !kfResponse.data.data) {
      return res.status(404).send("<h1>Video Funnel no encontrado</h1>");
    }

    const funnelPage = kfResponse.data.data;

    if (funnelPage.published !== true && funnelPage.published !== "true") {
      return res.status(403).send("<h1>Este embudo no est&aacute; publicado</h1>");
    }

    const funnel = {
      id: funnelPage.id,
      title: funnelPage.name,
      video_url: funnelPage.jsonData?.video_url,
      video_type: funnelPage.jsonData?.video_type,
      bg_color: funnelPage.jsonData?.bg_color,
      text_color: funnelPage.jsonData?.text_color,
      cta_text: funnelPage.jsonData?.cta_text,
      cta_color: funnelPage.jsonData?.cta_color,
      video_threshold: funnelPage.jsonData?.video_threshold,
      sub_id: funnelPage.suscription_id || funnelPage.subscription_id || funnelPage.suscriptionId || funnelPage.subscriptionId || funnelPage.jsonData?.suscription_id || funnelPage.jsonData?.subscriptionId || process.env.KIUFLOW_SUBSCRIPTION_ID,
      public_slug: code + "/" + (parts[3] || "funnel"),
      ...funnelPage.jsonData,
      jwt: funnelPage.jwt,   // SIEMPRE al final para que no sea sobreescrito por jsonData
    };

    const html = renderFunnelLanding(funnel);
    res.send(html);
  } catch (error) {
    console.error("Error public funnel:", error.message);
    res.status(500).send("<h1>Error cargando funnel</h1>");
  }
});

// GET /f/**/form (Formulario del Funnel - maneja slugs con múltiples segmentos)
router.get(/^\/f\/.+\/form$/, async (req, res) => {
  try {
    const parts = req.path.split("/");
    const code = parts[2];
    if (!code) return res.status(404).send("<h1>Formulario no encontrado</h1>");

    const kfResponse = await axios.post(`${API_URL}/api/v1/webpage/${code}/get`);
    if (!kfResponse.data || !kfResponse.data.data) {
      return res.status(404).send("<h1>Formulario no encontrado</h1>");
    }

    const funnelPage = kfResponse.data.data;

    const funnel = {
      id: funnelPage.id,
      title: funnelPage.name,
      video_url: funnelPage.jsonData?.video_url,
      video_type: funnelPage.jsonData?.video_type,
      bg_color: funnelPage.jsonData?.bg_color,
      text_color: funnelPage.jsonData?.text_color,
      cta_text: funnelPage.jsonData?.cta_text,
      cta_color: funnelPage.jsonData?.cta_color,
      video_threshold: funnelPage.jsonData?.video_threshold,
      sub_id: funnelPage.suscription_id || funnelPage.subscription_id || funnelPage.suscriptionId || funnelPage.subscriptionId || funnelPage.jsonData?.suscription_id || funnelPage.jsonData?.subscriptionId || process.env.KIUFLOW_SUBSCRIPTION_ID,
      public_slug: code + "/" + (parts[3] || "funnel"),
      ...funnelPage.jsonData,
      jwt: funnelPage.jwt,   // SIEMPRE al final para que no sea sobreescrito por jsonData
    };

    const formHtml = renderFunnelForm(funnel);
    res.send(formHtml);
  } catch (error) {
    console.error("Error en public funnel form:", error.message);
    res.status(500).send("<h1>Error cargando formulario</h1>");
  }
});

// ──────────────────────────────────────────────────────────
// RUTAS DE ENCUESTA PÚBLICA
// ──────────────────────────────────────────────────────────

/**
 * GET /f/:code/survey
 * Renderiza la página pública de la encuesta asociada a un Funnel.
 * Extrae el JWT y el surveyId del JSON del Funnel para consultar la API.
 */
router.get("/f/:code/survey", async (req, res) => {
  try {
    const { code } = req.params;
    const { client: clientId } = req.query;

    if (!code) return res.status(404).send("<h1>Funnel no especificado</h1>");

    // 1. Consultar el Funnel público
    let funnelPage = null;
    try {
      const kfRes = await axios.post(`${API_URL}/api/v1/webpage/${code}/get`);
      funnelPage = kfRes.data?.data;
    } catch (e) {
      console.warn("Error buscando funnel para encuesta:", e.message);
    }

    if (!funnelPage) return res.status(404).send("<h1>Encuesta no encontrada (Funnel inválido)</h1>");

    const jwtToken = funnelPage.jwt;
    const jd = funnelPage.jsonData || {};
    const surveyId = jd.surveyId || jd.survey_id;
    const subIdToUse = funnelPage.suscription_id || funnelPage.subscription_id || jd.suscription_id || process.env.KIUFLOW_SUBSCRIPTION_ID;

    if (!surveyId) {
      return res.status(404).send("<h1>Este Funnel no tiene una encuesta asociada</h1>");
    }

    let logoUrl = jd.use_funnel_logo ? (jd.logo_url || "") : (jd.survey_logo_url || "");
    let brandColor = jd.survey_highlight_color || "#DB2C52";

    // 2. Cargar nombre y preguntas de la encuesta usando el JWT del Funnel
    let surveyName = "Encuesta de Satisfacción";
    let questions = [];
    let alreadyCompleted = false;

    try {
      if (clientId) {
        const submissionsRes = await kiuflowService.getSurveySubmissions(surveyId, subIdToUse, jwtToken);
        const allSubmissions = Array.isArray(submissionsRes) ? submissionsRes : (submissionsRes?.data || []);
        const hasCompleted = allSubmissions.some(s => 
          String(s.client?.id) === String(clientId) && 
          s.status === "COMPLETED"
        );
        if (hasCompleted) {
          alreadyCompleted = true;
        }
      }
    } catch (e) {
      console.warn("No se pudieron verificar las sumisiones previas:", e.message);
    }

    try {
      const surveyRes = await kiuflowService.getSurvey(surveyId, subIdToUse, jwtToken);
      surveyName = surveyRes?.name || surveyRes?.data?.name || surveyName;
    } catch (e) {
      console.warn("No se pudo obtener nombre de encuesta:", e.message);
    }

    try {
      const questionsRes = await kiuflowService.getSurveyQuestions(surveyId, subIdToUse, jwtToken);
      questions = Array.isArray(questionsRes) ? questionsRes : (questionsRes?.data || questionsRes?.questions || []);
    } catch (e) {
      console.warn("No se pudieron obtener preguntas de encuesta:", e.message);
    }

    const html = renderSurveyPage({
      surveyId,
      surveyName,
      funnelCode: code, // Pasamos el funnelCode para el submit final
      clientId: clientId || "",
      subId: subIdToUse,
      questions,
      apiBase: process.env.APP_DOMAIN || "https://builder.kiuflow.online",
      logoUrl,
      brandColor,
      alreadyCompleted,
    });

    res.send(html);
  } catch (error) {
    console.error("Error renderizando encuesta:", error.message);
    res.status(500).send("<h1>Error cargando la encuesta</h1>");
  }
});

/**
 * POST /api/public/funnel/:code/survey/submit-all
 * Recibe todas las respuestas de una vez desde el frontend y las envía a KiuFlow usando el JWT del Funnel.
 */
router.post("/api/public/funnel/:code/survey/submit-all", async (req, res) => {
  try {
    const { code } = req.params;
    const { clientId, answers, subId } = req.body;

    if (!code || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // 1. Obtener JWT y surveyId del Funnel
    let funnelPage = null;
    try {
      const kfRes = await axios.post(`${API_URL}/api/v1/webpage/${code}/get`);
      funnelPage = kfRes.data?.data;
    } catch (e) {
      console.error("Error validando funnel en submit:", e.message);
      return res.status(404).json({ error: "Funnel no encontrado o inactivo" });
    }

    const jwtToken = funnelPage?.jwt;
    const jd = funnelPage?.jsonData || {};
    const surveyId = jd.surveyId || jd.survey_id;
    const subIdToUse = subId || funnelPage?.suscription_id || process.env.KIUFLOW_SUBSCRIPTION_ID;

    if (!jwtToken || !surveyId) {
      return res.status(400).json({ error: "Este funnel no tiene encuesta válida" });
    }

    // 2. Verificar si ya completó
    try {
      if (clientId) {
        const submissionsRes = await kiuflowService.getSurveySubmissions(surveyId, subIdToUse, jwtToken);
        const allSubmissions = Array.isArray(submissionsRes) ? submissionsRes : (submissionsRes?.data || []);
        const hasCompleted = allSubmissions.some(s => 
          String(s.client?.id) === String(clientId) && 
          s.status === "COMPLETED"
        );
        if (hasCompleted) {
          return res.status(400).json({ error: "Ya respondiste esta encuesta anteriormente." });
        }
      }
    } catch (e) {
      console.warn("No se pudo verificar sumisión previa en el POST:", e.message);
    }

    // 3. Enviar las respuestas a KiuFlow usando el JWT público del Funnel
    await kiuflowService.submitSurveyComplete(surveyId, clientId, answers, subIdToUse, jwtToken);

    res.json({ success: true });
  } catch (error) {
    console.error("Error guardando encuesta:", error.message);
    res.status(500).json({ error: "Error interno al guardar las respuestas" });
  }
});

module.exports = router;
