const express = require("express");
const router = express.Router();
const kiuflowService = require("../services/kiuflowService");

// POST /api/funnels/:funnelId/leads
router.post("/:funnelId/leads", async (req, res) => {
  const { funnelId } = req.params;
  const { data } = req.body;

  if (!data) return res.status(400).json({ error: "Faltan datos del formulario" });

  try {
    /**
     * Paso 1: Configuración del Funnel
     * Recuperamos los parámetros del Video Funnel desde KiuFlow 
     * para heredar configuraciones como el canal asignado o recordatorios.
     */
    const subIdToUse = req.query.sub_id || req.body.sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
    const funnel = await kiuflowService.getWebpage(funnelId, subIdToUse);
    if (!funnel) return res.status(404).json({ error: "Funnel no encontrado" });

    /**
     * Mapeo Dinámico de Campos:
     * Separa los campos estándar (nombre, email, teléfono) de cualquier
     * campo adicional enviado por el formulario, almacenándolos en 'customFields'.
     */
    const name = data.nombre || data.name || '';
    let phone = data.telefono || data.phone || '';
    const email = data.email || data.correo || '';

    // Limpiar caracteres no numéricos del teléfono
    phone = phone.replace(/\D/g, '');
    // Si es un número celular colombiano de 10 dígitos sin prefijo, auto-completar el 57
    if (phone.length === 10 && phone.startsWith('3')) {
      phone = '57' + phone;
    }

    const customFields = { leadSource: funnelId };
    for (const key in data) {
      if (!['nombre','name','telefono','phone','email','correo'].includes(key)) {
        customFields[key] = data[key];
      }
    }
    
    const clientData = {
      name,
      phone,
      email,
      source: funnelId,
      customFields,
      custom_fields: customFields
    };

    /**
     * Paso 2: Sincronización con el CRM
     * Registra el cliente (Lead) en el repositorio central de KiuFlow.
     */

    // Si el funnel tiene un channelId principal configurado, se lo asignamos
    if (funnel.jsonData && funnel.jsonData.defaultChannelId) {
      clientData.channelId = funnel.jsonData.defaultChannelId;
    }

    let clientId;
    try {
      const newClient = await kiuflowService.createClient(clientData, subIdToUse);
      clientId = newClient.id;
    } catch (err) {
      console.warn("Posible cliente duplicado detectado. Buscando cliente existente...", err.message);
      const clients = await kiuflowService.getClients(subIdToUse);
      const existingClient = clients.find(c => 
        (phone && c.phone === phone) || (email && c.email === email)
      );
      
      if (existingClient) {
        clientId = existingClient.id;
        console.log("Cliente existente encontrado. Continuando flujo con ID:", clientId);
      } else {
        throw err; // Si no es duplicado o no se encuentra, lanzar error original
      }
    }

    /**
     * Paso 3: Disparador de Automatizaciones
     * Si el funnel posee un recordatorio inmediato programado (R1),
     * se inyecta en el CRM de forma asíncrona para procesamiento.
     */
    if (funnel.jsonData && Array.isArray(funnel.jsonData.reminders)) {
      const r1 = funnel.jsonData.reminders[0]; // solo el primero
      if (r1 && r1.channelId) {
        const remindAt = new Date(Date.now() + 5 * 60000).toISOString(); // 5 mins después
        try {
          await kiuflowService.createReminder({
            clientId,
            channelId: r1.channelId,
            templateId: r1.templateId || null,
            content: r1.content,
            remindAt
          }, subIdToUse);
        } catch (err) { 
          console.error("Error creando R1:", err.message);
        }
      }
    }

    res.status(201).json({ ok: true, lead: { id: clientId, ...data } });
  } catch (error) {
    console.error("Error procesando lead en KiuFlow:", error.message);
    res.status(500).json({ error: "Error procesando el lead" });
  }
});

// GET /api/funnels/:funnelId/leads?client_id=X
router.get("/:funnelId/leads", async (req, res) => {
  const { funnelId } = req.params;
  
  try {
    /**
     * Motor de Búsqueda Local Temporal:
     * Obtenemos el listado general de clientes y lo filtramos en memoria
     * según el origen (leadSource) asignado al crear el lead.
     * TODO: Optimizar si KiuFlow habilita búsqueda nativa por customField.
     */
    const subIdToUse = req.query.sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
    const clients = await kiuflowService.getClients(subIdToUse);
    
    // Filtrado de Leads correspondientes a este embudo
    const funnelLeads = clients.filter(c => {
      const cFields = c.customFields || c.custom_fields || {};
      const source = cFields.leadSource || cFields.lead_source || c.source || '';
      return String(source) === String(funnelId);
    }).map(c => {
      const cFields = c.customFields || c.custom_fields || {};
      return {
        id: c.id,
        created_at: c.createdAt || c.created_at || new Date().toISOString(),
        data: {
          nombre: c.name,
          telefono: c.phone,
          email: c.email,
          ...cFields
        }
      };
    });

    // Opcional: ordenar descendente por fecha
    funnelLeads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ leads: funnelLeads, total: funnelLeads.length });
  } catch (error) {
    console.error("Error obteniendo leads de KiuFlow:", error.message);
    res.status(500).json({ error: "Error al obtener leads" });
  }
});

// GET /api/funnels/:funnelId/leads/export?client_id=X
router.get("/:funnelId/leads/export", async (req, res) => {
  const { funnelId } = req.params;

  try {
    const subIdToUse = req.query.sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
    const clients = await kiuflowService.getClients(subIdToUse);
    const leads = clients.filter(c => c.customFields && c.customFields.leadSource === funnelId);

    const csvRows = [];
    
    if (leads.length > 0) {
      // Recolectar todas las posibles llaves para las cabeceras
      let allKeys = new Set(['id', 'fecha', 'nombre', 'telefono', 'email']);
      leads.forEach(c => {
        if (c.customFields) {
          Object.keys(c.customFields).forEach(k => allKeys.add(k));
        }
      });
      const headers = Array.from(allKeys);
      csvRows.push(headers.join(','));

      for (const lead of leads) {
        const rowData = {
          id: lead.id,
          fecha: new Date(lead.createdAt || Date.now()).toISOString(),
          nombre: lead.name,
          telefono: lead.phone,
          email: lead.email,
          ...(lead.customFields || {})
        };
        const row = headers.map(k => `"${(rowData[k] || '').toString().replace(/"/g, '""')}"`);
        csvRows.push(row.join(','));
      }
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=leads_funnel_${funnelId}.csv`);
    res.send(csvRows.join('\n'));
  } catch (error) {
    res.status(500).json({ error: "Error exportando leads" });
  }
});

module.exports = router;
