import { useState, useCallback, useEffect } from "react";
import { Play, Pause, ExternalLink, Users, Trash2, Link2, MonitorPlay, Lock } from "lucide-react";
import { FunnelService } from "../services/AppServices";
import { BASE_URL } from "../infrastructure/api/config";
import { useAppContext } from "../context/AppContext";

export default function FunnelsListView({ clientId, onNavigate }) {
  const { currentSubId } = useAppContext();
  const [funnels, setFunnels] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!clientId || !currentSubId) return;
    setLoading(true);
    FunnelService.getFunnelsByClient(clientId, currentSubId).then(data => {
      setFunnels(data.funnels || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [clientId, currentSubId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id, name) => {
    if (!confirm(`¿Eliminar funnel "${name}"?`)) return;
    await FunnelService.deleteFunnel(id, clientId);
    load();
  };

  const handlePublish = async (id) => {
    await FunnelService.publishFunnel(id);
    load();
  };

  const handleUnpublish = async (id) => {
    await FunnelService.unpublishFunnel(id);
    load();
  };

  const used = funnels.length;
  const max = 5;

  return (
    <div className="flex flex-col gap-7 max-w-[1000px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-slate-900 text-[26px] font-bold tracking-tight flex items-center gap-2.5">
            <MonitorPlay size={24} className="text-indigo-600" /> Video Funnels
          </h1>
          <p className="text-slate-500 text-sm mt-1">{used} de {max} funnels usados (Max 1 Activo).</p>
        </div>
        {used < max ? (
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-lg py-2.5 px-5 text-sm font-semibold cursor-pointer transition-colors"
            onClick={() => onNavigate('funnel-wizard')}
          >
            + Nuevo Funnel
          </button>
        ) : (
          <div className="bg-red-100 border border-red-300 text-red-700 rounded-lg py-2 px-4 text-sm font-semibold flex items-center">
            <Lock size={14} className="mr-1.5" /> Límite ({used}/{max})
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-zinc-500 text-[13px] p-5">Cargando funnels...</div>
      ) : funnels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-5 bg-white border border-dashed border-slate-300 rounded-2xl text-center">
          <div className="mb-5"><MonitorPlay size={48} className="text-slate-400 stroke-1" /></div>
          <div className="text-slate-900 text-lg font-semibold mb-2">Sin funnels aún</div>
          <div className="text-slate-500 text-sm max-w-[360px]">Crea tu primer embudo de ventas con video para captar leads de alta calidad.</div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-lg py-2.5 px-5 text-sm font-semibold cursor-pointer mt-4 transition-colors" onClick={() => onNavigate('funnel-wizard')}>
            Crear mi primer funnel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          {funnels.map(f => (
            <div key={f.id} className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm relative hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ring-1 ring-slate-900/5">
              <div
                className="h-[120px] flex items-center justify-center border-b border-slate-200 relative group overflow-hidden"
                style={{
                  background: f.bg_color || (f.theme === 'dark' ? '#0f172a' : '#f8fafc'),
                  backgroundImage: f.bg_image ? `url(${f.bg_image})` : 'none',
                  backgroundSize: 'cover'
                }}
              >
                {f.bg_image && <div className="absolute inset-0 bg-black/60 z-0"></div>}
                <div className="relative z-10 text-center scale-[0.65] transform origin-center w-full px-4 transition-transform duration-500 group-hover:scale-75 mt-3">
                  <h3 className="text-[16px] font-bold truncate leading-tight" style={{ color: f.bg_image || f.theme === 'dark' || f.bg_color ? '#ffffff' : '#0f172a' }}>{f.title || 'Sin título'}</h3>
                  <div className="bg-black/20 backdrop-blur-md rounded-lg p-2.5 my-2 mx-auto inline-block border border-white/10 shadow-sm">
                    <MonitorPlay size={20} className="text-white mx-auto" />
                  </div>
                  <div className="mx-auto px-4 py-1.5 rounded-md text-[11px] font-bold text-white truncate max-w-[90%] shadow-sm flex items-center justify-center w-max" style={{ background: f.cta_color || '#DB2C52' }}>
                    <Lock size={10} className="mr-1.5" /> {f.locked_btn_text || 'Desbloquear'}
                  </div>
                </div>
                <div className={`absolute top-3 right-3 px-2.5 py-[4px] rounded-full font-bold text-[10px] tracking-wide shadow-sm z-20 backdrop-blur-md ${f.is_published === 1 ? 'bg-green-500/90 text-white border border-green-500/50' : 'bg-amber-500/90 text-white border border-amber-500/50'}`}>
                  {f.is_published === 1 ? 'Activo' : 'Borrador'}
                </div>
              </div>
              <div className="p-4 px-5">
                <h3 className="font-bold text-slate-800 text-sm mb-1">{f.title}</h3>
                <div className="text-zinc-500 text-xs mb-1 overflow-hidden text-ellipsis whitespace-nowrap">{f.highlight_text}</div>
                <div className="text-zinc-700 text-[11px] mb-3.5">Video: {f.video_type?.toUpperCase()} • Umbral: {f.video_threshold}%</div>
                <div className="flex gap-2 flex-wrap mt-2">
                  {f.is_published === 0 ? (
                    <button className="bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-xl py-2 px-3 text-[11px] font-semibold cursor-pointer flex items-center shadow-sm shadow-emerald-500/20 transition-colors" onClick={() => handlePublish(f.id)}>
                      <Play size={14} className="mr-1.5" /> Activar
                    </button>
                  ) : (
                    <button className="bg-slate-100 border border-slate-200 text-slate-700 rounded-xl py-2 px-3 text-[11px] font-semibold cursor-pointer flex items-center hover:bg-slate-200 transition-colors" onClick={() => handleUnpublish(f.id)}>
                      <Pause size={14} className="mr-1.5" /> Desactivar
                    </button>
                  )}
                  <button className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded-xl py-2 px-3 text-[11px] font-semibold cursor-pointer transition-colors" onClick={() => onNavigate('funnel-wizard', f.id)}>
                    ✏️ Editar
                  </button>
                  <button className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl py-2 px-3 text-[11px] font-semibold cursor-pointer flex items-center hover:bg-slate-100 transition-colors" onClick={() => window.open(`https://builder.kiuflow.online/f/${f.public_slug}`, '_blank')}>
                    <ExternalLink size={14} className="mr-1.5 text-slate-500" /> Ver
                  </button>
                  <button className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl py-2 px-3 text-[11px] font-semibold cursor-pointer flex items-center hover:bg-slate-100 transition-colors" onClick={() => onNavigate('leads', f.id)}>
                    <Users size={14} className="mr-1.5 text-slate-500" /> Leads {f.lead_count > 0 ? <span className="ml-1 bg-indigo-100 text-indigo-700 px-1.5 rounded-full">{f.lead_count}</span> : ''}
                  </button>
                  <button className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl py-2 px-2.5 text-[11px] cursor-pointer transition-colors ml-auto" onClick={() => handleDelete(f.id, f.title)}>
                    <Trash2 size={14} />
                  </button>
                </div>
                {f.public_slug && (
                  <div className="mt-2.5 p-1.5 px-2.5 bg-black/5 rounded-md flex items-center justify-between">
                    <span className="text-slate-500 text-[11px] overflow-hidden text-ellipsis whitespace-nowrap flex-1">
                      <Link2 size={12} className="inline mr-1" /> <strong className="text-slate-700">{`https://builder.kiuflow.online/f/${f.public_slug}`}</strong>
                    </span>
                    <button
                      onClick={(e) => {
                        const target = e.currentTarget;
                        target.textContent = '✓';
                        setTimeout(() => (target.textContent = 'Copiar'), 2000);
                        navigator.clipboard.writeText(`https://builder.kiuflow.online/f/${f.public_slug}`);
                      }}
                      className="bg-transparent border-none text-green-500 text-[11px] font-bold cursor-pointer pl-2"
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