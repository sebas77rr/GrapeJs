import {
  Home,
  LayoutDashboard,
  MousePointerClick,
  Settings,
  BarChart3,
  ChevronDown,
  Check,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { API_URL } from "../infrastructure/api/config";

/**
 * Sidebar Component
 * Rediseñado para ser visualmente consistente con el sidebar original de KiuFlow:
 * - Card de usuario en la parte superior
 * - Suscripción activa con badge de rol
 * - Items de navegación con estilo activo tipo KiuFlow (fondo translúcido, no blanco)
 */
export default function Sidebar({ client, currentView, onNavigate }) {
  const { currentSubId, setCurrentSubId, subscriptions, kiuflowUser, sidebarColor } = useAppContext();
  const [kiuflowStatus, setKiuflowStatus] = useState({
    connected: false,
    user: null,
  });
  const [showSubMenu, setShowSubMenu] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/kiuflow/status`)
      .then((res) => res.json())
      .then((data) => setKiuflowStatus(data))
      .catch(() => setKiuflowStatus({ connected: false, user: null }));
  }, []);

  const NAV = [
    { id: "dashboard",  label: "Dashboard",    icon: <Home size={19} strokeWidth={1.8} /> },
    { id: "landings",   label: "Mis Landings", icon: <LayoutDashboard size={19} strokeWidth={1.8} /> },
    { id: "funnels",    label: "Funnels",       icon: <MousePointerClick size={19} strokeWidth={1.8} /> },
    { id: "analytics",  label: "Analítica",    icon: <BarChart3 size={19} strokeWidth={1.8} /> },
    { id: "settings",   label: "Ajustes",      icon: <Settings size={19} strokeWidth={1.8} /> },
  ];

  // Datos del usuario: prioriza kiuflowUser del context, luego el status local
  const userName = kiuflowUser?.name || kiuflowStatus.user?.name || "Admin";
  const userRole  = kiuflowUser?.role || kiuflowStatus.user?.role || "Admin";
  const initials  = userName.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();

  // Suscripción activa
  const activeSub = subscriptions.find((s) => s.id === currentSubId) || subscriptions[0];

  // Colores para los roles
  const getRoleColor = (role) => {
    const r = role?.toLowerCase() || "";
    if (r === "propietario" || r === "owner") return "bg-[#a855f7]"; // Morado
    if (r === "admin") return "bg-[#3b82f6]"; // Azul
    if (r === "agente" || r === "agent") return "bg-[#10b981]"; // Verde
    if (r === "cliente" || r === "client") return "bg-[#0ea5e9]"; // Cyan
    return "bg-blue-500";
  };

  return (
    <nav className="w-[256px] flex flex-col shrink-0 h-full relative overflow-hidden shadow-[2px_0_20px_rgba(0,0,0,0.15)]" style={{ backgroundColor: sidebarColor || '#E94A6E' }}>

      {/* ── Logo ── */}
      <div className="flex items-center justify-center pt-5 pb-4 px-5 border-b border-white/10">
        <img
          src="/logo_kiuFlow_blanco.png"
          alt="KiuFlow"
          style={{ maxHeight: "38px", maxWidth: "100%", objectFit: "contain" }}
        />
      </div>

      {/* ── Card Usuario ── */}
      <div className="mx-3 mt-4 px-3 py-3 bg-white/10 rounded-2xl flex items-center gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold shrink-0 border border-white/30">
          {initials}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-white font-semibold text-[13px] truncate leading-tight">
            {userName}
          </span>
          <span className="text-white/70 text-[11px] truncate">{userRole}</span>
        </div>
      </div>

      {/* ── Suscripción activa ── */}
      {activeSub && (
        <div className="mx-3 mt-2 relative">
          <button
            onClick={() => setShowSubMenu((v) => !v)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-white/10 rounded-xl border border-white/10 hover:bg-white/15 transition-colors text-left"
          >
            <span className="text-white text-[12px] font-medium truncate flex-1">
              {activeSub.name || `Suscripción #${activeSub.id}`}
            </span>
            <span className={`${getRoleColor(activeSub.role)} text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0`}>
              {activeSub.role}
            </span>
            <ChevronDown
              size={13}
              className={`text-white/60 shrink-0 transition-transform ${showSubMenu ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown de suscripciones */}
          {showSubMenu && subscriptions.length > 1 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl z-50 shadow-xl border border-slate-100 py-1.5 max-h-[280px] overflow-y-auto">
              {subscriptions.map((s) => {
                const isActive = s.id === currentSubId;
                return (
                  <button
                    key={s.id}
                    onClick={() => { setCurrentSubId(s.id); setShowSubMenu(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-[13px] transition-colors ${
                      isActive 
                        ? "bg-[#fdf4f6] text-slate-800 font-medium" 
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate flex-1 text-[#4a3539]">{s.name || `Suscripción #${s.id}`}</span>
                    <span className={`${getRoleColor(s.role)} text-white text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0`}>
                      {s.role}
                    </span>
                    {isActive && <Check size={14} className="text-[#E94A6E] shrink-0 ml-0.5" strokeWidth={2.5} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Navegación ── */}
      <div className="flex flex-col px-3 py-3 gap-0.5 mt-2 flex-1">
        {NAV.map((n) => {
          const isActive =
            currentView === n.id ||
            (n.id === "landings" && (currentView === "new" || currentView === "classic-builder"));
          return (
            <button
              key={n.id}
              onClick={() => onNavigate(n.id)}
              className={`group flex items-center gap-3 px-3.5 py-[11px] rounded-xl border-none text-[13.5px] font-medium text-left w-full transition-all duration-200 ${
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-transparent text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <span className={`transition-opacity ${isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}>
                {n.icon}
              </span>
              {n.label}
            </button>
          );
        })}
      </div>

      {/* ── Footer: estado de conexión ── */}
      <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full shrink-0 ${
          kiuflowStatus.connected
            ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.9)]"
            : "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.9)]"
        }`} />
        <span className="text-white/60 text-[11px]">
          {kiuflowStatus.connected ? "KiuFlow conectado" : "Sin conexión"}
        </span>
      </div>
    </nav>
  );
}