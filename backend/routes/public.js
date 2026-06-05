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

    const nextAppt = clientAppointments[0];
    
    res.json({
      ok: true,
      appointment: {
        id: nextAppt.id,
        startDate: nextAppt.startDate,
        endDate: nextAppt.endDate,
        agentName: nextAppt.agent?.name || "Asesor",
        agentPhoto: nextAppt.agent?.profileImageUrl || null,
        meetingUrl: nextAppt.meetingUrl || null,
        meetingProvider: nextAppt.meetingProvider || null,
      }
    });

  } catch (error) {
    console.error("Error obteniendo cita pública:", error.message);
    res.status(500).json({ error: "Error al consultar la cita" });
  }
});
// POST /api/public/appointment/confirm
router.post("/api/public/appointment/confirm", async (req, res) => {
  try {
    const { appointment_id, sub_id } = req.body;
    if (!appointment_id || !sub_id) {
      return res.status(400).json({ error: "Faltan parámetros" });
    }
    
    // Update appointment as confirmed
    await kiuflowService.updateAppointment(appointment_id, { confirmed: true, attended: "false" }, sub_id);
    res.json({ ok: true });
  } catch (error) {
    console.error("Error confirmando cita:", error.message);
    res.status(500).json({ error: "Error al confirmar la cita" });
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
    const updatedAppt = await kiuflowService.updateAppointment(appointment_id, { 
      date, 
      confirmed: true 
    }, sub_id);

    // 2. Fetch all reminders for this subscription
    try {
      const allReminders = await kiuflowService.getReminders(sub_id);
      
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

