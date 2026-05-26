import { useEffect, useRef, useState, useCallback } from "react";
import StudioEditor from "@grapesjs/studio-sdk/react";
import "@grapesjs/studio-sdk/style";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import gjsPresetWebpage from "grapesjs-preset-webpage";
import gjsBlocksBasic from "grapesjs-blocks-basic";
import gjsPluginForms from "grapesjs-plugin-forms";
import "./builder-theme.css";
import { Play, Pause, ExternalLink, Users, Trash2, Link2, MonitorPlay, Palette, Lock, Home, LayoutDashboard, MousePointerClick, Settings, Edit3, ArrowLeft, CheckCircle2, ChevronRight, Check, BarChart3 } from "lucide-react";

/* ─── GOOGLE FONTS ──────────────────────────────────────────────────────── */
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
  "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap";
document.head.appendChild(fontLink);

/* ─── GLOBAL STYLES ─────────────────────────────────────────────────────── */
const styleEl = document.createElement("style");
styleEl.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; overflow: hidden; }
  body { font-family: 'DM Sans', sans-serif; background: #f8fafc; color: #1e293b; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
  button { font-family: 'DM Sans', sans-serif; }
  select { font-family: 'DM Sans', sans-serif; }
`;
document.head.appendChild(styleEl);

/* ─── API CLIENT ─────────────────────────────────────────────────────────── */
const API = import.meta.env.PROD ? "/api" : "http://localhost:3001/api";
const BASE_URL = import.meta.env.PROD ? window.location.origin : "http://localhost:3001";

const api = {
  getClients: () => fetch(`${API}/clients`).then((r) => r.json()),
  getProjects: (clientId) =>
    fetch(`${API}/projects?client_id=${clientId}`).then((r) => r.json()),
  getProject: (id, clientId) =>
    fetch(`${API}/projects/${id}?client_id=${clientId}`).then((r) => r.json()),
  createProject: (body) =>
    fetch(`${API}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json()),
  saveProject: (id, clientId, jsonData, html, css) =>
    fetch(`${API}/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, json_data: jsonData, html, css }),
    }).then((r) => r.json()),
  deleteProject: (id, clientId) =>
    fetch(`${API}/projects/${id}?client_id=${clientId}`, {
      method: "DELETE",
    }).then((r) => r.json()),
  getTemplates: () => fetch(`${API}/templates`).then((r) => r.json()),
  // ── FUNNELS API ────────────────────────────────────────
  getFunnels: (clientId) =>
    fetch(`${API}/funnels?client_id=${clientId}`).then((r) => r.json()),
  getFunnel: (id) =>
    fetch(`${API}/funnels/${id}`).then((r) => r.json()),
  createFunnel: (body) =>
    fetch(`${API}/funnels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json()),
  updateFunnel: (id, body) =>
    fetch(`${API}/funnels/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json()),
  publishFunnel: (id) =>
    fetch(`${API}/funnels/${id}/publish`, { method: "PUT" }).then((r) => r.json()),
  unpublishFunnel: (id) =>
    fetch(`${API}/funnels/${id}/unpublish`, { method: "PUT" }).then((r) => r.json()),
  deleteFunnel: (id, clientId) =>
    fetch(`${API}/funnels/${id}?client_id=${clientId}`, { method: "DELETE" }).then((r) => r.json()),
  getLeads: (funnelId, clientId) =>
    fetch(`${API}/funnels/${funnelId}/leads?client_id=${clientId}`).then((r) => r.json()),
};

/* ─── NAV ITEMS ─────────────────────────────────────────────────────────── */
const NAV = [
  { id: "dashboard", label: "Dashboard" },
  { id: "landings", label: "Mis Landings" },
  { id: "funnels", label: "Funnels" },
  { id: "builder", label: "Editor" },
  { id: "analytics", label: "Analytics" },
  { id: "settings", label: "Ajustes" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD VIEW
═══════════════════════════════════════════════════════════════════════════ */
function DashboardView({ client, projects, onNavigate }) {
  const used = projects.length;
  const max = client?.max_landings || 1;
  const percent = Math.min((used / max) * 100, 100);

  const stats = [
    { label: "Landings activas", value: String(used), delta: `de ${max} permitidas` },
    { label: "Plantillas disponibles", value: "3", delta: "Actualizadas" },
    { label: "Última edición", value: used > 0 ? "Hoy" : "—", delta: used > 0 ? projects[0]?.name : "Sin proyectos" },
    { label: "Estado", value: used < max ? "Activo" : "Límite", delta: used < max ? "Puede crear más" : "Límite alcanzado" },
  ];

  return (
    <div style={v.dashRoot}>
      <div style={v.dashHeader}>
        <div>
          <h1 style={v.pageTitle}>Dashboard</h1>
          <p style={v.pageSubtitle}>
            Bienvenido, <strong style={{ color: "#a1a1aa" }}>{client?.name}</strong>. Gestiona tus landing pages.
          </p>
        </div>
        {used < max ? (
          <button style={v.btnPrimary} onClick={() => onNavigate("new")}>
            + Nueva Landing
          </button>
        ) : (
          <button style={{ ...v.btnPrimary, background: "#27272a", cursor: "not-allowed" }} disabled>
            Límite alcanzado
          </button>
        )}
      </div>

      {/* Usage bar */}
      <div style={v.usageCard}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ color: "#a1a1aa", fontSize: 13, fontWeight: 500 }}>Uso de Landing Pages</span>
          <span style={{ color: used >= max ? "#f87171" : "#4ade80", fontSize: 13, fontWeight: 600 }}>
            {used} / {max}
          </span>
        </div>
        <div style={v.progressTrack}>
          <div
            style={{
              ...v.progressBar,
              width: `${percent}%`,
              background: used >= max
                ? "linear-gradient(90deg,#ef4444,#dc2626)"
                : "linear-gradient(90deg,#6366f1,#818cf8)",
            }}
          />
        </div>
        {used >= max && (
          <p style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>
            ⚠️ Has alcanzado el límite de landing pages de tu plan. Contacta con soporte para ampliarlo.
          </p>
        )}
      </div>

      <div style={v.statsGrid}>
        {stats.map((s) => (
          <div key={s.label} style={v.statCard}>
            <div style={v.statLabel}>{s.label}</div>
            <div style={v.statValue}>{s.value}</div>
            <div style={{ color: "#52525b", fontSize: 11, marginTop: 6 }}>{s.delta}</div>
          </div>
        ))}
      </div>

      {projects.length > 0 && (
        <div style={v.section}>
          <div style={v.sectionHeader}>
            <span style={v.sectionTitle}>Tus Landing Pages</span>
            <button style={v.linkBtn} onClick={() => onNavigate("landings")}>Ver todas</button>
          </div>
          <div style={v.table}>
            <div style={v.tableHead}>
              <span style={{ flex: 3 }}>Nombre</span>
              <span style={{ flex: 2 }}>Creada</span>
              <span style={{ flex: 2 }}>Última edición</span>
              <span style={{ flex: 1 }}>Acción</span>
            </div>
            {projects.slice(0, 3).map((p) => (
              <div key={p.id} style={v.tableRow}>
                <span style={{ flex: 3, color: "#e4e4e7", fontSize: 13, fontWeight: 500 }}>
                  {p.name}
                </span>
                <span style={{ flex: 2, color: "#52525b", fontSize: 13 }}>
                  {new Date(p.created_at).toLocaleDateString("es-CO")}
                </span>
                <span style={{ flex: 2, color: "#52525b", fontSize: 13 }}>
                  {new Date(p.updated_at).toLocaleDateString("es-CO")}
                </span>
                <span style={{ flex: 1, display: "flex", gap: 6 }}>
                  <button style={v.tableBtn} onClick={() => onNavigate("classic-builder", p.id)}>
                    Editar Clásico
                  </button>
                  <button style={{...v.tableBtn, color: "#818cf8"}} onClick={() => onNavigate("builder", p.id)} title="Requiere Licencia en Producción">
                    Licencia
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {projects.length === 0 && (
        <div style={v.emptyState}>
          <div style={v.emptyIcon}><Palette size={48} color="#94a3b8" strokeWidth={1} /></div>
          <div style={v.emptyTitle}>Sin landing pages aún</div>
          <div style={v.emptyDesc}>Crea tu primera landing page usando una de nuestras plantillas.</div>
          <button style={{ ...v.btnPrimary, marginTop: 16 }} onClick={() => onNavigate("new")}>
            Crear mi primera landing
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LANDINGS LIST VIEW
═══════════════════════════════════════════════════════════════════════════ */
function LandingsView({ client, projects, onNavigate, onDelete, onRefresh }) {
  const used = projects.length;
  const max = client?.max_landings || 1;

  return (
    <div style={v.dashRoot}>
      <div style={v.dashHeader}>
        <div>
          <h1 style={v.pageTitle}>Mis Landings</h1>
          <p style={v.pageSubtitle}>
            {used} de {max} landing pages usadas
          </p>
        </div>
        {used < max ? (
          <button style={v.btnPrimary} onClick={() => onNavigate("new")}>
            + Nueva Landing
          </button>
        ) : (
          <div style={v.limitBadge}><Lock size={14} style={{ marginRight: 6 }}/> Límite alcanzado ({used}/{max})</div>
        )}
      </div>

      {projects.length === 0 ? (
        <div style={v.emptyState}>
          <div style={v.emptyIcon}><LayoutDashboard size={48} color="#94a3b8" strokeWidth={1} /></div>
          <div style={v.emptyTitle}>No tienes landing pages</div>
          <div style={v.emptyDesc}>Crea una usando nuestras plantillas profesionales.</div>
          <button style={{ ...v.btnPrimary, marginTop: 16 }} onClick={() => onNavigate("new")}>
            Crear landing
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {projects.map((p) => (
            <div key={p.id} style={v.pageCard}>
              <div style={v.pageCardThumb}>
                <div style={{ color: "#cbd5e1" }}><Palette size={32} /></div>
              </div>
              <div style={v.pageCardBody}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#e4e4e7", fontWeight: 600, fontSize: 14 }}>{p.name}</span>
                  <span style={{ ...v.badge, background: "rgba(34,197,94,0.12)", color: "#4ade80" }}>
                    Guardada
                  </span>
                </div>
                <div style={{ color: "#52525b", fontSize: 12, marginBottom: 16 }}>
                  Editada {new Date(p.updated_at).toLocaleDateString("es-CO")}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    style={{ ...v.btnPrimary, fontSize: 12, padding: "6px 14px", flex: 1, minWidth: "45%" }}
                    onClick={() => onNavigate("classic-builder", p.id)}
                  >
                    Editar Clásico
                  </button>
                  <button
                    style={{ ...v.btnGhost, fontSize: 12, padding: "6px 14px", color: "#818cf8", borderColor: "#818cf8", flex: 1, minWidth: "45%" }}
                    onClick={() => onNavigate("builder", p.id)}
                    title="Requiere Licencia en Producción"
                  >
                    Licencia
                  </button>
                  <button
                    style={{ ...v.btnPrimary, background: "#27272a", fontSize: 12, padding: "6px 14px", flex: 1 }}
                    onClick={() => window.open(`${BASE_URL}/p/${p.public_slug}`, "_blank")}
                  >
                    Ver URL
                  </button>
                  <button
                    style={{ ...v.btnGhost, fontSize: 12, padding: "6px 14px", color: "#f87171", borderColor: "#3f1212" }}
                    onClick={() => onDelete(p.id, p.name, onRefresh)}
                  >
                    Borrar
                  </button>
                </div>
                {p.public_slug && (
                  <div style={{ marginTop: 12, padding: "8px 10px", background: "rgba(0,0,0,0.2)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: "#a1a1aa", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      🔗 {BASE_URL.replace(/^https?:\/\//, '')}/p/<strong>{p.public_slug}</strong>
                    </span>
                    <button 
                      onClick={(e) => {
                        const btn = e.currentTarget;
                        btn.textContent = "✓ Copiado";
                        setTimeout(() => (btn.textContent = "Copiar"), 2000);
                        navigator.clipboard.writeText(`${BASE_URL}/p/${p.public_slug}`);
                      }}
                      style={{ background: "none", border: "none", color: "#4ade80", fontSize: 11, fontWeight: "bold", cursor: "pointer", padding: "0 0 0 8px" }}
                    >
                      Copiar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   NEW LANDING MODAL — Template Selector
═══════════════════════════════════════════════════════════════════════════ */
function NewLandingModal({ onClose, onConfirm }) {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [projectType, setProjectType] = useState("web");
  const [tab, setTab] = useState("template");

  useEffect(() => {
    api.getTemplates().then((data) => {
      setTemplates(data);
      if (data.length > 0) setSelected(data[0].id);
      setLoading(false);
    });
  }, []);

  const handleCreate = () => {
    if (!name.trim()) return;
    onConfirm({ name: name.trim(), template_id: selected, type: projectType });
  };

  const filteredTemplates = templates.filter(t => 
    projectType === "web" ? t.category !== "Email" : t.category === "Email"
  );

  return (
    <div style={v.overlay} onClick={onClose}>
      <div style={{ ...v.modal, maxWidth: 740, background: "#18181b", border: "1px solid #27272a", borderRadius: 12 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #27272a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#f4f4f5", fontWeight: 600, fontSize: 16 }}>New Project</div>
          <button style={{ background: "transparent", border: "none", color: "#a1a1aa", cursor: "pointer", fontSize: 18 }} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Project Type */}
          <div>
            <label style={{ color: "#a1a1aa", fontSize: 13, display: "block", marginBottom: 4 }}>Project Type</label>
            <div style={{ color: "#71717a", fontSize: 12, marginBottom: 12 }}>Select the type of project you want to create.</div>
            <div style={{ display: "flex", border: "1px solid #27272a", borderRadius: 8, overflow: "hidden" }}>
              <button
                style={{ flex: 1, padding: "10px", background: projectType === "web" ? "#27272a" : "transparent", color: projectType === "web" ? "#a78bfa" : "#a1a1aa", border: "none", cursor: "pointer", borderRight: "1px solid #27272a", fontWeight: projectType === "web" ? 600 : 400, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                onClick={() => setProjectType("web")}
              >
                🌐 Web
              </button>
              <button
                style={{ flex: 1, padding: "10px", background: projectType === "email" ? "#27272a" : "transparent", color: projectType === "email" ? "#a78bfa" : "#a1a1aa", border: "none", cursor: "pointer", fontWeight: projectType === "email" ? 600 : 400, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                onClick={() => setProjectType("email")}
              >
                ✉️ Email
              </button>
            </div>
          </div>

          {/* Project Name */}
          <div>
            <label style={{ color: "#a1a1aa", fontSize: 13, display: "block", marginBottom: 8 }}>Project Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. My new project"
              style={{ width: "100%", background: "#111116", border: "1px solid #27272a", borderRadius: 8, padding: "12px 14px", color: "#f4f4f5", fontSize: 14, outline: "none" }}
            />
          </div>

          {/* Tabs */}
          <div>
            <div style={{ display: "flex", borderBottom: "1px solid #27272a", marginBottom: 16 }}>
              <button
                style={{ flex: 1, padding: "12px", background: "transparent", color: tab === "prompt" ? "#a78bfa" : "#71717a", border: "none", borderBottom: tab === "prompt" ? "2px solid #a78bfa" : "2px solid transparent", cursor: "pointer", fontSize: 14, fontWeight: 500 }}
                onClick={() => setTab("prompt")}
              >
                Prompt
              </button>
              <button
                style={{ flex: 1, padding: "12px", background: "transparent", color: tab === "template" ? "#a78bfa" : "#71717a", border: "none", borderBottom: tab === "template" ? "2px solid #a78bfa" : "2px solid transparent", cursor: "pointer", fontSize: 14, fontWeight: 500 }}
                onClick={() => setTab("template")}
              >
                Template
              </button>
            </div>

            {tab === "prompt" ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#71717a", fontSize: 14 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
                IA<strong>Template</strong>.
              </div>
            ) : (
              <div>
                {loading ? (
                  <div style={{ color: "#52525b", fontSize: 13 }}>Cargando plantillas...</div>
                ) : filteredTemplates.length === 0 ? (
                  <div style={{ color: "#52525b", fontSize: 13, padding: "20px 0", textAlign: "center" }}>No hay plantillas para esta categoría.</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                    {filteredTemplates.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelected(t.id)}
                        style={{
                          border: selected === t.id ? "2px solid #8b5cf6" : "1px solid #27272a",
                          borderRadius: 8,
                          overflow: "hidden",
                          cursor: "pointer",
                          background: "#111116",
                          transition: "all 0.15s",
                        }}
                      >
                        <div style={{ height: 120, background: selected === t.id ? "rgba(139, 92, 246, 0.1)" : "#18181b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, borderBottom: "1px solid #27272a" }}>
                          {t.thumbnail}
                        </div>
                        <div style={{ padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "#e4e4e7", fontSize: 13, fontWeight: 500 }}>{t.label}</span>
                          <span style={{ color: "#71717a", fontSize: 14 }}>{projectType === "web" ? "🌐" : "✉️"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #27272a", display: "flex", justifyContent: "flex-end", background: "#18181b", borderRadius: "0 0 12px 12px" }}>
          <button
            style={{ background: "linear-gradient(to right, #9333ea, #7c3aed)", color: "#fff", border: "none", borderRadius: 6, padding: "10px 20px", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, opacity: !name.trim() || tab === "prompt" ? 0.5 : 1, cursor: !name.trim() || tab === "prompt" ? "not-allowed" : "pointer" }}
            disabled={!name.trim() || tab === "prompt"}
            onClick={handleCreate}
          >
            ✨ Create Project
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BUILDER VIEW — GrapesJS Studio SDK
═══════════════════════════════════════════════════════════════════════════ */
function BuilderView({ projectId, clientId, onBack }) {
  const [saveStatus, setSaveStatus] = useState("saved");
  const [projectName, setProjectName] = useState("");
  const clientIdRef = useRef(clientId);
  const projectIdRef = useRef(projectId);
  const editorRef = useRef(null);

  useEffect(() => {
    clientIdRef.current = clientId;
    projectIdRef.current = projectId;
  }, [clientId, projectId]);

  // Load project name
  useEffect(() => {
    if (projectId && clientId) {
      api.getProject(projectId, clientId).then((data) => {
        if (data.project) setProjectName(data.project.name);
      });
    }
  }, [projectId, clientId]);

  const saveStatusColor =
    saveStatus === "saved" ? "#4ade80" : saveStatus === "saving" ? "#facc15" : "#f87171";
  const saveStatusText =
    saveStatus === "saved" ? "Guardado" : saveStatus === "saving" ? "Guardando..." : "Sin guardar";

  const editorOptions = {
    licenseKey: "", // works on localhost without a license key
    project: {
      type: "web",
    },
    storage: {
      type: "self",
      onLoad: async () => {
        if (!projectIdRef.current || !clientIdRef.current) return {};
        try {
          const data = await api.getProject(projectIdRef.current, clientIdRef.current);
          if (data.project && data.project.json_data) {
            return data.project.json_data;
          }
          return {}; // Devuelve objeto vacío en lugar de undefined para evitar el crash del SDK
        } catch (e) {
          console.error("Error loading project:", e);
          return {};
        }
      },
      onSave: async (projectData, editorParam) => {
        if (!projectIdRef.current || !clientIdRef.current) return;
        setSaveStatus("saving");
        try {
          const ancestors = [];
          const cleanDataStr = JSON.stringify(projectData, function(key, value) {
            if (key === 'em' || key === '_em' || key === '_config' || key === 'storables' || key === 'modules') return undefined;
            if (key.startsWith('__react')) return undefined;
            if (typeof value !== "object" || value === null) return value;
            if (value instanceof Node || value instanceof Element) return undefined;
            while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) {
              ancestors.pop();
            }
            if (ancestors.includes(value)) return undefined;
            ancestors.push(value);
            return value;
          });

          const cleanData = JSON.parse(cleanDataStr);

          // Búsqueda profunda del editor real de GrapesJS
          function findEditor(obj, depth = 0) {
            if (!obj || depth > 2) return null;
            if (typeof obj.getHtml === 'function') return obj;
            if (obj.editor && typeof obj.editor.getHtml === 'function') return obj.editor;
            if (obj.core && typeof obj.core.getHtml === 'function') return obj.core;
            if (typeof obj.getEditor === 'function' && obj.getEditor() && typeof obj.getEditor().getHtml === 'function') return obj.getEditor();
            return null;
          }

          const realEditor = findEditor(editorParam) || findEditor(editorRef.current);

          let html = "";
          let css = "";

          if (realEditor) {
            try { html = realEditor.getHtml(); } catch(e){}
            try { css = realEditor.getCss(); } catch(e){}
          }

          // FALLBACK DEFINITIVO: Extraer directamente del DOM (Iframe del Canvas)
          if (!html || html.trim() === "") {
             try {
                const iframe = document.querySelector('iframe.gjs-frame');
                if (iframe && iframe.contentDocument) {
                   html = iframe.contentDocument.body.innerHTML;
                   
                   const styles = iframe.contentDocument.querySelectorAll('style');
                   styles.forEach(s => css += s.innerHTML + "\\n");
                }
             } catch (e) {
                console.error("Fallo extracción del iframe", e);
             }
          }

          // Si el JSON contiene la info, guardarla cruda para debug
          if (!html || html.trim() === "") {
             html = "<!-- Error crítico: HTML vacío. Revisa la consola -->";
          }

          // Si falla todo, envía un fallback para no mostrar el diseño roto
          if (!html || html.trim() === "") {
             html = "<!-- Editor vacío o error de exportación -->";
          }

          await api.saveProject(projectIdRef.current, clientIdRef.current, cleanData, html, css);
          setSaveStatus("saved");
        } catch (e) {
          console.error("Error saving project:", e);
          setSaveStatus("unsaved");
        }
      },
    },
    templates: {
      onLoad: async () => {
        try {
          return await api.getTemplates();
        } catch {
          return [];
        }
      },
    },
  };

  return (
    <div style={b.root}>
      {/* ── TOPBAR ── */}
      <div style={b.topbar}>
        <div style={b.topLeft}>
          <button style={b.backBtn} onClick={onBack}>
            ← Volver
          </button>
          <div style={{ height: 18, width: 1, background: "#1c1c22" }} />
          <span style={{ color: "#71717a", fontSize: 13, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {projectName || "Cargando..."}
          </span>
        </div>
        <div style={b.topRight}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: saveStatusColor }} />
            <span style={{ color: "#52525b", fontSize: 12 }}>{saveStatusText}</span>
          </div>
          <div style={{ height: 18, width: 1, background: "#1c1c22" }} />
          <div style={{ color: "#52525b", fontSize: 11, padding: "4px 8px", background: "rgba(99,102,241,0.1)", borderRadius: 5, color: "#818cf8" }}>
            GrapesJS Studio SDK
          </div>
        </div>
      </div>

      {/* ── STUDIO EDITOR ── */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <StudioEditor
          style={{ height: "100%", width: "100%" }}
          options={editorOptions}
          onLoad={(editor) => {
            editorRef.current = editor;
            // Track changes
            editor.on("change:changesCount", () => {
              setSaveStatus("unsaved");
            });
          }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CLASSIC BUILDER VIEW — GrapesJS Open Source
═══════════════════════════════════════════════════════════════════════════ */
function ClassicBuilderView({ projectId, clientId, onBack }) {
  const [saveStatus, setSaveStatus] = useState("saved");
  const [projectName, setProjectName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId && clientId) {
      api.getProject(projectId, clientId).then((data) => {
        if (data.project) {
          setProjectName(data.project.name);
          initEditor(data.project.json_data);
        }
      });
    }
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [projectId, clientId]);

  const initEditor = (initialData) => {
    if (editorRef.current || !containerRef.current) return;

    const editor = grapesjs.init({
      container: containerRef.current,
      fromElement: false,
      height: '100%',
      width: 'auto',
      storageManager: false,
      plugins: [gjsPresetWebpage, gjsBlocksBasic, gjsPluginForms],
      pluginsOpts: {
        [gjsPresetWebpage]: {},
        [gjsBlocksBasic]: {
          blocks: ['column1','column2','column3','column3-7','text','link','image','video','map','link-block','quote','text-basic'],
          flexGrid: true,
          stylePrefix: 'gjs-',
          addBasicStyle: true,
        },
        [gjsPluginForms]: {},
      },
      blockManager: {
        appendTo: '.gjs-pn-views-container',
        blocks: []
      },
      deviceManager: {
        devices: [
          { name: 'Desktop', width: '' },
          { name: 'Tablet', width: '768px', widthMedia: '992px' },
          { name: 'Mobile', width: '320px', widthMedia: '480px' },
        ]
      },
      projectData: initialData && Object.keys(initialData).length > 0 ? initialData : null,
    });

    editorRef.current = editor;
    setLoading(false);

    editor.on("update", () => setSaveStatus("unsaved"));
  };

  // Esconder/mostrar la barra lateral rosada del app (no la de GrapesJS)
  const toggleAppSidebar = () => {
    const sidebar = document.querySelector('nav');
    if (sidebar) {
      if (sidebarOpen) {
        sidebar.style.display = 'none';
      } else {
        sidebar.style.display = 'flex';
      }
      setSidebarOpen(!sidebarOpen);
    }
  };

  const saveStatusColor = saveStatus === "saved" ? "#4ade80" : saveStatus === "saving" ? "#facc15" : "#f87171";
  const saveStatusText = saveStatus === "saved" ? "Guardado" : saveStatus === "saving" ? "Guardando..." : "Sin guardar";

  const handleManualSave = async () => {
    if (!editorRef.current) return;
    setSaveStatus("saving");
    try {
      const projectData = editorRef.current.getProjectData();
      const html = editorRef.current.getHtml();
      const css = editorRef.current.getCss();
      await api.saveProject(projectId, clientId, projectData, html, css);
      setSaveStatus("saved");
    } catch (e) {
      console.error("Error saving classic project", e);
      setSaveStatus("unsaved");
    }
  };

  return (
    <div style={b.root}>
      {/* ── TOPBAR ── */}
      <div style={b.topbar}>
        <div style={b.topLeft}>
          <button
            style={{ ...b.backBtn, background: sidebarOpen ? '#f1f5f9' : '#DB2C52', color: sidebarOpen ? '#475569' : '#fff', transition: 'all 0.2s' }}
            onClick={toggleAppSidebar}
            title={sidebarOpen ? 'Ocultar panel lateral' : 'Mostrar panel lateral'}
          >
            {sidebarOpen ? '◀ Ocultar Panel' : '▶ Mostrar Panel'}
          </button>
          <div style={{ height: 18, width: 1, background: "#e2e8f0" }} />
          <button style={b.backBtn} onClick={onBack}>← Volver</button>
          <div style={{ height: 18, width: 1, background: "#e2e8f0" }} />
          <span style={{ color: "#71717a", fontSize: 13, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {projectName || "Cargando..."}
          </span>
        </div>
        <div style={b.topRight}>
          <button style={{...v.btnPrimary, background: "#4f46e5", padding: "6px 18px", fontSize: 13, borderRadius: 8}} onClick={handleManualSave}>
            💾 Guardar
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: saveStatusColor, boxShadow: `0 0 6px ${saveStatusColor}` }} />
            <span style={{ color: "#64748b", fontSize: 12 }}>{saveStatusText}</span>
          </div>
          <div style={{ height: 18, width: 1, background: "#e2e8f0" }} />
          <div style={{ color: "#10b981", fontSize: 11, padding: "4px 10px", background: "rgba(16,185,129,0.08)", borderRadius: 6, fontWeight: 600, border: '1px solid rgba(16,185,129,0.2)' }}>
            ✓ Open Source
          </div>
        </div>
      </div>

      {/* ── CLASSIC EDITOR ── */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: 'column', alignItems: "center", justifyContent: "center", background: "#f8fafc", zIndex: 10, gap: 12 }}>
            <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTop: '3px solid #4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: '#64748b', fontSize: 14 }}>Cargando Editor...</span>
          </div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FUNNELS LIST VIEW
═══════════════════════════════════════════════════════════════════════════ */
function FunnelsListView({ clientId, onNavigate }) {
  const [funnels, setFunnels] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!clientId) return;
    setLoading(true);
    api.getFunnels(clientId).then(data => {
      setFunnels(data.funnels || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id, name) => {
    if (!confirm(`¿Eliminar funnel "${name}"?`)) return;
    await api.deleteFunnel(id, clientId);
    load();
  };

  const handlePublish = async (id) => {
    await api.publishFunnel(id);
    load();
  };

  const handleUnpublish = async (id) => {
    await api.unpublishFunnel(id);
    load();
  };

  const statusColor = (s) => s === 'published' ? '#4ade80' : '#facc15';
  const statusLabel = (s) => s === 'published' ? 'Activo' : 'Borrador';

  const used = funnels.length;
  const max = 5;

  return (
    <div style={v.dashRoot}>
      <div style={v.dashHeader}>
        <div>
          <h1 style={v.pageTitle} style={{ display: "flex", alignItems: "center", gap: 10 }}><MonitorPlay size={24} color="#4f46e5"/> Video Funnels</h1>
          <p style={v.pageSubtitle}>{used} de {max} funnels usados (Max 1 Activo).</p>
        </div>
        {used < max ? (
          <button style={v.btnPrimary} onClick={() => onNavigate('funnel-wizard')}>
            + Nuevo Funnel
          </button>
        ) : (
          <div style={v.limitBadge}><Lock size={14} style={{ marginRight: 6 }}/> Límite ({used}/{max})</div>
        )}
      </div>

      {loading ? (
        <div style={{ color: '#52525b', fontSize: 13, padding: 20 }}>Cargando funnels...</div>
      ) : funnels.length === 0 ? (
        <div style={v.emptyState}>
          <div style={v.emptyIcon}><MonitorPlay size={48} color="#94a3b8" strokeWidth={1} /></div>
          <div style={v.emptyTitle}>Sin funnels aún</div>
          <div style={v.emptyDesc}>Crea tu primer embudo de ventas con video para captar leads de alta calidad.</div>
          <button style={{ ...v.btnPrimary, marginTop: 16 }} onClick={() => onNavigate('funnel-wizard')}>
            Crear mi primer funnel
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
          {funnels.map(f => (
            <div key={f.id} style={{ ...v.pageCard, position: 'relative' }}>
              <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #1c1c22', position: 'relative' }}>
                <span style={{ fontSize: 40 }}>🎬</span>
                <div style={{ position: 'absolute', top: 8, right: 8, background: `rgba(${f.status === 'published' ? '74,222,128' : '250,204,21'},0.15)`, color: statusColor(f.status), fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>
                  {statusLabel(f.status)}
                </div>
              </div>
              <div style={v.pageCardBody}>
                <div style={{ color: '#e4e4e7', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{f.title}</div>
                <div style={{ color: '#52525b', fontSize: 12, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.highlight_text}</div>
                <div style={{ color: '#3f3f46', fontSize: 11, marginBottom: 14 }}>Video: {f.video_type?.toUpperCase()} · Umbral: {f.video_threshold}%</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {f.status === 'draft' ? (
                    <button style={{ ...v.btnPrimary, fontSize: 11, padding: '5px 12px', background: 'linear-gradient(135deg,#22c55e,#16a34a)' }} onClick={() => handlePublish(f.id)}>
                      <Play size={14} style={{ marginRight: 6 }}/> Activar
                    </button>
                  ) : (
                    <button style={{ ...v.btnPrimary, fontSize: 11, padding: '5px 12px', background: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1" }} onClick={() => handleUnpublish(f.id)}>
                      <Pause size={14} style={{ marginRight: 6 }}/> Desactivar
                    </button>
                  )}
                  <button style={{ ...v.btnPrimary, fontSize: 11, padding: '5px 12px', background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }} onClick={() => onNavigate('funnel-wizard', f.id)}>
                    ✏️ Editar
                  </button>
                  <button style={{ ...v.btnPrimary, fontSize: 11, padding: '5px 12px', background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }} onClick={() => window.open(`${BASE_URL}/f/${f.public_slug}`, '_blank')}>
                    <ExternalLink size={14} style={{ marginRight: 6 }}/> Ver
                  </button>
                  <button style={{ ...v.btnPrimary, fontSize: 11, padding: '5px 12px', background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }} onClick={() => onNavigate('leads', f.id)}>
                    <Users size={14} style={{ marginRight: 6 }}/> Leads {f.lead_count > 0 ? `(${f.lead_count})` : ''}
                  </button>
                  <button style={{ ...v.btnGhost, fontSize: 11, padding: '5px 10px', color: '#f87171', borderColor: '#3f1212' }} onClick={() => handleDelete(f.id, f.title)}><Trash2 size={14} /></button>
                </div>
                {f.public_slug && (
                  <div style={{ marginTop: 10, padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: "#64748b", fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      <Link2 size={12} style={{ marginRight: 4, verticalAlign: "middle" }}/> /f/<strong>{f.public_slug}</strong>
                    </span>
                    <button
                      onClick={(e) => {
                        const target = e.currentTarget;
                        target.textContent = '✓';
                        setTimeout(() => (target.textContent = 'Copiar'), 2000);
                        navigator.clipboard.writeText(`${BASE_URL}/f/${f.public_slug}`);
                      }}
                      style={{ background: 'none', border: 'none', color: '#4ade80', fontSize: 11, fontWeight: 'bold', cursor: 'pointer', padding: '0 0 0 8px' }}
                    >
                      Copiar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FUNNEL WIZARD VIEW — Step-by-step funnel creator
═══════════════════════════════════════════════════════════════════════════ */
function FunnelWizardView({ clientId, funnelId, onBack }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!funnelId);
  const [created, setCreated] = useState(null);
  const [form, setForm] = useState({
    title: '',
    highlight_text: '',
    video_url: '',
    video_type: 'youtube',
    theme: '',
    bg_color: '',
    bg_image: '',
    cta_color: '#DB2C52',
    cta_text: 'Quiero inscribirme',
    locked_btn_text: 'Ve el video para desbloquear el beneficio',
    video_threshold: 90,
    form_fields: [
      { name: 'nombre', label: 'Nombre completo', type: 'text', required: true },
      { name: 'email', label: 'Correo electrónico', type: 'email', required: true },
      { name: 'telefono', label: 'Teléfono / WhatsApp', type: 'tel', required: true },
      { name: 'empresa', label: 'Empresa', type: 'text', required: false },
      { name: 'mensaje', label: 'Mensaje', type: 'textarea', required: false },
    ],
  });

  useEffect(() => {
    if (funnelId) {
      api.getFunnel(funnelId).then(({ funnel }) => {
        let parsed = funnel.form_fields;
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed);
            if (typeof parsed === 'string') parsed = JSON.parse(parsed);
          } catch(e) { parsed = []; }
        }
        setForm({
          title: funnel.title || '',
          highlight_text: funnel.highlight_text || '',
          video_url: funnel.video_url || '',
          video_type: funnel.video_type || 'youtube',
          theme: funnel.theme || '',
          bg_color: funnel.bg_color || '',
          bg_image: funnel.bg_image || '',
          cta_color: funnel.cta_color || '#DB2C52',
          cta_text: funnel.cta_text || 'Quiero inscribirme',
          locked_btn_text: funnel.locked_btn_text || 'Ve el video para desbloquear el beneficio',
          video_threshold: funnel.video_threshold || 90,
          form_fields: parsed || [],
        });
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [funnelId]);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  
  const addField = () => {
    setForm(prev => ({
      ...prev,
      form_fields: [...prev.form_fields, { name: 'campo_' + Date.now(), label: 'Nuevo campo', type: 'text', required: false }]
    }));
  };
  const updateField = (idx, key, val) => {
    const fields = [...form.form_fields];
    fields[idx] = { ...fields[idx], [key]: val };
    setForm(prev => ({ ...prev, form_fields: fields }));
  };
  const removeField = (idx) => {
    setForm(prev => ({ ...prev, form_fields: prev.form_fields.filter((_, i) => i !== idx) }));
  };
  const moveField = (idx, dir) => {
    if (idx + dir < 0 || idx + dir >= form.form_fields.length) return;
    const fields = [...form.form_fields];
    const temp = fields[idx];
    fields[idx] = fields[idx + dir];
    fields[idx + dir] = temp;
    setForm(prev => ({ ...prev, form_fields: fields }));
  };

  const canNext = () => {
    if (step === 1) return form.title.trim() && form.highlight_text.trim();
    if (step === 2) return form.video_url.trim();
    if (step === 3) return form.cta_text.trim();
    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, form_fields: JSON.stringify(form.form_fields) };
      let result;
      if (funnelId) {
        result = await api.updateFunnel(funnelId, payload);
      } else {
        result = await api.createFunnel({ ...payload, client_id: clientId });
      }
      
      if (result.funnel) {
        if (!funnelId) {
          await api.publishFunnel(result.funnel.id);
        }
        setCreated(result.funnel);
        setStep(5);
      }
    } catch(e) {
      alert('Error al guardar el funnel');
    }
    setSaving(false);
  };

  const totalSteps = 4;

  const inputStyle = {
    width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8,
    padding: '12px 14px', color: '#0f172a', fontSize: 14, outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
  };
  const labelStyle = { color: '#475569', fontSize: 13, display: 'block', marginBottom: 8, fontWeight: 600 };
  const hintStyle = { color: '#64748b', fontSize: 12, marginTop: 6 };

  if (loading) return <div style={{ padding: 40, color: '#52525b' }}>Cargando funnel...</div>;

  return (
    <div style={v.dashRoot}>
      <div style={v.dashHeader}>
        <div>
          <h1 style={v.pageTitle}>🎯 Nuevo Video Funnel</h1>
          <p style={v.pageSubtitle}>Paso {Math.min(step, totalSteps)} de {totalSteps}</p>
        </div>
        <button style={v.btnGhost} onClick={onBack}>← Volver a Funnels</button>
      </div>

      {/* Progress bar */}
      <div style={{ background: '#e2e8f0', borderRadius: 99, height: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#DB2C52,#C02245)', width: `${(Math.min(step, totalSteps) / totalSteps) * 100}%`, transition: 'width 0.4s ease' }} />
      </div>

      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 32, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        {/* STEP 1: Title + Text + Apariencia */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ color: '#0f172a', fontSize: 18, fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>📝 Contenido de la landing</div>
            <div>
              <label style={labelStyle}>Título principal</label>
              <input style={inputStyle} placeholder="Ej: Descubre cómo duplicar tus ventas" value={form.title} onChange={e => update('title', e.target.value)} />
              <div style={hintStyle}>El título grande que verá el visitante al entrar.</div>
            </div>
            <div>
              <label style={labelStyle}>Texto destacado</label>
              <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Ej: En este video exclusivo te mostramos la estrategia que usamos con más de 200 clientes..." value={form.highlight_text} onChange={e => update('highlight_text', e.target.value)} />
            </div>
            
            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px dashed #cbd5e1' }}>
              <label style={labelStyle}>Apariencia Base (Tema)</label>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button onClick={() => { update('theme', 'dark'); update('bg_color', ''); update('bg_image', ''); }} style={{
                  flex: 1, padding: '16px', background: '#0f172a',
                  border: form.theme === 'dark' ? '2px solid #DB2C52' : '1px solid #334155',
                  borderRadius: 8, color: '#f8fafc', cursor: 'pointer', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🌙</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Dark Premium</div>
                </button>
                <button onClick={() => { update('theme', 'light'); update('bg_color', ''); update('bg_image', ''); }} style={{
                  flex: 1, padding: '16px', background: '#ffffff',
                  border: form.theme === 'light' ? '2px solid #DB2C52' : '1px solid #cbd5e1',
                  borderRadius: 8, color: '#0f172a', cursor: 'pointer', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>☀️</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Light Minimal</div>
                </button>
              </div>

              <label style={labelStyle}>Fondo Personalizado (Opcional - Sobrescribe el tema)</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...labelStyle, fontSize: 12, fontWeight: 500 }}>Color Sólido</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="color" style={{ width: 50, height: 42, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer' }} value={form.bg_color || '#ffffff'} onChange={e => { update('bg_color', e.target.value); update('bg_image', ''); update('theme', ''); }} />
                    <input style={{ ...inputStyle, flex: 1 }} placeholder="#HEX" value={form.bg_color} onChange={e => { update('bg_color', e.target.value); update('bg_image', ''); update('theme', ''); }} />
                  </div>
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ ...labelStyle, fontSize: 12, fontWeight: 500 }}>URL de Imagen de Fondo</label>
                  <input style={inputStyle} placeholder="https://..." value={form.bg_image} onChange={e => { update('bg_image', e.target.value); update('bg_color', ''); update('theme', ''); }} />
                </div>
              </div>
              <div style={hintStyle}>Si pones una imagen, el sistema se encargará de hacerla lucir bien añadiéndole un filtro para no perder legibilidad.</div>
            </div>
          </div>
        )}

        {/* STEP 2: Video */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ color: '#0f172a', fontSize: 18, fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>🎬 Configuración del video</div>
            <div>
              <label style={labelStyle}>Tipo de video</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['youtube', 'vimeo', 'mp4'].map(t => (
                  <button key={t} onClick={() => update('video_type', t)} style={{
                    flex: 1, padding: '12px', background: form.video_type === t ? '#fff1f2' : '#f8fafc',
                    border: form.video_type === t ? '2px solid #DB2C52' : '1px solid #e2e8f0',
                    borderRadius: 8, color: form.video_type === t ? '#DB2C52' : '#64748b', cursor: 'pointer',
                    fontSize: 14, fontWeight: form.video_type === t ? 600 : 500, fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {t === 'youtube' ? '▶ YouTube' : t === 'vimeo' ? '🎥 Vimeo' : '📁 MP4'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>URL del video</label>
              <input style={inputStyle} placeholder={form.video_type === 'youtube' ? 'https://www.youtube.com/watch?v=...' : form.video_type === 'vimeo' ? 'https://vimeo.com/...' : 'https://miserver.com/video.mp4'} value={form.video_url} onChange={e => update('video_url', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Porcentaje para desbloquear botón: <strong style={{ color: '#DB2C52' }}>{form.video_threshold}%</strong></label>
              <input type="range" min={50} max={100} step={5} value={form.video_threshold} onChange={e => update('video_threshold', Number(e.target.value))} style={{ width: '100%', accentColor: '#DB2C52' }} />
              <div style={hintStyle}>El botón CTA se activará cuando el usuario haya visto este porcentaje del video.</div>
            </div>
          </div>
        )}

        {/* STEP 3: CTA + Form Fields */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ color: '#0f172a', fontSize: 18, fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>🟢 Botón CTA y Formulario</div>
            
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Color del botón CTA</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="color" style={{ width: 50, height: 42, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer' }} value={form.cta_color} onChange={e => update('cta_color', e.target.value)} />
                  <input style={{ ...inputStyle, flex: 1 }} value={form.cta_color} onChange={e => update('cta_color', e.target.value)} />
                </div>
              </div>
              <div style={{ flex: 2 }}>
                <label style={labelStyle}>Texto del botón principal (CTA)</label>
                <input style={inputStyle} placeholder="Quiero inscribirme" value={form.cta_text} onChange={e => update('cta_text', e.target.value)} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Texto del botón cuando está bloqueado</label>
              <input style={inputStyle} placeholder="Ve el video para desbloquear..." value={form.locked_btn_text} onChange={e => update('locked_btn_text', e.target.value)} />
              <div style={hintStyle}>Mensaje llamativo que incita a ver el video completo.</div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Campos del formulario</label>
                <button onClick={addField} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>+ Añadir campo</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {form.form_fields.map((field, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button onClick={() => moveField(i, -1)} disabled={i === 0} style={{ border: 'none', background: 'transparent', cursor: 'pointer', opacity: i === 0 ? 0.3 : 1 }}>↑</button>
                      <button onClick={() => moveField(i, 1)} disabled={i === form.form_fields.length - 1} style={{ border: 'none', background: 'transparent', cursor: 'pointer', opacity: i === form.form_fields.length - 1 ? 0.3 : 1 }}>↓</button>
                    </div>
                    
                    <input style={{ ...inputStyle, flex: 1, padding: '8px' }} placeholder="Etiqueta (Ej: Nombre)" value={field.label} onChange={e => { 
                      const val = e.target.value;
                      const fields = [...form.form_fields];
                      fields[i] = { ...fields[i], label: val, name: val.toLowerCase().replace(/\\W+/g, '_') };
                      setForm(prev => ({ ...prev, form_fields: fields }));
                    }} />
                    
                    <select style={{ ...inputStyle, width: '120px', padding: '8px' }} value={field.type} onChange={e => updateField(i, 'type', e.target.value)}>
                      <option value="text">Texto</option>
                      <option value="email">Email</option>
                      <option value="tel">Teléfono</option>
                      <option value="number">Número</option>
                      <option value="textarea">Texto largo</option>
                    </select>

                    <button onClick={() => updateField(i, 'required', !field.required)} style={{ background: field.required ? '#fff1f2' : '#f1f5f9', border: '1px solid', borderColor: field.required ? '#fecdd3' : '#e2e8f0', color: field.required ? '#e11d48' : '#64748b', fontSize: 11, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                      {field.required ? 'Obligatorio' : 'Opcional'}
                    </button>
                    
                    <button onClick={() => removeField(i)} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Preview + Confirm */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ color: '#0f172a', fontSize: 18, fontWeight: 700, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>👁 Preview y Confirmación</div>
            <div style={{ background: form.bg_color || (form.theme === 'dark' ? '#0f172a' : '#f8fafc'), backgroundImage: form.bg_image ? `url(${form.bg_image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 12, padding: 32, border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
              {form.bg_image && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />}
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: form.bg_image || form.theme === 'dark' || form.bg_color ? '#ffffff' : '#0f172a' }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{form.title || 'Sin título'}</h2>
                <p style={{ fontSize: 15, marginTop: 8, opacity: 0.8 }}>{form.highlight_text || 'Sin descripción'}</p>
                
                <div style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', borderRadius: 12, padding: 30, margin: '24px auto', maxWidth: 400, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize: 40 }}>🎬</span>
                  <div style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>{form.video_type.toUpperCase()} · Desbloqueo al {form.video_threshold}%</div>
                </div>

                <div style={{ display: 'inline-block', background: form.cta_color, color: '#ffffff', padding: '12px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  🔒 {form.locked_btn_text}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Success */}
        {step === 5 && created && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
            <h2 style={{ color: '#0f172a', fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>{funnelId ? '¡Funnel actualizado!' : '¡Funnel creado y publicado!'}</h2>
            <p style={{ color: "#64748b", fontSize: 15, marginBottom: 24 }}>{funnelId ? 'Tus cambios ya están en vivo.' : 'Tu embudo de ventas está listo para recibir visitantes.'}</p>
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 24px', border: '1px dashed #cbd5e1', display: 'inline-block', marginBottom: 24 }}>
              <div style={{ color: '#64748b', fontSize: 11, marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em' }}>ENLACE PÚBLICO</div>
              <div style={{ color: '#DB2C52', fontSize: 16, fontWeight: 700 }}>{BASE_URL}/f/{created.public_slug}</div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button style={v.btnPrimary} onClick={() => window.open(`${BASE_URL}/f/${created.public_slug}`, '_blank')}>
                🚀 Abrir Landing
              </button>
              <button style={v.btnGhost} onClick={onBack}>
                ← Volver a Funnels
              </button>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        {step <= totalSteps && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
            <button style={v.btnGhost} onClick={() => step > 1 ? setStep(step - 1) : onBack()} disabled={saving}>
              {step === 1 ? '← Cancelar' : '← Anterior'}
            </button>
            {step < totalSteps ? (
              <button style={{ ...v.btnPrimary, background: '#DB2C52', opacity: canNext() ? 1 : 0.4, cursor: canNext() ? 'pointer' : 'not-allowed' }} disabled={!canNext()} onClick={() => setStep(step + 1)}>
                Siguiente →
              </button>
            ) : (
              <button style={{ ...v.btnPrimary, background: 'linear-gradient(135deg,#DB2C52,#C02245)', opacity: saving ? 0.5 : 1 }} disabled={saving} onClick={handleSave}>
                {saving ? 'Guardando...' : (funnelId ? '💾 Guardar Cambios' : '🚀 Crear y Publicar Funnel')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
/* ═══════════════════════════════════════════════════════════════════════════
   LEADS VIEW — Lead management panel
═══════════════════════════════════════════════════════════════════════════ */
function LeadsView({ funnelId, clientId, onBack }) {
  const [leads, setLeads] = useState([]);
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!funnelId || !clientId) return;
    Promise.all([
      api.getLeads(funnelId, clientId),
      api.getFunnel(funnelId),
    ]).then(([leadsData, funnelData]) => {
      setLeads(leadsData.leads || []);
      const fData = funnelData.funnel;
      if (fData && typeof fData.form_fields === 'string') {
        try {
          fData.form_fields = JSON.parse(fData.form_fields);
          if (typeof fData.form_fields === 'string') {
            fData.form_fields = JSON.parse(fData.form_fields);
          }
        } catch (e) {
          fData.form_fields = [];
        }
      }
      setFunnel(fData || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [funnelId, clientId]);

  const exportCSV = () => {
    if (leads.length === 0) return;
    const fields = funnel?.form_fields?.map(f => f.name) || Object.keys(leads[0]?.data || {});
    const header = ['Fecha', ...fields].join(',');
    const rows = leads.map(l => {
      const date = new Date(l.created_at).toLocaleString('es-CO');
      const vals = fields.map(f => `"${(l.data?.[f] || '').toString().replace(/"/g, '""')}"`);
      return [date, ...vals].join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${funnel?.title?.replace(/\s+/g, '_') || funnelId}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div style={{ color: '#52525b', padding: 40 }}>Cargando leads...</div>;

  return (
    <div style={v.dashRoot}>
      <div style={v.dashHeader}>
        <div>
          <h1 style={v.pageTitle}><Users size={14} style={{ marginRight: 6 }}/> Leads — {funnel?.title || 'Funnel'}</h1>
          <p style={v.pageSubtitle}>{leads.length} contacto{leads.length !== 1 ? 's' : ''} recibido{leads.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {leads.length > 0 && (
            <button style={{ ...v.btnPrimary, background: 'linear-gradient(135deg,#22c55e,#16a34a)' }} onClick={exportCSV}>
              📥 Exportar CSV
            </button>
          )}
          <button style={v.btnGhost} onClick={onBack}>← Volver</button>
        </div>
      </div>

      {/* Stats */}
      <div style={v.statsGrid}>
        <div style={v.statCard}>
          <div style={v.statLabel}>TOTAL LEADS</div>
          <div style={v.statValue}>{leads.length}</div>
        </div>
        <div style={v.statCard}>
          <div style={v.statLabel}>ÚLTIMO LEAD</div>
          <div style={{ ...v.statValue, fontSize: 16 }}>{leads.length > 0 ? new Date(leads[0].created_at).toLocaleDateString('es-CO') : '—'}</div>
        </div>
        <div style={v.statCard}>
          <div style={v.statLabel}>ESTADO FUNNEL</div>
          <div style={{ ...v.statValue, color: funnel?.status === 'published' ? '#4ade80' : '#facc15', fontSize: 16 }}>
            {funnel?.status === 'published' ? '🟢 Publicado' : '🟡 Borrador'}
          </div>
        </div>
      </div>

      {/* Leads Table */}
      {leads.length === 0 ? (
        <div style={v.emptyState}>
          <div style={v.emptyIcon}>📭</div>
          <div style={v.emptyTitle}>Sin leads aún</div>
          <div style={v.emptyDesc}>Comparte el enlace del funnel y los leads aparecerán aquí en tiempo real.</div>
          <div style={{ marginTop: 16, padding: '10px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, color: '#4ade80', fontSize: 13 }}>
            🔗 {BASE_URL}/f/{funnel?.public_slug}
          </div>
        </div>
      ) : (
        <div style={v.table}>
          <div style={v.tableHead}>
            <span style={{ flex: 1 }}>Fecha</span>
            {(funnel?.form_fields || []).filter(f => f.required).map(f => (
              <span key={f.name} style={{ flex: 2 }}>{f.label}</span>
            ))}
          </div>
          {leads.map((lead) => (
            <div key={lead.id} style={v.tableRow}>
              <span style={{ flex: 1, color: '#3f3f46', fontSize: 13, fontWeight: 500 }}>
                {new Date(lead.created_at).toLocaleDateString('es-CO')}
              </span>
              {(funnel?.form_fields || []).filter(f => f.required).map(f => (
                <span key={f.name} style={{ flex: 2, color: '#1e293b', fontSize: 13, fontWeight: 500 }}>
                  {lead.data?.[f.name] || '—'}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ANALYTICS VIEW
═══════════════════════════════════════════════════════════════════════════ */
function AnalyticsView() {
  const bars = [
    { day: "L", h: 55 }, { day: "M", h: 80 }, { day: "X", h: 45 },
    { day: "J", h: 90 }, { day: "V", h: 70 }, { day: "S", h: 35 }, { day: "D", h: 60 },
  ];
  return (
    <div style={v.dashRoot}>
      <div style={v.dashHeader}>
        <div>
          <h1 style={v.pageTitle}>Analytics</h1>
          <p style={v.pageSubtitle}>Rendimiento de tus páginas esta semana.</p>
        </div>
      </div>
      <div style={v.section}>
        <div style={v.sectionHeader}>
          <span style={v.sectionTitle}>Visitas diarias</span>
          <span style={{ color: "#52525b", fontSize: 12 }}>Últimos 7 días</span>
        </div>
        <div style={{ background: "#111116", borderRadius: 10, border: "1px solid #1c1c22", padding: "24px 20px", display: "flex", alignItems: "flex-end", gap: 12, height: 160 }}>
          {bars.map((b) => (
            <div key={b.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
              <div style={{ width: "100%", background: "rgba(99,102,241,0.7)", borderRadius: 4, height: `${b.h}%`, transition: "height 0.3s" }} />
              <span style={{ color: "#52525b", fontSize: 11 }}>{b.day}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...v.section, opacity: 0.5 }}>
        <div style={v.sectionHeader}><span style={v.sectionTitle}>Más datos próximamente</span></div>
        <div style={{ color: "#52525b", fontSize: 13 }}>Conecta tu dominio para ver métricas en tiempo real.</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SETTINGS VIEW
═══════════════════════════════════════════════════════════════════════════ */
function SettingsView({ client }) {
  return (
    <div style={v.dashRoot}>
      <div style={v.dashHeader}>
        <div>
          <h1 style={v.pageTitle}>Ajustes</h1>
          <p style={v.pageSubtitle}>Configuración de tu cuenta.</p>
        </div>
      </div>
      <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { label: "Cliente", val: client?.name || "—" },
          { label: "Email", val: client?.email || "—" },
          { label: "Plan", val: `${client?.max_landings || 1} landing page(s) máximo` },
          { label: "Licencia GrapesJS SDK", val: "Demo (localhost)" },
        ].map((f) => (
          <div key={f.label} style={v.settingRow}>
            <div style={{ color: "#71717a", fontSize: 12, marginBottom: 6 }}>{f.label}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={v.settingInput}>{f.val}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [clients, setClients] = useState([]);
  const [currentClientId, setCurrentClientId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeFunnelId, setActiveFunnelId] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [backendError, setBackendError] = useState(false);

  // Load clients on mount
  useEffect(() => {
    api.getClients()
      .then((data) => {
        setClients(data);
        if (data.length > 0) setCurrentClientId(data[0].id);
      })
      .catch(() => setBackendError(true));
  }, []);

  // Load projects when client changes
  const loadProjects = useCallback(() => {
    if (!currentClientId) return;
    setLoadingProjects(true);
    api
      .getProjects(currentClientId)
      .then((data) => {
        setProjects(data.projects || []);
        setLoadingProjects(false);
      })
      .catch(() => setLoadingProjects(false));
  }, [currentClientId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const currentClient = clients.find((c) => c.id === currentClientId);

  const handleNavigate = (view, id = null) => {
    if (view === "new") {
      setShowNewModal(true);
      return;
    }
    if (view === "builder" && id) {
      setActiveProjectId(id);
      setActiveNav("builder");
      return;
    }
    if (view === "funnel-wizard") {
      setActiveFunnelId(id);
      setActiveNav("funnel-wizard");
      return;
    }
    if (view === "leads" && id) {
      setActiveFunnelId(id);
      setActiveNav("leads");
      return;
    }
    setActiveNav(view);
  };

  const handleCreateProject = async ({ name, template_id }) => {
    const result = await api.createProject({
      client_id: currentClientId,
      name,
      template_id,
    });
    if (result.error) {
      if (result.error === "LIMIT_REACHED") {
        alert(result.message);
      } else {
        alert("Error al crear: " + result.error);
      }
      return;
    }
    setShowNewModal(false);
    await loadProjects();
    // Open builder immediately
    setActiveProjectId(result.project.id);
    setActiveNav("builder");
  };

  const handleDelete = async (id, name, refresh) => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    await api.deleteProject(id, currentClientId);
    refresh();
  };

  const renderView = () => {
    if (activeNav === "builder" && activeProjectId) {
      return (
        <BuilderView
          projectId={activeProjectId}
          clientId={currentClientId}
          onBack={() => { setActiveNav("landings"); loadProjects(); }}
        />
      );
    }
    if (activeNav === "classic-builder" && activeProjectId) {
      return (
        <ClassicBuilderView
          projectId={activeProjectId}
          clientId={currentClientId}
          onBack={() => { setActiveNav("landings"); loadProjects(); }}
        />
      );
    }
    if (activeNav === "funnel-wizard") {
      return (
        <FunnelWizardView
          clientId={currentClientId}
          funnelId={activeFunnelId}
          onBack={() => { setActiveNav("funnels"); setActiveFunnelId(null); }}
        />
      );
    }
    if (activeNav === "leads" && activeFunnelId) {
      return (
        <LeadsView
          funnelId={activeFunnelId}
          clientId={currentClientId}
          onBack={() => setActiveNav("funnels")}
        />
      );
    }
    switch (activeNav) {
      case "dashboard":
        return <DashboardView client={currentClient} projects={projects} onNavigate={handleNavigate} />;
      case "landings":
        return <LandingsView client={currentClient} projects={projects} onNavigate={handleNavigate} onDelete={handleDelete} onRefresh={loadProjects} />;
      case "funnels":
        return <FunnelsListView clientId={currentClientId} onNavigate={handleNavigate} />;
      case "analytics":
        return <AnalyticsView />;
      case "settings":
        return <SettingsView client={currentClient} />;
      default:
        return null;
    }
  };

  if (backendError) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, background: "#0c0c0f" }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div style={{ color: "#f87171", fontSize: 18, fontWeight: 600 }}>Backend no disponible</div>
        <div style={{ color: "#52525b", fontSize: 14, textAlign: "center", maxWidth: 400 }}>
          Asegúrate de que el servidor backend está corriendo en puerto 3001.
          <br /><br />
          <code style={{ background: "#111116", padding: "4px 10px", borderRadius: 6, color: "#818cf8", fontSize: 13 }}>
            cd backend && npm install && node server.js
          </code>
        </div>
        <button style={{ ...v.btnPrimary, marginTop: 8 }} onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div style={s.root}>
      {/* ── SIDEBAR ── */}
      <nav style={s.sidebar}>
        <div style={s.sideTop}>
          <div style={s.brand}>
            <img 
              src="/logo_kiuFlow_blanco.png" 
              alt="Logo de la Empresa" 
              style={{ maxHeight: '42px', maxWidth: '100%', objectFit: 'contain' }} 
              onError={(e) => { 
                e.target.style.display = 'none'; 
                e.target.nextSibling.style.display = 'flex'; 
              }} 
            />
            <div style={{ display: 'none', alignItems: 'center', gap: '12px' }}>
              <div style={s.brandMark}>LP</div>
              <div>
                <div style={s.brandName}>Kiuflow - GrapeJS</div>
                <div style={s.brandPlan}>Demo · GrapesJS SDK</div>
              </div>
            </div>
          </div>

          {/* Client Selector */}
          <div style={s.clientSelector}>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
              Cliente activo
            </div>
            <select
              value={currentClientId || ""}
              onChange={(e) => {
                setCurrentClientId(Number(e.target.value));
                setActiveNav("dashboard");
                setActiveProjectId(null);
              }}
              style={s.clientSelect}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={s.navList}>
            {NAV.filter(n => n.id !== "builder").map((item) => (
              <button
                key={item.id}
                style={{
                  ...s.navItem,
                  ...(activeNav === item.id ? s.navItemActive : {}),
                }}
                onClick={() => handleNavigate(item.id)}
              >
                <NavIcon id={item.id} active={activeNav === item.id} />
                <span>{item.label}</span>
                {item.id === "landings" && projects.length > 0 && (
                  <span style={s.navBadge}>{projects.length}/{currentClient?.max_landings || 1}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div style={s.sideBottom}>
          <div style={s.userRow}>
            <div style={s.avatar}>{currentClient?.initials || "??"}</div>
            <div>
              <div style={{ color: "#ffffff", fontSize: 12, fontWeight: 500 }}>{currentClient?.name || "—"}</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>{currentClient?.email || "—"}</div>
            </div>
          </div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main
        style={{
          ...s.main,
          ...(activeNav === "builder" && activeProjectId ? { padding: 0, overflow: "hidden" } : {}),
        }}
      >
        {loadingProjects && activeNav !== "builder" ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#52525b", fontSize: 14 }}>
            Cargando proyectos...
          </div>
        ) : renderView()}
      </main>

      {/* ── NEW LANDING MODAL ── */}
      {showNewModal && (
        <NewLandingModal
          onClose={() => setShowNewModal(false)}
          onConfirm={handleCreateProject}
        />
      )}
    </div>
  );
}

/* ─── NAV ICONS ─────────────────────────────────────────────────────────── */
function NavIcon({ id, active }) {
  const color = active ? "#ffffff" : "rgba(255,255,255,0.7)";
  const icons = {
    dashboard: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    landings: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
      </svg>
    ),
    funnels: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
    ),
    analytics: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    settings: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  };
  return icons[id] || null;
}

/* ─── STYLE OBJECTS ─────────────────────────────────────────────────────── */

/* Shell */
const s = {
  root: { display: "flex", height: "100vh", background: "#f8fafc", overflow: "hidden" },
  sidebar: {
    width: 240, background: "#DB2C52", borderRight: "1px solid #C02245",
    display: "flex", flexDirection: "column", justifyContent: "space-between", flexShrink: 0,
  },
  sideTop: { display: "flex", flexDirection: "column", gap: 0 },
  brand: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
    padding: "20px 16px 16px", borderBottom: "1px solid #C02245", marginBottom: 0,
  },
  brandMark: {
    width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#4f46e5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: 0.5, flexShrink: 0,
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
  },
  brandName: { color: "#ffffff", fontWeight: 600, fontSize: 15 },
  brandPlan: { color: "rgba(255,255,255,0.7)", fontSize: 11, letterSpacing: "0.02em" },
  clientSelector: {
    margin: "16px 12px 8px",
    padding: "12px",
    background: "#C02245",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.2)",
  },
  clientSelect: {
    width: "100%", background: "#DB2C52", border: "1px solid rgba(255,255,255,0.3)",
    color: "#ffffff", borderRadius: 6, padding: "8px 10px",
    fontSize: 13, cursor: "pointer",
  },
  navList: { display: "flex", flexDirection: "column", padding: "8px 12px", gap: 4 },
  navItem: {
    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
    borderRadius: 8, border: "none", background: "transparent", color: "rgba(255,255,255,0.8)",
    fontSize: 14, cursor: "pointer", textAlign: "left", width: "100%",
    fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
  },
  navItemActive: { background: "rgba(99,102,241,0.15)", color: "#f8fafc", fontWeight: 500 },
  navBadge: {
    marginLeft: "auto", background: "rgba(99,102,241,0.2)", color: "#818cf8",
    fontSize: 10, padding: "2px 8px", borderRadius: 12, fontWeight: 600,
  },
  sideBottom: { padding: "16px", borderTop: "1px solid #C02245" },
  userRow: { display: "flex", alignItems: "center", gap: 12 },
  avatar: {
    width: 32, height: 32, borderRadius: "50%", background: "#C02245",
    border: "1px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center",
    color: "#ffffff", fontSize: 12, fontWeight: 600, flexShrink: 0,
  },
  main: { flex: 1, overflow: "auto", padding: "40px 48px", background: "#f8fafc" },
};

/* Views shared */
const v = {
  dashRoot: { display: "flex", flexDirection: "column", gap: 28, maxWidth: 1000 },
  dashHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between" },
  pageTitle: { color: "#0f172a", fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" },
  pageSubtitle: { color: "#64748b", fontSize: 14, marginTop: 4 },
  usageCard: {
    background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  },
  progressTrack: {
    height: 8, background: "#f1f5f9", borderRadius: 99, overflow: "hidden",
  },
  progressBar: { height: "100%", borderRadius: 99, transition: "width 0.4s ease" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 },
  statCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  statLabel: { color: "#64748b", fontSize: 12, marginBottom: 12, letterSpacing: "0.02em", fontWeight: 500 },
  statValue: { color: "#0f172a", fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" },
  section: { display: "flex", flexDirection: "column", gap: 0 },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  sectionTitle: { color: "#475569", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" },
  linkBtn: { background: "none", border: "none", color: "#4f46e5", fontSize: 13, cursor: "pointer", fontWeight: 500 },
  table: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  tableHead: { display: "flex", padding: "12px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" },
  tableRow: { display: "flex", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #f1f5f9" },
  badge: { fontSize: 12, padding: "4px 10px", borderRadius: 20, fontWeight: 500 },
  tableBtn: { background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontWeight: 500 },
  pageCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", transition: "transform 0.2s, box-shadow 0.2s" },
  pageCardThumb: { background: "#f8fafc", height: 140, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #e2e8f0" },
  pageCardBody: { padding: "16px 20px" },
  settingRow: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  settingInput: { flex: 1, background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", color: "#0f172a", fontSize: 14 },
  btnPrimary: {
    background: "#4f46e5", border: "none", color: "#ffffff",
    borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s"
  },
  btnGhost: {
    background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569",
    borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 500, cursor: "pointer",
  },
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)" },
  modal: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, width: "min(90vw,800px)", maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" },
  modalHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 28px", borderBottom: "1px solid #e2e8f0" },
  modalClose: { background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: 4, fontSize: 16 },
  modalFooter: { display: "flex", gap: 12, padding: "16px 28px", borderTop: "1px solid #e2e8f0", alignItems: "center", background: "#f8fafc" },
  limitBadge: { background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: 8, padding: "8px 16px", fontSize: 14, fontWeight: 600 },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", background: "#ffffff", border: "1px dashed #cbd5e1", borderRadius: 16, textAlign: "center" },
  emptyIcon: { marginBottom: 20 },
  emptyTitle: { color: "#0f172a", fontSize: 18, fontWeight: 600, marginBottom: 8 },
  emptyDesc: { color: "#64748b", fontSize: 14, maxWidth: 360 },
};

/* Builder */
const b = {
  root: { display: "flex", flexDirection: "column", height: "100%", background: "#f8fafc" },
  topbar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "#ffffff", borderBottom: "1px solid #e2e8f0",
    padding: "0 20px", height: 54, flexShrink: 0, gap: 16,
  },
  topLeft: { display: "flex", alignItems: "center", gap: 16, minWidth: 260 },
  topRight: { display: "flex", alignItems: "center", gap: 16, minWidth: 260, justifyContent: "flex-end" },
  backBtn: {
    background: "#f1f5f9", border: "none", color: "#475569",
    borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer",
    display: "flex", alignItems: "center", gap: 6,
  },
};