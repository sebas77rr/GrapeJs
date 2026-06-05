import { useState, useEffect } from "react";
import { Palette, MonitorPlay } from "lucide-react";
import { FunnelService } from "../services/AppServices";
import { useAppContext } from "../context/AppContext";

/**
 * DashboardView
 * Pantalla principal (Home) del portal. Muestra el estado del CRM,
 * la suscripción activa y accesos rápidos a los módulos.
 */
export default function DashboardView({ client, projects, onNavigate }) {
  const { currentSubId } = useAppContext();
  const used = projects.length;
  const max = client?.max_landings || 1;
  const percent = Math.min((used / max) * 100, 100);

  const [funnels, setFunnels] = useState([]);

  useEffect(() => {
    if (client?.id && currentSubId) {
      FunnelService.getFunnelsByClient(client.id, currentSubId)
        .then((data) => setFunnels(data.funnels || []))
        .catch(console.error);
    }
  }, [client?.id, currentSubId]);

  const stats = [
    { label: "Landings activas", value: String(used), delta: `de ${max} permitidas` },
    { label: "Plantillas disponibles", value: "3", delta: "Actualizadas" },
    { label: "Última edición", value: used > 0 ? "Hoy" : "—", delta: used > 0 ? projects[0]?.name : "Sin proyectos" },
    { label: "Estado", value: used < max ? "Activo" : "Límite", delta: used < max ? "Puede crear más" : "Límite alcanzado" },
  ];

  return (
    <div className="flex flex-col gap-7 max-w-[1000px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-slate-900 text-[26px] font-bold tracking-tight">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Bienvenido, <strong className="text-slate-400">{client?.name}</strong>. Gestiona tus landing pages.
          </p>
        </div>
        {used < max ? (
          <div className="flex gap-3">
            <button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-lg py-2.5 px-5 text-sm font-semibold cursor-pointer flex items-center justify-center transition-colors duration-200"
              onClick={() => onNavigate("new")}
            >
              + Nueva Landing
            </button>
            <button 
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm rounded-lg py-2.5 px-5 text-sm font-semibold cursor-pointer flex items-center justify-center transition-colors duration-200"
              onClick={() => onNavigate("funnel-wizard")}
            >
              + Nuevo Funnel
            </button>
          </div>
        ) : (
          <button 
            className="bg-zinc-800 text-white border-none rounded-lg py-2.5 px-5 text-sm font-semibold cursor-not-allowed flex items-center justify-center"
            disabled
          >
            Límite alcanzado
          </button>
        )}
      </div>

      {/* Usage bar */}
      <div className="bg-white border border-slate-200 rounded-xl py-5 px-6 shadow-sm">
        <div className="flex justify-between mb-2.5">
          <span className="text-slate-400 text-[13px] font-medium">Uso de Landing Pages</span>
          <span className={`text-[13px] font-semibold ${used >= max ? "text-red-400" : "text-green-400"}`}>
            {used} / {max}
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-400 ease-out"
            style={{
              width: `${percent}%`,
              background: used >= max
                ? "linear-gradient(90deg,#ef4444,#dc2626)"
                : "linear-gradient(90deg,#6366f1,#818cf8)",
            }}
          />
        </div>
        {used >= max && (
          <p className="text-red-400 text-xs mt-2">
            ⚠️ Has alcanzado el límite de landing pages de tu plan. Contacta con soporte para ampliarlo.
          </p>
        )}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl py-5 px-6 shadow-sm">
            <div className="text-slate-500 text-xs mb-3 tracking-wide font-medium">{s.label}</div>
            <div className="text-slate-900 text-2xl font-bold tracking-tight">{s.value}</div>
            <div className="text-zinc-600 text-[11px] mt-1.5">{s.delta}</div>
          </div>
        ))}
      </div>

      {projects.length > 0 && (
        <div className="flex flex-col gap-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-600 text-xs font-bold tracking-widest uppercase">Tus Landing Pages</span>
            <button className="bg-transparent border-none text-indigo-600 text-[13px] cursor-pointer font-medium hover:text-indigo-700" onClick={() => onNavigate("landings")}>Ver todas</button>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="flex py-3 px-5 border-b border-slate-200 bg-slate-50 text-slate-500 text-xs font-semibold tracking-wide uppercase">
              <span className="flex-[3]">Nombre</span>
              <span className="flex-[2]">Creada</span>
              <span className="flex-[2]">Última edición</span>
              <span className="flex-[1]">Acción</span>
            </div>
            {projects.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center py-4 px-5 border-b border-slate-100 last:border-b-0">
                <span className="flex-[3] text-zinc-800 text-[13px] font-medium">
                  {p.name}
                </span>
                <span className="flex-[2] text-zinc-500 text-[13px]">
                  {new Date(p.created_at).toLocaleDateString("es-CO")}
                </span>
                <span className="flex-[2] text-zinc-500 text-[13px]">
                  {new Date(p.updated_at).toLocaleDateString("es-CO")}
                </span>
                <span className="flex-[1] flex gap-1.5">
                  <button className="bg-white border border-slate-300 text-slate-600 rounded-md py-1.5 px-3.5 text-[13px] cursor-pointer font-medium hover:bg-slate-50" onClick={() => onNavigate("classic-builder", p.id)}>
                    Editar
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {funnels.length > 0 && (
        <div className="flex flex-col gap-0 mt-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-600 text-xs font-bold tracking-widest uppercase">Tus Video Funnels</span>
            <button className="bg-transparent border-none text-indigo-600 text-[13px] cursor-pointer font-medium hover:text-indigo-700" onClick={() => onNavigate("funnels")}>Ver todos</button>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="flex py-3 px-5 border-b border-slate-200 bg-slate-50 text-slate-500 text-xs font-semibold tracking-wide uppercase">
              <span className="flex-[3]">Nombre</span>
              <span className="flex-[2]">Creado</span>
              <span className="flex-[2]">Umbral</span>
              <span className="flex-[1]">Acción</span>
            </div>
            {funnels.slice(0, 3).map((f) => (
              <div key={f.id} className="flex items-center py-4 px-5 border-b border-slate-100 last:border-b-0">
                <span className="flex-[3] text-zinc-800 text-[13px] font-medium flex items-center gap-2">
                  <MonitorPlay size={14} className="text-indigo-500" />
                  {f.title}
                </span>
                <span className="flex-[2] text-zinc-500 text-[13px]">
                  {new Date(f.created_at).toLocaleDateString("es-CO")}
                </span>
                <span className="flex-[2] text-zinc-500 text-[13px]">
                  {f.video_threshold}%
                </span>
                <span className="flex-[1] flex gap-1.5">
                  <button className="bg-white border border-slate-300 text-slate-600 rounded-md py-1.5 px-3.5 text-[13px] cursor-pointer font-medium hover:bg-slate-50" onClick={() => onNavigate("funnel-wizard", f.id)}>
                    Editar
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {projects.length === 0 && funnels.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-5 bg-white border border-dashed border-slate-300 rounded-2xl text-center mt-4">
          <div className="mb-5"><Palette size={48} className="text-slate-400 stroke-1" /></div>
          <div className="text-slate-900 text-lg font-semibold mb-2">Sin landing pages aún</div>
          <div className="text-slate-500 text-sm max-w-[360px]">Crea tu primera landing page usando una de nuestras plantillas.</div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-lg py-2.5 px-5 text-sm font-semibold cursor-pointer mt-4 transition-colors" onClick={() => onNavigate("new")}>
            Crear mi primera landing
          </button>
        </div>
      )}
    </div>
  );
}
