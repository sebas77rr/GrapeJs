import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ClientService, ProjectService } from "../services/AppServices";
import { API_URL } from "../infrastructure/api/config";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [clients, setClients] = useState([]);
  const [currentClientId, setCurrentClientId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [currentSubId, setCurrentSubId] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [kiuflowUser, setKiuflowUser] = useState(null);
  const [sidebarColor, setSidebarColor] = useState('#E94A6E'); // color por defecto rosa KiuFlow

  // Mapa de colores de KiuFlow -> color hex del sidebar
  const THEME_COLOR_MAP = {
    pink:   '#E94A6E',
    teal:   '#0d9488',
    blue:   '#2563eb',
    corporate: '#2563eb',
    purple: '#7c3aed',
    green:  '#16a34a',
    orange: '#ea580c',
    red:    '#dc2626',
    gray:   '#475569',
    slate:  '#475569',
    dark:   '#1e293b', 
    indigo: '#4f46e5',
    cyan:   '#0891b2',
  };


  /**
   * Flujo de autenticación SSO
   * ─────────────────────────────────────────────
   * 1. Lee el ?token= de la URL si viene desde KiuFlow
   * 2. Lo registra en el backend (que lo usará para llamadas a la API)
   * 3. Limpia el token de la URL inmediatamente (buena práctica de seguridad)
   * 4. Valida la sesión con /api/kiuflow/status
   * 5. Si no hay token en URL, valida directamente (usa fallback del .env)
   */
  useEffect(() => {
    const init = async () => {
      try {
        // Paso 1: Leer token de la URL
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get("token");

        if (urlToken) {
          // Paso 2: Registrar el token en el backend
          await fetch(`${API_URL}/auth/set-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: urlToken }),
          });

          // Paso 3: Limpiar el token de la URL (no debe quedar visible)
          // Reemplaza la URL sin recargar la página
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }

        // Paso 4: Validar sesión con KiuFlow
        const res = await fetch(`${API_URL}/kiuflow/status`);
        const data = await res.json();

        if (data.connected) {
          setIsAuthenticated(true);
          setKiuflowUser(data.user || null);

          // Obtener configuración de tema del usuario desde KiuFlow
          try {
            const settingsRes = await fetch(`${API_URL}/kiuflow/user-settings`);
            const settingsData = await settingsRes.json();
            const colorTheme = settingsData?.theme_colorTheme || 'pink';
            const hex = THEME_COLOR_MAP[colorTheme] || '#E94A6E';
            setSidebarColor(hex);
          } catch {
            // Si falla, mantiene el color por defecto
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    ClientService.getClients()
      .then((data) => {
        setClients(data);
        if (data.length > 0) setCurrentClientId(data[0].id);
      })
      .catch(() => setBackendError(true));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const params = new URLSearchParams(window.location.search);
    const urlSubId = params.get("sub_id") || params.get("suscription_id");

    fetch(`${API_URL}/kiuflow/subscriptions`)
      .then((r) => r.json())
      .then((data) => {
        const subs = data.subscriptions || [];
        setSubscriptions(subs);
        
        let def;
        if (urlSubId) {
          def = subs.find((s) => s.id === parseInt(urlSubId, 10));
        }
        if (!def) {
          def = subs.find((s) => s.id === 117) || subs[0];
        }
        
        if (def) setCurrentSubId(def.id);
        
        if (urlSubId) {
          const paramsToKeep = new URLSearchParams(window.location.search);
          paramsToKeep.delete("sub_id");
          paramsToKeep.delete("suscription_id");
          const search = paramsToKeep.toString() ? `?${paramsToKeep.toString()}` : "";
          window.history.replaceState({}, document.title, window.location.pathname + search);
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const loadProjects = useCallback(() => {
    if (!currentClientId || !currentSubId) return;
    setLoadingProjects(true);
    ProjectService.getProjectsByClient(currentClientId, currentSubId)
      .then((projects) => {
        setProjects(projects);
        setLoadingProjects(false);
      })
      .catch(() => setLoadingProjects(false));
  }, [currentClientId, currentSubId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const currentClient = clients.find((c) => c.id === currentClientId);

  return (
    <AppContext.Provider
      value={{
        clients,
        currentClientId,
        setCurrentClientId,
        currentClient,
        projects,
        loadingProjects,
        loadProjects,
        backendError,
        currentSubId,
        setCurrentSubId,
        subscriptions,
        isAuthenticated,
        kiuflowUser,
        sidebarColor,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {  
  return useContext(AppContext);
}
