const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync('./demo-db.json', 'utf8'));

  // Migrate Clients
  console.log('Migrating clients...');
  for (const c of data.clients || []) {
    await prisma.client.create({
      data: {
        id: c.id,
        name: c.name,
        email: c.email,
        initials: c.initials,
        max_landings: c.max_landings
      }
    });
  }

  // Migrate Templates
  console.log('Migrating templates...');
  for (const t of data.templates || []) {
    await prisma.template.create({
      data: {
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        thumbnail: t.thumbnail,
        html: t.html,
        css: t.css
      }
    });
  }

  // Migrate Projects
  console.log('Migrating projects...');
  for (const p of data.projects || []) {
    await prisma.project.create({
      data: {
        id: p.id,
        public_slug: p.public_slug,
        client_id: p.client_id,
        name: p.name,
        template_id: p.template_id,
        html: p.html,
        css: p.css,
        json_data: p.json_data,
        created_at: new Date(p.created_at),
        updated_at: new Date(p.updated_at)
      }
    });
  }

  // Migrate Funnels
  console.log('Migrating funnels...');
  for (const f of data.funnels || []) {
    await prisma.funnel.create({
      data: {
        id: f.id,
        client_id: f.client_id,
        public_slug: f.public_slug,
        title: f.title,
        highlight_text: f.highlight_text,
        video_url: f.video_url,
        video_type: f.video_type,
        theme: f.theme,
        cta_text: f.cta_text,
        form_fields: JSON.stringify(f.form_fields),
        video_threshold: f.video_threshold,
        status: f.status,
        created_at: new Date(f.created_at),
        updated_at: new Date(f.updated_at)
      }
    });
  }

  // Migrate Leads
  console.log('Migrating leads...');
  const funnelIds = data.funnels?.map(f => f.id) || [];
  for (const l of data.leads || []) {
    if (!funnelIds.includes(l.funnel_id)) {
      console.log(`Skipping orphaned lead ${l.id} for funnel ${l.funnel_id}`);
      continue;
    }
    await prisma.lead.create({
      data: {
        id: l.id,
        funnel_id: l.funnel_id,
        data_json: JSON.stringify(l.data),
        ip: l.ip,
        user_agent: l.user_agent,
        created_at: new Date(l.created_at)
      }
    });
  }

  console.log('Migration complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
