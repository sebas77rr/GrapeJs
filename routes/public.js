const express = require("express");
const router = express.Router();
const axios = require("axios");
const kiuflowService = require("../services/kiuflowService");
const { renderFunnelLanding, renderFunnelForm } = require("../funnel-renderer");
const { renderSurveyPage } = require("../survey-renderer");

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
    const newEndDate = new Date(newStartDate.getTime() + 30 * 60000); // Asumimos 30 min por defecto
    const updatedAppt = await kiuflowService.updateAppointment(appointment_id, { 
      date,
      startDate: date,
      endDate: newEndDate.toISOString(),
      start: date,
      end: newEndDate.toISOString(),
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
          if (offsets[i] <= 0) continue; // ya pasó ese momento

          const remindAt = new Date(ahora.getTime() + offsets[i]).toISOString();
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
      window.KF_PUBLIC_JWT = "${landing.jwt || ''}";
      window.KF_SUB_ID = "${subIdToInject}";
    </script>`;

    const finalHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${landing.name || "Landing"}</title>
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
router.get(/^\/f\/(?!.*\/form$).+/, async (req, res) => {
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
      jwt: funnelPage.jwt,
      ...funnelPage.jsonData
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
      jwt: funnelPage.jwt,
      ...funnelPage.jsonData,
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
 * GET /s/:surveyId
 * Renderiza la página pública de la encuesta.
 * Query params: ?client=<clientId>&sub=<subId>
 */
router.get("/s/:surveyId", async (req, res) => {
  try {
    const { surveyId } = req.params;
    const { client: clientId, sub: subId } = req.query;
    const subIdToUse = subId || process.env.KIUFLOW_SUBSCRIPTION_ID;

    if (!surveyId) return res.status(404).send("<h1>Encuesta no encontrada</h1>");

    // Traer la encuesta y sus preguntas desde KiuFlow
    let surveyName = "Encuesta de Satisfacción";
    let questions = [];

    try {
      const surveyRes = await kiuflowService.getSurvey(surveyId, subIdToUse);
      if (surveyRes && (surveyRes.name || surveyRes.data?.name)) {
        surveyName = surveyRes.name || surveyRes.data?.name || surveyName;
      }
    } catch (e) {
      console.warn("No se pudo obtener nombre de encuesta:", e.message);
    }

    try {
      const questionsRes = await kiuflowService.getSurveyQuestions(surveyId, subIdToUse);
      questions = Array.isArray(questionsRes) ? questionsRes : (questionsRes?.data || questionsRes?.questions || []);
    } catch (e) {
      console.warn("No se pudieron obtener preguntas:", e.message);
    }

    const domain = process.env.APP_DOMAIN || "https://builder.kiuflow.online";
    const html = renderSurveyPage({
      surveyId,
      surveyName,
      clientId: clientId || "",
      subId: subIdToUse,
      questions,
      apiBase: domain,
    });

    res.send(html);
  } catch (error) {
    console.error("Error renderizando encuesta:", error.message);
    res.status(500).send("<h1>Error cargando la encuesta</h1>");
  }
});

/**
 * POST /api/public/survey/:surveyId/answer
 * Guarda la respuesta de una pregunta en KiuFlow.
 * Body: { questionId, answer, clientId, sub_id }
 */
router.post("/api/public/survey/:surveyId/answer", async (req, res) => {
  try {
    const { surveyId } = req.params;
    const { questionId, answer, clientId, sub_id } = req.body;
    const subIdToUse = sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;

    if (!surveyId || !questionId || answer == null) {
      return res.status(400).json({ error: "Faltan parámetros requeridos" });
    }

    const result = await kiuflowService.submitSurveyAnswer(
      surveyId,
      questionId,
      clientId || "0",
      answer,
      subIdToUse
    );

    res.json({ ok: true, result });
  } catch (error) {
    console.error("Error guardando respuesta de encuesta:", error.message);
    // Respondemos ok igual para no bloquear al usuario — la respuesta se perdió
    // pero no queremos frustrar la UX
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
