import { useState } from "react";
import { Palette, Lock, LayoutDashboard, LayoutGrid, List } from "lucide-react";

/**
 * LandingsView
 * Vista para gestionar el CRUD básico de las Landing Pages.
 */
export default function LandingsView({ client, projects, onNavigate, onDelete, onRefresh }) {
  const used = projects.length;
  const max = client?.max_landings || 1;
  const BASE_URL = import.meta.env.PROD ? window.location.origin : "http://localhost:3001";
  const [viewMode, setViewMode] = useState("grid");

  return (
    <div className="flex flex-col gap-7 max-w-[1000px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-slate-900 text-[26px] font-bold tracking-tight">Mis Landings</h1>
          <p className="text-slate-500 text-sm mt-1">
            {used} de {max} landing pages usadas
          </p>
        </div>
        {used < max ? (
          <button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-lg py-2.5 px-5 text-sm font-semibold cursor-pointer flex items-center justify-center transition-colors"
            onClick={() => onNavigate("new")}
          >
            + Nueva Landing
          </button>
        ) : (
          <div className="bg-red-100 border border-red-300 text-red-700 rounded-lg py-2 px-4 text-sm font-semibold flex items-center">
            <Lock size={14} className="mr-1.5" /> Límite alcanzado ({used}/{max})
          </div>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-5 bg-white border border-dashed border-slate-300 rounded-2xl text-center">
          <div className="mb-5"><LayoutDashboard size={48} className="text-slate-400 stroke-1" /></div>
          <div className="text-slate-900 text-lg font-semibold mb-2">No tienes landing pages</div>
          <div className="text-slate-500 text-sm max-w-[360px]">Crea una usando nuestras plantillas profesionales.</div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-lg py-2.5 px-5 text-sm font-semibold cursor-pointer mt-4 transition-colors" onClick={() => onNavigate("new")}>
            Crear landing
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-end gap-2 border-b border-slate-200 pb-4">
            <span className="text-slate-500 text-sm font-medium mr-2">Organizar por:</span>
            <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
              <button 
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setViewMode('grid')}
                title="Vista de cuadrícula"
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setViewMode('list')}
                title="Vista de lista"
              >
                <List size={18} />
              </button>
            </div>
          </div>
          
          {viewMode === "grid" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {projects.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ring-1 ring-slate-900/5">
              <div className="bg-gradient-to-br from-indigo-50 to-white h-[140px] flex items-center justify-center border-b border-slate-100 relative group">
                <div className="text-indigo-200 group-hover:scale-110 group-hover:text-indigo-400 transition-all duration-500"><Palette size={36} strokeWidth={1.5} /></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="p-4 px-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-zinc-800 font-semibold text-sm truncate pr-2">{p.name}</span>
                  <span className="text-xs py-1 px-2.5 rounded-full font-medium bg-green-500/10 text-green-500 shrink-0">
                    Guardada
                  </span>
                </div>
                <div className="text-zinc-500 text-xs mb-4">
                  Editada {new Date(p.updated_at).toLocaleDateString("es-CO")}
                </div>
                <div className="flex gap-2 flex-wrap mt-2">
                  <button
                    className="bg-indigo-600 hover:bg-indigo-500 text-white border-none rounded-xl py-2 px-3.5 text-xs font-semibold cursor-pointer flex-1 min-w-[45%] shadow-sm shadow-indigo-600/20 transition-all"
                    onClick={() => onNavigate("classic-builder", p.id)}
                  >
                    Editar
                  </button>
                  <button
                    className="bg-slate-800 hover:bg-slate-900 text-white border-none rounded-xl py-2 px-3.5 text-xs font-semibold cursor-pointer flex-1 shadow-sm transition-colors"
                    onClick={() => window.open(p.url, "_blank")}
                  >
                    Ver
                  </button>
                  <button
                    className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl py-2 px-3.5 text-xs font-medium cursor-pointer transition-colors"
                    onClick={() => onDelete(p.id, p.name, onRefresh)}
                  >
                    Borrar
                  </button>
                </div>
                {p.url && (
                  <div className="mt-3 p-2 px-2.5 bg-black/5 rounded-md flex items-center justify-between">
                    <span className="text-slate-500 text-[11px] overflow-hidden text-ellipsis whitespace-nowrap flex-1">
                      🔗 <strong className="text-slate-700">{p.url}</strong>
                    </span>
                    <button 
                      onClick={(e) => {
                        const btn = e.currentTarget;
                        btn.textContent = "✓ Copiado";
                        setTimeout(() => (btn.textContent = "Copiar"), 2000);
                        navigator.clipboard.writeText(p.url);
                      }}
                      className="bg-transparent border-none text-green-600 text-[11px] font-bold cursor-pointer pl-2"
                    >
                      Copiar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {projects.map((p) => (
                <div key={p.id} className="bg-white border border-slate-200/60 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-slate-900/5 flex items-center p-3 px-5 gap-5">
                  <div className="bg-gradient-to-br from-indigo-50 to-white w-14 h-14 rounded-lg flex items-center justify-center border border-slate-100 shrink-0">
                    <Palette size={24} className="text-indigo-300" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-zinc-800 font-bold text-[15px] truncate">{p.name}</span>
                      <span className="text-[10px] py-0.5 px-2 rounded-full font-bold bg-green-500/10 text-green-600 shrink-0 uppercase tracking-wide">
                        Guardada
                      </span>
                    </div>
                    <div className="text-slate-500 text-xs">
                      Editada {new Date(p.updated_at).toLocaleDateString("es-CO")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="bg-indigo-600 hover:bg-indigo-500 text-white border-none rounded-lg py-2 px-4 text-xs font-semibold cursor-pointer shadow-sm shadow-indigo-600/20 transition-all" onClick={() => onNavigate("classic-builder", p.id)}>
                      Editar Landing
                    </button>
                    <button className="bg-slate-800 hover:bg-slate-900 text-white border-none rounded-lg py-2 px-3 text-xs font-semibold cursor-pointer transition-colors" onClick={() => window.open(p.url, "_blank")}>
                      Ver URL
                    </button>
                    <button className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-lg py-2 px-3 text-xs font-medium cursor-pointer transition-colors" onClick={() => onDelete(p.id, p.name, onRefresh)}>
                      Borrar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
