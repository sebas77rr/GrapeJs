const fs = require('fs').promises;
const path = require('path');

const dbPath = path.join(__dirname, 'demo-db.json');

async function readDB() {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      const defaultData = { clients: [], projects: [], templates: [], funnels: [], leads: [], _nextId: { funnels: 1, leads: 1, projects: 1 } };
      await writeDB(defaultData);
      return defaultData;
    }
    throw err;
  }
}

async function writeDB(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

// Generate unique ID based on auto-increment
async function getNextId(collection) {
  const data = await readDB();
  if (!data._nextId) data._nextId = { funnels: 1, leads: 1, projects: 1 };
  if (!data._nextId[collection]) data._nextId[collection] = 1;
  const id = data._nextId[collection]++;
  await writeDB(data);
  return id;
}

module.exports = {
  // --- CLIENTS ---
  async getClient(id) {
    const data = await readDB();
    return data.clients.find(c => c.id === Number(id)) || null;
  },
  async getClients() {
    const data = await readDB();
    return data.clients || [];
  },

  // --- PROJECTS ---
  async getProjects(clientId) {
    const data = await readDB();
    return (data.projects || []).filter(p => p.client_id === Number(clientId)).sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
  },
  async getProject(id, clientId) {
    const data = await readDB();
    return (data.projects || []).find(p => p.id === Number(id) && p.client_id === Number(clientId)) || null;
  },
  async getProjectBySlug(slug) {
    const data = await readDB();
    return (data.projects || []).find(p => p.public_slug === String(slug)) || null;
  },
  async createProject({ client_id, name, template_id, json_data }) {
    const data = await readDB();
    const newProject = {
      id: await getNextId('projects'),
      client_id: Number(client_id),
      name: name || 'Sin título',
      public_slug: Math.random().toString(36).substring(2, 10),
      template_id: template_id ? Number(template_id) : null,
      json_data: json_data ? JSON.stringify(json_data) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if(!data.projects) data.projects = [];
    data.projects.push(newProject);
    await writeDB(data);
    return newProject;
  },
  async updateProject(id, clientId, json_data, html, css) {
    const data = await readDB();
    if(!data.projects) data.projects = [];
    const index = data.projects.findIndex(p => p.id === Number(id) && p.client_id === Number(clientId));
    if (index === -1) return null;
    
    if (json_data) data.projects[index].json_data = JSON.stringify(json_data);
    if (html !== undefined) data.projects[index].html = html;
    if (css !== undefined) data.projects[index].css = css;
    data.projects[index].updated_at = new Date().toISOString();
    
    await writeDB(data);
    return data.projects[index];
  },
  async deleteProject(id, clientId) {
    const data = await readDB();
    if(!data.projects) return;
    const initialLength = data.projects.length;
    data.projects = data.projects.filter(p => !(p.id === Number(id) && p.client_id === Number(clientId)));
    if (data.projects.length !== initialLength) await writeDB(data);
    return true;
  },

  // --- TEMPLATES ---
  async getTemplates() {
    const data = await readDB();
    return data.templates || [];
  },
  async getTemplate(id) {
    const data = await readDB();
    return (data.templates || []).find(t => t.id === Number(id)) || null;
  },

  // --- FUNNELS ---
  async getFunnels(clientId) {
    const data = await readDB();
    return (data.funnels || []).filter(f => f.client_id === Number(clientId)).sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
  },
  async getFunnel(id) {
    const data = await readDB();
    return (data.funnels || []).find(f => f.id === Number(id)) || null;
  },
  async getFunnelBySlug(slug) {
    const data = await readDB();
    return (data.funnels || []).find(f => f.public_slug === String(slug)) || null;
  },
  async createFunnel({ client_id, title, highlight_text, video_url, video_type, theme, bg_color, bg_image, cta_color, locked_btn_text, cta_text, form_fields, video_threshold }) {
    const defaultFields = [
      { name: 'nombre',  label: 'Nombre completo',      type: 'text',     required: true },
      { name: 'email',   label: 'Correo electrónico',   type: 'email',    required: true },
      { name: 'telefono',label: 'Teléfono / WhatsApp',   type: 'tel',      required: true },
      { name: 'empresa', label: 'Empresa',               type: 'text',     required: false },
      { name: 'mensaje', label: 'Mensaje',               type: 'textarea', required: false },
    ];
    
    const data = await readDB();
    const newFunnel = {
      id: await getNextId('funnels'),
      client_id: Number(client_id),
      public_slug: Math.random().toString(36).substring(2, 10),
      title: title || 'Sin título',
      highlight_text: highlight_text || '',
      video_url: video_url || '',
      video_type: video_type || 'youtube',
      theme: theme || '',
      bg_color: bg_color || '',
      bg_image: bg_image || '',
      cta_color: cta_color || '',
      locked_btn_text: locked_btn_text || '',
      cta_text: cta_text || '¡Quiero inscribirme!',
      form_fields: typeof form_fields === 'string' ? form_fields : JSON.stringify(form_fields || defaultFields),
      video_threshold: video_threshold || 90,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    if(!data.funnels) data.funnels = [];
    data.funnels.push(newFunnel);
    await writeDB(data);
    return newFunnel;
  },
  async updateFunnel(id, updates) {
    const data = await readDB();
    if(!data.funnels) data.funnels = [];
    const index = data.funnels.findIndex(f => f.id === Number(id));
    if (index === -1) return null;
    
    const allowed = ['title','highlight_text','video_url','video_type','theme','bg_color','bg_image','cta_color','locked_btn_text','cta_text','form_fields','video_threshold'];
    allowed.forEach(key => {
      if (updates[key] !== undefined) {
        if (key === 'form_fields' && typeof updates[key] !== 'string') {
          data.funnels[index][key] = JSON.stringify(updates[key]);
        } else {
          data.funnels[index][key] = updates[key];
        }
      }
    });
    data.funnels[index].updated_at = new Date().toISOString();
    
    await writeDB(data);
    return data.funnels[index];
  },
  async publishFunnel(id) {
    const data = await readDB();
    if(!data.funnels) return null;
    const fIndex = data.funnels.findIndex(f => f.id === Number(id));
    if (fIndex === -1) return null;
    
    const clientId = data.funnels[fIndex].client_id;
    
    // Deactivate others
    data.funnels.forEach(f => {
      if (f.client_id === clientId && f.id !== Number(id)) {
        f.status = 'draft';
      }
    });
    
    data.funnels[fIndex].status = 'published';
    data.funnels[fIndex].updated_at = new Date().toISOString();
    await writeDB(data);
    return data.funnels[fIndex];
  },
  async unpublishFunnel(id) {
    const data = await readDB();
    if(!data.funnels) return null;
    const fIndex = data.funnels.findIndex(f => f.id === Number(id));
    if (fIndex === -1) return null;
    
    data.funnels[fIndex].status = 'draft';
    data.funnels[fIndex].updated_at = new Date().toISOString();
    await writeDB(data);
    return data.funnels[fIndex];
  },
  async deleteFunnel(id, clientId) {
    const data = await readDB();
    if(!data.funnels) return;
    
    const fExists = data.funnels.some(f => f.id === Number(id) && f.client_id === Number(clientId));
    if (!fExists) return;
    
    data.funnels = data.funnels.filter(f => f.id !== Number(id));
    
    if(data.leads) {
        data.leads = data.leads.filter(l => l.funnel_id !== Number(id));
    }
    
    await writeDB(data);
    return true;
  },

  // --- LEADS ---
  async getLeads(funnelId) {
    const data = await readDB();
    return (data.leads || []).filter(l => l.funnel_id === Number(funnelId)).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  },
  async createLead(funnelId, leadData, ip, userAgent) {
    const data = await readDB();
    const newLead = {
      id: await getNextId('leads'),
      funnel_id: Number(funnelId),
      data_json: JSON.stringify(leadData),
      ip: ip || '',
      user_agent: userAgent || '',
      created_at: new Date().toISOString()
    };
    
    if(!data.leads) data.leads = [];
    data.leads.push(newLead);
    await writeDB(data);
    return newLead;
  },
  async getLeadCount(funnelId) {
    const data = await readDB();
    return (data.leads || []).filter(l => l.funnel_id === Number(funnelId)).length;
  }
};
