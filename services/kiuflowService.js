const axios = require("axios");
const { getValidToken } = require("./kiuflowAuth");
require("dotenv").config();

const API_URL = process.env.KIUFLOW_API_URL || "https://apiengine.kiuflow.online";
const SUB_ID = process.env.KIUFLOW_SUBSCRIPTION_ID || 117;

/**
 * Función base para llamadas POST a la API de KiuFlow
 */
async function post(endpoint, data = {}) {
  const token = await getValidToken();
  const url = `${API_URL}${endpoint}`;

  try {
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.data.success) {
      throw new Error(response.data.message || "Error en la llamada a la API");
    }
    return response.data.data;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        const { clearExternalToken } = require("./kiuflowAuth");
        clearExternalToken();
        throw new Error("AUTH_EXPIRED");
      }
      console.error(
        `Error de API KiuFlow en ${endpoint}:`,
        error.response.data,
      );
      throw new Error(
        `API Error: ${error.response.data.message || error.message}`,
      );
    }
    console.error(`Error conectando a KiuFlow en ${endpoint}:`, error.message);
    throw error;
  }
}

async function get(endpoint) {
  const token = await getValidToken();
  const url = `${API_URL}${endpoint}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.data.success) {
      throw new Error(
        response.data.message || "Error en la llamada GET a la API",
      );
    }
    return response.data.data;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        const { clearExternalToken } = require("./kiuflowAuth");
        clearExternalToken();
        throw new Error("AUTH_EXPIRED");
      }
      console.error(
        `Error de API KiuFlow en ${endpoint}:`,
        error.response.data,
      );
      throw new Error(
        `API Error: ${error.response.data.message || error.message}`,
      );
    }
    console.error(`Error conectando a KiuFlow en ${endpoint}:`, error.message);
    throw error;
  }
}

// ==========================================
// MÉTODOS DEL SERVICIO API KIUFLOW
// ==========================================

const kiuflowService = {
  /**
   * --- Suscripciones, Canales y Archivos 
   */
  getSuscriptions: async () => {
    return post("/api/v1/suscription/list", {});
  },

  getChannels: async (suscriptionId = SUB_ID) => {
    return post(`/api/v1/suscription/${suscriptionId}/channel/list`, {});
  },
  getTemplates: async (channelId, suscriptionId = SUB_ID) => {
    return post(
      `/api/v1/suscription/${suscriptionId}/channel/${channelId}/messageTemplate/list`,
      {},
    );
  },
  getFiles: async (directoryId = 85, suscriptionId = SUB_ID) => {
    return post(`/api/v1/suscription/${suscriptionId}/file/list`, {
      directoryId,
    });
  },
  getClients: async (suscriptionId = SUB_ID) => {
    return post(`/api/v1/suscription/${suscriptionId}/client/list`, {});
  },

  /**
   * --- Webpages (Módulo de CMS/Builder) ---
   * Permiten leer, guardar y publicar Landings y Video Funnels 
   * directamente en el repositorio de KiuFlow.
   */
  listWebpages: async (suscriptionId = SUB_ID) => {
    return post(`/api/v1/suscription/${suscriptionId}/webPage/list`, {});
  },
  getWebpage: async (pageId, suscriptionId = SUB_ID) => {
    return post(
      `/api/v1/suscription/${suscriptionId}/webPage/${pageId}/get`,
      {},
    );
  },

  createWebpage: async (pageData, suscriptionId = SUB_ID) => {
    return post(
      `/api/v1/suscription/${suscriptionId}/webPage/create`,
      pageData,
    );
  },

  updateWebpage: async (pageId, pageData, suscriptionId = SUB_ID) => {
    return post(
      `/api/v1/suscription/${suscriptionId}/webPage/${pageId}/update`,
      pageData,
    );
  },

  deleteWebpage: async (pageId, suscriptionId = SUB_ID) => {
    return post(
      `/api/v1/suscription/${suscriptionId}/webPage/${pageId}/remove`,
      {},
    );
  },

  restoreWebpage: async (pageId, suscriptionId = SUB_ID) => {
    return post(
      `/api/v1/suscription/${suscriptionId}/webPage/${pageId}/restore`,
      {},
    ); 
  },

  /**
   * --- Clientes / Leads ---
   * Sincronización bidireccional del CRM de clientes.
   */
  createClient: async (clientData, suscriptionId = SUB_ID) => {
    return post(
      `/api/v1/suscription/${suscriptionId}/client/create`,
      clientData,
    );
  },

  /**
   * --- Agendamiento de Citas ---
   * Integración con el calendario y horarios de KiuFlow.
   */
  getAvailability: async (date, suscriptionId = SUB_ID) => {
    return post(
      `/api/v1/suscription/${suscriptionId}/appointment/availableScheduleSlots`,
      { date },
    );
  },

  getAppointments: async (suscriptionId = SUB_ID) => {
    return post(
      `/api/v1/suscription/${suscriptionId}/appointment/list`,
      {}
    );
  },

  createAppointment: async (appointmentData, suscriptionId = SUB_ID) => {
    return post(
      `/api/v1/suscription/${suscriptionId}/appointment/create`,
      appointmentData,
    );
  },

  updateAppointment: async (appointmentId, appointmentData, suscriptionId = SUB_ID) => {
    return post(
      `/api/v1/suscription/${suscriptionId}/appointment/${appointmentId}/update`,
      appointmentData,
    );
  },

  /**
   * --- Recordatorios / Mensajería ---
   * Integración con la API de Recordatorios Programados.
   */
  getReminders: async (suscriptionId = SUB_ID) => {
    return post(
      `/api/v1/suscription/${suscriptionId}/reminder/list`,
      {}
    );
  },

  createReminder: async (reminderData, suscriptionId = SUB_ID) => {
    return post(
      `/api/v1/suscription/${suscriptionId}/reminder/create`,
      reminderData,
    );
  },

  removeReminder: async (reminderId, suscriptionId = SUB_ID) => {
    return post(
      `/api/v1/suscription/${suscriptionId}/reminder/${reminderId}/remove`,
      {}
    );
  },

  /**
   * --- Automatizaciones y Recordatorios ---
   * Permite programar mensajes, correos o WhatsApps diferidos.
   */
  createReminder: async (reminderData, suscriptionId = SUB_ID) => {
    return post(
      `/api/v1/suscription/${suscriptionId}/reminder/create`,
      reminderData,
    );
  },

  /**
   * --- Administración de Equipo ---
   * Listado de administradores y agentes para mapeo de roles y asignaciones.
   */
  getAdmins: async (suscriptionId = SUB_ID) => {
    return post(`/api/v1/suscription/${suscriptionId}/admin/list`, {});
  },

  getAgents: async (suscriptionId = SUB_ID) => {
  return post(`/api/v1/suscription/${suscriptionId}/agent/list`, {});
  },

  /**
   * --- Encuestas (Surveys) ---
   */
  getSurveys: async (suscriptionId = SUB_ID) => {
    return post(`/api/v1/suscription/${suscriptionId}/survey/list`, {});
  },

  getSurvey: async (surveyId, suscriptionId = SUB_ID) => {
    return post(`/api/v1/suscription/${suscriptionId}/survey/${surveyId}/get`, {});
  },

  getSurveyQuestions: async (surveyId, suscriptionId = SUB_ID) => {
    return post(`/api/v1/suscription/${suscriptionId}/survey/${surveyId}/question/list`, {});
  },
};

module.exports = kiuflowService;
