const express = require("express");
const router = express.Router();
const kiuflowService = require("../services/kiuflowService");

// POST /api/funnels/:funnelId/leads
router.post("/:funnelId/leads", async (req, res) => {
  const { funnelId } = req.params;
  const { data } = req.body;

  if (!data) return res.status(400).json({ error: "Faltan datos del formulario" });

  try {
    const subIdToUse = req.query.sub_id || req.body.sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
    const { channelId, reminders } = req.body;
    const API_URL = process.env.KIUFLOW_API_URL || "https://apiengine.kiuflow.online";

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

    const customFieldsArray = [
      { name: "leadSource", value: String(funnelId) }
    ];
    
    for (const key in data) {
      if (!['nombre','name','telefono','phone','email','correo'].includes(key)) {
        customFieldsArray.push({ name: key, value: String(data[key]) });
      }
    }
    
    const clientData = {
      name,
      phone,
      email,
      source: funnelId,
      customFields: customFieldsArray,
      custom_fields: customFieldsArray
    };

    /**
     * Paso 2: Sincronización con el CRM
     * Registra el cliente (Lead) en el repositorio central de KiuFlow.
     */

    if (channelId) {
      clientData.channelId = channelId;
    }

    let clientId;
    try {
      const axios = require("axios");
      const clientRes = await axios.post(`${API_URL}/api/v1/suscription/${subIdToUse}/client/create`, clientData, {
        headers: {
          'Authorization': req.headers.authorization || "",
          'Content-Type': 'application/json'
        }
      });
      if (!clientRes.data.success) throw new Error(clientRes.data.message);
      clientId = clientRes.data.data.id;
    } catch (err) {
      console.warn("Error creando cliente con JWT directo, intentando fallback:", err.message);
      throw err;
    }

    /**
     * Paso 3: Disparador de Automatizaciones
     * Para pruebas: Programamos TODOS los recordatorios espaciados cada 2 minutos.
     * R1 a los 2 min, R2 a los 4 min, R3 a los 6 min.
     */
    if (Array.isArray(reminders)) {
      const reminderPromises = reminders.map((r, index) => {
        if (r && r.channelId) {
          const minutesToAdd = (index + 1) * 2;
          const remindAt = new Date(Date.now() + minutesToAdd * 60000).toISOString(); 
          
          const axios = require("axios");
          return axios.post(`${API_URL}/api/v1/suscription/${subIdToUse}/appointment/reminders/create`, {
            clientId,
            channelId: r.channelId,
            templateId: r.templateId || null,
            content: r.content,
            remindAt
          }, {
            headers: {
              'Authorization': req.headers.authorization || "",
              'Content-Type': 'application/json'
            }
          }).catch(err => {
            console.error(`Error creando R${index + 1}:`, err.message);
          });
        }
        return Promise.resolve();
      });

      await Promise.all(reminderPromises);
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
    const safeClients = Array.isArray(clients) ? clients : [];
    
    // Helper para extraer un custom field dado su nombre (soporta array de objetos o un objeto directo)
    const getCustomField = (client, fieldName) => {
      const cFields = client.customFields || client.custom_fields;
      if (Array.isArray(cFields)) {
        const field = cFields.find(f => f.name === fieldName);
        return field ? field.value : undefined;
      }
      return cFields ? cFields[fieldName] : undefined;
    };

    // Filtrado de Leads correspondientes a este embudo
    const funnelLeads = safeClients.filter(c => {
      const source = getCustomField(c, 'leadSource') || getCustomField(c, 'lead_source') || c.source || '';
      return String(source) === String(funnelId);
    }).map(c => {
      // Convertir el array de customFields en un objeto simple para el map
      const fieldsObj = {};
      const cFields = c.customFields || c.custom_fields;
      if (Array.isArray(cFields)) {
        cFields.forEach(f => fieldsObj[f.name] = f.value);
      } else if (typeof cFields === 'object' && cFields !== null) {
        Object.assign(fieldsObj, cFields);
      }

      return {
        id: c.id,
        created_at: c.createdAt || c.created_at || new Date().toISOString(),
        data: {
          nombre: c.name,
          telefono: c.phone,
          email: c.email,
          ...fieldsObj
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
    
    // Usar la misma lógica de filtrado que en el GET normal
    const getCustomField = (client, fieldName) => {
      const cFields = client.customFields || client.custom_fields;
      if (Array.isArray(cFields)) {
        const field = cFields.find(f => f.name === fieldName);
        return field ? field.value : undefined;
      }
      return cFields ? cFields[fieldName] : undefined;
    };

    const leads = clients.filter(c => {
      const source = getCustomField(c, 'leadSource') || getCustomField(c, 'lead_source') || c.source || '';
      return String(source) === String(funnelId);
    });

    const csvRows = [];
    
    if (leads.length > 0) {
      // Recolectar todas las posibles llaves para las cabeceras
      let allKeys = new Set(['id', 'fecha', 'nombre', 'telefono', 'email']);
      leads.forEach(c => {
        const cFields = c.customFields || c.custom_fields;
        if (Array.isArray(cFields)) {
          cFields.forEach(f => allKeys.add(f.name));
        } else if (typeof cFields === 'object' && cFields !== null) {
          Object.keys(cFields).forEach(k => allKeys.add(k));
        }
      });
      const headers = Array.from(allKeys);
      csvRows.push(headers.join(','));

      for (const lead of leads) {
        // Objeto unificado
        const fieldsObj = {};
        const cFields = lead.customFields || lead.custom_fields;
        if (Array.isArray(cFields)) {
          cFields.forEach(f => fieldsObj[f.name] = f.value);
        } else if (typeof cFields === 'object' && cFields !== null) {
          Object.assign(fieldsObj, cFields);
        }

        const rowData = {
          id: lead.id || '',
          fecha: lead.createdAt || lead.created_at || '',
          nombre: lead.name || '',
          telefono: lead.phone || '',
          email: lead.email || '',
          ...fieldsObj
        };

        const rowValues = headers.map(h => {
          let val = rowData[h] || '';
          // Limpiar el valor para CSV
          if (typeof val === 'string') {
            val = val.replace(/"/g, '""');
            if (val.includes(',') || val.includes('\n')) {
              val = `"${val}"`;
            }
          }
          return val;
        });
        csvRows.push(rowValues.join(','));
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
