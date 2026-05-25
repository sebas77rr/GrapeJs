const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  // --- CLIENTS ---
  async getClient(id) {
    return prisma.client.findUnique({ where: { id: Number(id) } });
  },
  async getClients() {
    return prisma.client.findMany();
  },

  // --- PROJECTS ---
  async getProjects(clientId) {
    return prisma.project.findMany({
      where: { client_id: Number(clientId) },
      orderBy: { updated_at: 'desc' }
    });
  },
  async getProject(id, clientId) {
    return prisma.project.findFirst({
      where: { id: Number(id), client_id: Number(clientId) }
    });
  },
  async getProjectBySlug(slug) {
    return prisma.project.findUnique({ where: { public_slug: String(slug) } });
  },
  async createProject({ client_id, name, template_id, json_data }) {
    return prisma.project.create({
      data: {
        client_id: Number(client_id),
        name: name || 'Sin título',
        public_slug: Math.random().toString(36).substring(2, 10),
        template_id: template_id ? Number(template_id) : null,
        json_data: json_data ? JSON.stringify(json_data) : null
      }
    });
  },
  async updateProject(id, clientId, json_data, html, css) {
    const p = await this.getProject(id, clientId);
    if (!p) return null;
    return prisma.project.update({
      where: { id: Number(id) },
      data: {
        json_data: json_data ? JSON.stringify(json_data) : p.json_data,
        html: html !== undefined ? html : p.html,
        css: css !== undefined ? css : p.css
      }
    });
  },
  async deleteProject(id, clientId) {
    const p = await this.getProject(id, clientId);
    if (!p) return;
    return prisma.project.delete({ where: { id: Number(id) } });
  },

  // --- TEMPLATES ---
  async getTemplates() {
    return prisma.template.findMany();
  },
  async getTemplate(id) {
    return prisma.template.findUnique({ where: { id: Number(id) } });
  },

  // --- FUNNELS ---
  async getFunnels(clientId) {
    return prisma.funnel.findMany({
      where: { client_id: Number(clientId) },
      orderBy: { updated_at: 'desc' }
    });
  },
  async getFunnel(id) {
    return prisma.funnel.findUnique({ where: { id: Number(id) } });
  },
  async getFunnelBySlug(slug) {
    return prisma.funnel.findUnique({ where: { public_slug: String(slug) } });
  },
  async createFunnel({ client_id, title, highlight_text, video_url, video_type, theme, bg_color, bg_image, cta_color, locked_btn_text, cta_text, form_fields, video_threshold }) {
    const defaultFields = [
      { name: 'nombre',  label: 'Nombre completo',      type: 'text',     required: true },
      { name: 'email',   label: 'Correo electrónico',   type: 'email',    required: true },
      { name: 'telefono',label: 'Teléfono / WhatsApp',   type: 'tel',      required: true },
      { name: 'empresa', label: 'Empresa',               type: 'text',     required: false },
      { name: 'mensaje', label: 'Mensaje',               type: 'textarea', required: false },
    ];
    return prisma.funnel.create({
      data: {
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
        status: 'draft'
      }
    });
  },
  async updateFunnel(id, updates) {
    const f = await this.getFunnel(id);
    if (!f) return null;
    const data = {};
    const allowed = ['title','highlight_text','video_url','video_type','theme','bg_color','bg_image','cta_color','locked_btn_text','cta_text','form_fields','video_threshold'];
    allowed.forEach(key => {
      if (updates[key] !== undefined) {
        if (key === 'form_fields' && typeof updates[key] !== 'string') {
          data[key] = JSON.stringify(updates[key]);
        } else {
          data[key] = updates[key];
        }
      }
    });
    return prisma.funnel.update({
      where: { id: Number(id) },
      data
    });
  },
  async publishFunnel(id) {
    const f = await this.getFunnel(id);
    if (!f) return null;
    // Deactivate others
    await prisma.funnel.updateMany({
      where: { client_id: f.client_id, id: { not: Number(id) } },
      data: { status: 'draft' }
    });
    return prisma.funnel.update({
      where: { id: Number(id) },
      data: { status: 'published' }
    });
  },
  async unpublishFunnel(id) {
    const f = await this.getFunnel(id);
    if (!f) return null;
    return prisma.funnel.update({
      where: { id: Number(id) },
      data: { status: 'draft' }
    });
  },
  async deleteFunnel(id, clientId) {
    const f = await prisma.funnel.findFirst({
      where: { id: Number(id), client_id: Number(clientId) }
    });
    if (!f) return;
    // Delete associated leads first
    await prisma.lead.deleteMany({ where: { funnel_id: Number(id) } });
    return prisma.funnel.delete({ where: { id: Number(id) } });
  },

  // --- LEADS ---
  async getLeads(funnelId) {
    return prisma.lead.findMany({
      where: { funnel_id: Number(funnelId) },
      orderBy: { created_at: 'desc' }
    });
  },
  async createLead(funnelId, data, ip, userAgent) {
    return prisma.lead.create({
      data: {
        funnel_id: Number(funnelId),
        data_json: JSON.stringify(data),
        ip: ip || '',
        user_agent: userAgent || ''
      }
    });
  },
  async getLeadCount(funnelId) {
    return prisma.lead.count({ where: { funnel_id: Number(funnelId) } });
  }
};
