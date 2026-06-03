import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { FunnelService } from "../services/AppServices";
import { BASE_URL } from "../infrastructure/api/config";

export default function LeadsView({ funnelId, clientId, onBack }) {
  const [leads, setLeads] = useState([]);
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!funnelId || !clientId) return;
    Promise.all([
      FunnelService.getLeads(funnelId, clientId),
      FunnelService.getFunnelById(funnelId, clientId),
    ]).then(([leadsData, funnelData]) => {
      setLeads(leadsData.leads || []);
      const fData = funnelData.funnel;
      if (fData && typeof fData.form_fields === 'string') {
        try {
          fData.form_fields = JSON.parse(fData.form_fields);
          if (typeof fData.form_fields === 'string') fData.form_fields = JSON.parse(fData.form_fields);
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

  if (loading) return <div className="text-zinc-500 p-10">Cargando leads...</div>;

  return (
    <div className="flex flex-col gap-7 max-w-[1000px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-slate-900 text-[26px] font-bold tracking-tight flex items-center">
            <Users size={20} className="mr-2" /> Leads — {funnel?.title || 'Funnel'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{leads.length} contacto{leads.length !== 1 ? 's' : ''} recibido{leads.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          {leads.length > 0 && (
            <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-none rounded-lg py-2 px-4 text-sm font-semibold cursor-pointer" onClick={exportCSV}>
              📥 Exportar CSV
            </button>
          )}
          <button className="bg-transparent hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg py-2 px-4 text-sm font-semibold cursor-pointer" onClick={onBack}>
            ← Volver
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-slate-500 text-xs mb-3 font-semibold tracking-wide">TOTAL LEADS</div>
          <div className="text-slate-900 text-2xl font-bold">{leads.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-slate-500 text-xs mb-3 font-semibold tracking-wide">ÚLTIMO LEAD</div>
          <div className="text-slate-900 text-base font-bold">{leads.length > 0 ? new Date(leads[0].created_at).toLocaleDateString('es-CO') : '—'}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-slate-500 text-xs mb-3 font-semibold tracking-wide">ESTADO FUNNEL</div>
          <div className={`text-base font-bold ${funnel?.status === 'published' ? 'text-green-500' : 'text-yellow-500'}`}>
            {funnel?.status === 'published' ? '🟢 Publicado' : '🟡 Borrador'}
          </div>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white border border-dashed border-slate-300 rounded-2xl text-center">
          <div className="text-4xl mb-4">📥</div>
          <div className="text-slate-900 text-lg font-semibold mb-2">Sin leads aún</div>
          <div className="text-slate-500 text-sm max-w-[360px]">Comparte el enlace del funnel y los leads aparecerán aquí en tiempo real.</div>
          <div className="mt-4 p-2.5 px-4 bg-green-50 text-green-700 font-medium rounded-lg text-[13px]">
            🔗 {BASE_URL}/f/{funnel?.public_slug}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wide">
                <th className="p-4 font-semibold">Fecha</th>
                {funnel?.form_fields?.map(f => (
                  <th key={f.name} className="p-4 font-semibold">{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50 text-sm text-slate-700">
                  <td className="p-4 whitespace-nowrap">{new Date(l.created_at).toLocaleString('es-CO')}</td>
                  {funnel?.form_fields?.map(f => (
                    <td key={f.name} className="p-4">{l.data?.[f.name] || '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
