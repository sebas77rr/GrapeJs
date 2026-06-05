import { useState } from "react";
import { Lock, ArrowRight, ShieldOff } from "lucide-react";
import Sidebar from "../components/Sidebar";
import DashboardView from "../pages/Dashboard";
import LandingsView from "../pages/Landings";
import ClassicBuilderView from "../pages/ClassicBuilder";
import FunnelsListView from "../pages/FunnelsList";
import FunnelWizardView from "../pages/FunnelWizard";
import AnalyticsView from "../pages/Analytics";
import SettingsView from "../pages/Settings";
import LeadsView from "../pages/Leads";
import CallPortal from "../pages/public/CallPortal";
import { useAppContext } from "../context/AppContext";
import { ProjectService } from "../services/AppServices";

/**
 * AppRouter (Router Principal SPA)
 * Gestiona la navegación interna de la aplicación React.
 * Al no usar react-router-dom, mantiene el estado `activeNav` 
 * para renderizar dinámicamente las vistas (Dashboard, Funnels, Builder).
 */
export default function AppRouter() {
  // ── RUTAS PÚBLICAS AISLADAS ──
  // Interceptamos la URL directamente para renderizar portales públicos sin cargar el layout del admin
  if (window.location.pathname === "/call") {
    return <CallPortal />;
  }

  const { currentClient, currentClientId, projects, loadProjects, backendError, isAuthenticated, kiuflowUser, currentSubId } = useAppContext();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeFunnelId, setActiveFunnelId] = useState(null);
  
  const [showNewLandingModal, setShowNewLandingModal] = useState(false);
  const [newLandingName, setNewLandingName] = useState("Mi Nueva Landing");
  const [isCreatingLanding, setIsCreatingLanding] = useState(false);

  // Pantalla de carga mientras verifica autenticación
  if (isAuthenticated === null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0c0c0f] gap-4 text-white">
        <div className="w-12 h-12 border-4 border-[#E94A6E] border-t-transparent rounded-full animate-spin"></div>
        <div className="text-zinc-400 text-sm">Verificando sesión con KiuFlow...</div>
      </div>
    );
  }

  // Pantalla de bloqueo si no está autenticado
  if (isAuthenticated === false) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
        {/* Sidebar bloqueado */}
        <nav className="w-[256px] bg-[#E94A6E] flex flex-col justify-between shrink-0 h-full relative overflow-hidden pointer-events-none select-none">
          {/* Overlay de bloqueo */}
          <div className="absolute inset-0 bg-black/30 z-10 backdrop-grayscale-[30%]"></div>
          <div className="flex items-center justify-center pt-6 px-4 pb-5 border-b border-white/10 relative z-0">
            <img src="/logo_kiuFlow_blanco.png" alt="KiuFlow" style={{ maxHeight: "42px", objectFit: "contain", opacity: 0.5 }} />
          </div>
          <div className="flex flex-col px-3 py-4 gap-1 relative z-0">
            {["Dashboard", "Mis Landings", "Funnels", "Analítica", "Ajustes"].map((item) => (
              <div key={item} className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-white/40 text-[14px]">
                <div className="w-4 h-4 bg-white/15 rounded"></div>
                {item}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-white/10 relative z-0">
            <div className="flex items-center gap-2 px-2 py-1">
              <ShieldOff size={12} className="text-white/40" />
              <span className="text-white/40 text-xs">Sin sesión</span>
            </div>
          </div>
        </nav>

        {/* Contenido principal */}
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-8 text-center max-w-[420px] px-8">

            {/* Ícono con halo */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#E94A6E]/20 blur-2xl scale-150"></div>
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#E94A6E] to-[#c13058] flex items-center justify-center shadow-xl">
                <Lock size={38} strokeWidth={1.8} className="text-white" />
              </div>
            </div>

            {/* Texto */}
            <div className="space-y-3">
              <h1 className="text-[28px] font-bold text-slate-800 tracking-tight leading-tight">Acceso Requerido</h1>
              <p className="text-slate-500 text-[15px] leading-relaxed">
                Para acceder al editor debes iniciar sesión en tu cuenta de
                <span className="font-semibold text-slate-700"> KiuFlow</span>.
              </p>
            </div>

            {/* Botón CTA */}
            <a
              href="https://app.kiuflow.online/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#E94A6E] to-[#c13058] text-white font-semibold rounded-2xl shadow-lg shadow-[#E94A6E]/25 hover:shadow-[#E94A6E]/40 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 text-[15px] no-underline"
            >
              <span>Iniciar sesión en KiuFlow</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
            </a>

            {/* Nota */}
            <p className="text-slate-400 text-sm">
              Una vez iniciada la sesión, recarga esta página para continuar.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (backendError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0c0c0f] gap-4 text-white">
        <div className="text-[40px]">🔌</div>
        <div className="text-red-400 text-lg font-semibold">Backend no disponible</div>
        <div className="text-zinc-400 text-sm text-center max-w-[400px]">
          Asegúrate de que el servidor backend esté corriendo en puerto 3001.
          <br /><br />
          <code className="bg-[#111116] px-3 py-1 rounded-md text-indigo-400 text-[13px]">
            cd backend && npm run dev
          </code>
        </div>
      </div>
    );
  }

  /**
   * Enrutador Dinámico
   * Cambia la vista activa y asigna identificadores de contexto 
   * (como projectId o funnelId) cuando se navega a constructores.
   */
  const handleNavigate = (view, id = null) => {
    if (view === "new") {
      setShowNewLandingModal(true);
      return;
    }
    if (view === "builder" || view === "classic-builder") {
      setActiveProjectId(id);
      setActiveNav(view);
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

  const handleCreateLanding = async () => {
    if (!newLandingName.trim()) return;
    setIsCreatingLanding(true);
    try {
      const result = await ProjectService.createProject({ client_id: currentClientId, sub_id: currentSubId, name: newLandingName });
      if(result.error) {
        alert(result.error);
        return;
      }
      loadProjects();
      setActiveProjectId(result.project.id);
      setActiveNav("classic-builder");
      setShowNewLandingModal(false);
      setNewLandingName("Mi Nueva Landing");
    } catch (e) {
      alert("Error creando landing");
    } finally {
      setIsCreatingLanding(false);
    }
  };

  const handleDelete = async (id, name, refresh) => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    await ProjectService.deleteProject(id, currentClientId, currentSubId);
    refresh();
  };

  /**
   * Factory Method para vistas
   * Renderiza el componente correspondiente según el estado de navegación.
   */
  const renderView = () => {
    if (activeNav === "builder" && activeProjectId) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="text-2xl font-bold">Studio Builder Pro</div>
          <div className="text-slate-500">Requiere licencia activa de GrapesJS Studio.</div>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg" onClick={() => { setActiveNav("landings"); loadProjects(); }}>Volver</button>
        </div>
      );
    }
    if (activeNav === "classic-builder" && activeProjectId) {
      return (
        <ClassicBuilderView
          projectId={activeProjectId}
          clientId={currentClientId}
          subId={currentSubId}
          onBack={() => { setActiveNav("landings"); loadProjects(); }}
        />
      );
    }
    if (activeNav === "funnel-wizard") {
      return (
        <div className="p-8 h-full overflow-auto">
          <FunnelWizardView
            clientId={currentClientId}
            subId={currentSubId}
            funnelId={activeFunnelId}
            onBack={() => { setActiveNav("funnels"); setActiveFunnelId(null); }}
          />
        </div>
      );
    }
    if (activeNav === "leads" && activeFunnelId) {
      return (
        <div className="p-8 h-full overflow-auto">
          <LeadsView
            funnelId={activeFunnelId}
            clientId={currentClientId}
            subId={currentSubId}
            onBack={() => setActiveNav("funnels")}
          />
        </div>
      );
    }
    switch (activeNav) {
      case "dashboard":
        return (
          <div className="p-8 h-full overflow-auto">
            <DashboardView client={currentClient} projects={projects} onNavigate={handleNavigate} />
          </div>
        );
      case "landings":
        return (
          <div className="p-8 h-full overflow-auto">
            <LandingsView client={currentClient} projects={projects} onNavigate={handleNavigate} onDelete={handleDelete} onRefresh={loadProjects} />
          </div>
        );
      case "funnels":
        return (
          <div className="p-8 h-full overflow-auto">
            <FunnelsListView clientId={currentClientId} onNavigate={handleNavigate} />
          </div>
        );
      case "analytics":
        return (
          <div className="p-8 h-full overflow-auto">
            <AnalyticsView />
          </div>
        );
      case "settings":
        return (
          <div className="p-8 h-full overflow-auto">
            <SettingsView client={currentClient} />
          </div>
        );
      case "builder":
      case "classic-builder":
        if (!activeProjectId) {
          return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8 bg-slate-50">
              <div className="text-[60px]">🎨</div>
              <div className="text-slate-800 text-2xl font-bold tracking-tight">Modo Edición</div>
              <div className="text-slate-500 max-w-[400px]">
                Para abrir el constructor visual, primero debes seleccionar una Landing Page existente o crear una nueva.
              </div>
              <button 
                className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
                onClick={() => setActiveNav("landings")}
              >
                Ir a Mis Landings
              </button>
            </div>
          );
        }
        return null; // Handle fallback naturally if activeProjectId exists it's handled above
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      <Sidebar client={currentClient} currentView={activeNav} onNavigate={handleNavigate} />
      <main className="flex-1 overflow-auto">
        {renderView()}
      </main>

      {/* MODAL CREAR LANDING */}
      {showNewLandingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">Crear Nueva Landing</h3>
              <p className="text-gray-500 text-sm mt-1">Dale un nombre a tu nuevo proyecto para empezar a diseñar.</p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Landing</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E94A6E] focus:border-transparent transition-all"
                value={newLandingName}
                onChange={(e) => setNewLandingName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateLanding()}
              />
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
              <button 
                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                onClick={() => setShowNewLandingModal(false)}
                disabled={isCreatingLanding}
              >
                Cancelar
              </button>
              <button 
                className="px-5 py-2.5 bg-[#E94A6E] text-white font-medium hover:bg-[#D8365D] rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                onClick={handleCreateLanding}
                disabled={isCreatingLanding || !newLandingName.trim()}
              >
                {isCreatingLanding ? "Creando..." : "Crear Landing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
