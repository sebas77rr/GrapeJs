const express = require("express");
const router = express.Router();
const kiuflowService = require("../services/kiuflowService");
const { getValidToken } = require("../services/kiuflowAuth");

// ──────────────────────────────────────────────────────────
// POST /api/funnels/:funnelId/leads
// Registra un nuevo lead desde la página pública del Funnel.
// ──────────────────────────────────────────────────────────
router.post("/:funnelId/leads", async (req, res) => {
  const { funnelId } = req.params;
  const { data, channelId, reminders, sub_id } = req.body;

  if (!data) return res.status(400).json({ error: "Faltan datos del formulario" });

  try {
    const subIdToUse = req.query.sub_id || sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
    const API_URL = process.env.KIUFLOW_API_URL || "https://apiengine.kiuflow.online";

    // Normalización de campos estándar
    const name  = data.nombre || data.name  || "";
    const email = data.email  || data.correo || "";
    let   phone = data.telefono || data.phone || "";

    // Limpiar teléfono y agregar prefijo Colombia si aplica
    phone = phone.replace(/\D/g, "");
    if (phone.length === 10 && phone.startsWith("3")) phone = "57" + phone;

    // Campos personalizados: guardamos el funnelId para poder filtrar luego
    const customFieldsArray = [{ name: "leadSource", value: String(funnelId) }];
    for (const key in data) {
      if (!["nombre", "name", "telefono", "phone", "email", "correo"].includes(key)) {
        customFieldsArray.push({ name: key, value: String(data[key]) });
      }
    }

    const clientData = {
      name,
      phone,
      email,
      source: String(funnelId),
      customFields: customFieldsArray,
      custom_fields: customFieldsArray,
      ...(channelId && { channelId }),
    };

    // Obtener token: primero el del usuario (SSO), luego el de servicio
    const axios = require("axios");
    const authToken = req.headers.authorization || `Bearer ${await getValidToken()}`;
    const authHeaders = { Authorization: authToken, "Content-Type": "application/json" };

    // Crear cliente en KiuFlow
    const clientRes = await axios.post(
      `${API_URL}/api/v1/suscription/${subIdToUse}/client/create`,
      clientData,
      { headers: authHeaders }
    );
    if (!clientRes.data.success) throw new Error(clientRes.data.message);
    const clientId = clientRes.data.data.id;

    // R1: Recordatorio de bienvenida (si está habilitado en la config del Funnel)
    const r1 = Array.isArray(reminders) ? reminders[0] : null;
    if (r1?.channelId && r1?.enabled) {
      const remindAt = new Date(Date.now() + 5 * 60000).toISOString();
      try {
        await axios.post(
          `${API_URL}/api/v1/suscription/${subIdToUse}/appointment/reminders/create`,
          { clientId, channelId: r1.channelId, templateId: r1.templateId || null, content: r1.content, remindAt },
          { headers: authHeaders }
        );
      } catch (err) {
        console.error("Error creando R1 (bienvenida):", err.message);
      }
    }

    res.status(201).json({ ok: true, lead: { id: clientId, ...data } });
  } catch (error) {
    console.error("Error al procesar el lead:", error.message);
    res.status(500).json({ error: error.message || "Error interno al procesar el lead" });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/funnels/:funnelId/leads
// Lista los leads asociados a un Funnel filtrando por
// múltiples variantes del campo "leadSource" en KiuFlow.
// ──────────────────────────────────────────────────────────
router.get("/:funnelId/leads", async (req, res) => {
  const { funnelId } = req.params;

  try {
    const subIdToUse = req.query.sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
    const clients = await kiuflowService.getClients(subIdToUse);
    const safeClients = Array.isArray(clients) ? clients : [];

    // Extrae un custom field por nombre (soporta array de objetos o mapa directo)
    const getCustomField = (client, fieldName) => {
      const fields = client.customFields || client.custom_fields;
      if (Array.isArray(fields)) {
        return fields.find(f => f.name === fieldName)?.value;
      }
      return fields?.[fieldName];
    };

    // Filtramos leads que pertenezcan a este funnel.
    // Buscamos por leadSource, lead_source y source para cubrir variantes de la API.
    const funnelLeads = safeClients
      .filter(c => {
        const leadSource = getCustomField(c, "leadSource")
          || getCustomField(c, "lead_source")
          || c.source
          || "";
        return String(leadSource) === String(funnelId);
      })
      .map(c => {
        const fieldsObj = {};
        const fields = c.customFields || c.custom_fields;
        if (Array.isArray(fields)) {
          fields.forEach(f => { fieldsObj[f.name] = f.value; });
        } else if (fields && typeof fields === "object") {
          Object.assign(fieldsObj, fields);
        }
        return {
          id: c.id,
          created_at: c.createdAt || c.created_at || new Date().toISOString(),
          data: { nombre: c.name, telefono: c.phone, email: c.email, ...fieldsObj },
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ leads: funnelLeads, total: funnelLeads.length });
  } catch (error) {
    console.error("Error obteniendo leads:", error.message);
    res.status(500).json({ error: "Error al obtener leads" });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/funnels/:funnelId/leads/export
// Descarga los leads de un Funnel en formato CSV.
// ──────────────────────────────────────────────────────────
router.get("/:funnelId/leads/export", async (req, res) => {
  const { funnelId } = req.params;

  try {
    const subIdToUse = req.query.sub_id || process.env.KIUFLOW_SUBSCRIPTION_ID;
    const clients = await kiuflowService.getClients(subIdToUse);

    const getCustomField = (client, fieldName) => {
      const fields = client.customFields || client.custom_fields;
      if (Array.isArray(fields)) return fields.find(f => f.name === fieldName)?.value;
      return fields?.[fieldName];
    };

    const leads = (Array.isArray(clients) ? clients : []).filter(c => {
      const source = getCustomField(c, "leadSource") || getCustomField(c, "lead_source") || c.source || "";
      return String(source) === String(funnelId);
    });

    const csvRows = [];
    if (leads.length > 0) {
      const allKeys = new Set(["id", "fecha", "nombre", "telefono", "email"]);
      leads.forEach(c => {
        const fields = c.customFields || c.custom_fields;
        if (Array.isArray(fields)) fields.forEach(f => allKeys.add(f.name));
        else if (fields && typeof fields === "object") Object.keys(fields).forEach(k => allKeys.add(k));
      });

      const headers = Array.from(allKeys);
      csvRows.push(headers.join(","));

      for (const lead of leads) {
        const fieldsObj = {};
        const fields = lead.customFields || lead.custom_fields;
        if (Array.isArray(fields)) fields.forEach(f => { fieldsObj[f.name] = f.value; });
        else if (fields && typeof fields === "object") Object.assign(fieldsObj, fields);

        const rowData = { id: lead.id || "", fecha: lead.createdAt || lead.created_at || "", nombre: lead.name || "", telefono: lead.phone || "", email: lead.email || "", ...fieldsObj };
        const rowValues = headers.map(h => {
          let val = rowData[h] || "";
          if (typeof val === "string") {
            val = val.replace(/"/g, '""');
            if (val.includes(",") || val.includes("\n")) val = `"${val}"`;
          }
          return val;
        });
        csvRows.push(rowValues.join(","));
      }
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=leads_funnel_${funnelId}.csv`);
    res.send(csvRows.join("\n"));
  } catch (error) {
    console.error("Error exportando leads:", error.message);
    res.status(500).json({ error: "Error exportando leads" });
  }
});

module.exports = router;
