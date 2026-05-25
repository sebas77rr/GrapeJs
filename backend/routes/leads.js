const express = require("express");
const router = express.Router();
const db = require("../db");

// POST /api/funnels/:funnelId/leads
router.post("/:funnelId/leads", async (req, res) => {
  const { funnelId } = req.params;
  const { data } = req.body;

  if (!data) return res.status(400).json({ error: "Faltan datos del formulario" });

  const funnel = await db.getFunnel(funnelId);
  if (!funnel) return res.status(404).json({ error: "Funnel no encontrado" });

  const ip = req.headers["x-forwarded-for"] || req.connection?.remoteAddress || req.ip || "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";

  const lead = await db.createLead(funnelId, data, ip, userAgent);
  res.status(201).json({ ok: true, lead: { ...lead, data: JSON.parse(lead.data_json) } });
});

// GET /api/funnels/:funnelId/leads?client_id=X
router.get("/:funnelId/leads", async (req, res) => {
  const { client_id } = req.query;
  if (!client_id) return res.status(400).json({ error: "client_id requerido" });

  const funnel = await db.getFunnel(req.params.funnelId);
  if (!funnel || funnel.client_id !== Number(client_id)) {
    return res.status(403).json({ error: "No autorizado para ver estos leads" });
  }

  let leads = await db.getLeads(req.params.funnelId);
  leads = leads.map(l => ({ ...l, data: JSON.parse(l.data_json) }));
  
  const total = await db.getLeadCount(req.params.funnelId);
  res.json({ leads, total });
});

// GET /api/funnels/:funnelId/leads/export?client_id=X
router.get("/:funnelId/leads/export", async (req, res) => {
  const { client_id } = req.query;
  if (!client_id) return res.status(400).json({ error: "client_id requerido" });

  const funnel = await db.getFunnel(req.params.funnelId);
  if (!funnel || funnel.client_id !== Number(client_id)) {
    return res.status(403).json({ error: "No autorizado" });
  }

  const leads = await db.getLeads(req.params.funnelId);
  const csvRows = [];
  
  if (leads.length > 0) {
    const headers = ['id', 'fecha', 'ip', ...Object.keys(JSON.parse(leads[0].data_json))];
    csvRows.push(headers.join(','));

    for (const lead of leads) {
      const parsedData = JSON.parse(lead.data_json);
      const row = [
        lead.id,
        new Date(lead.created_at).toISOString(),
        lead.ip || '',
        ...Object.keys(parsedData).map(k => `"${(parsedData[k] || '').replace(/"/g, '""')}"`)
      ];
      csvRows.push(row.join(','));
    }
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=leads_funnel_${req.params.funnelId}.csv`);
  res.send(csvRows.join('\n'));
});

module.exports = router;
