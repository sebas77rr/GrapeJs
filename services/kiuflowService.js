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

async function postWithToken(endpoint, data = {}, jwtToken) {
  const url = `${API_URL}${endpoint}`;
  try {
    const response = await axios.post(url, data, {
      headers: { Authorization: `Bearer ${jwtToken}`, "Content-Type": "application/json" }
    });
    if (!response.data.success) throw new Error(response.data.message || "Error en la llamada a la API");
    return response.data.data;
  } catch (error) {
    if (error.response) throw new Error(`API Error: ${error.response.data.message || error.message}`);
    throw error;
  }
}

async function postPublic(endpoint, data = {}) {
  const url = `${API_URL}${endpoint}`;
  try {
    const response = await axios.post(url, data, {
      headers: { "Content-Type": "application/json" }
    });
    if (!response.data.success) throw new Error(response.data.message || "Error en la llamada a la API");
    return response.data.data;
  } catch (error) {
    if (error.response) throw new Error(`API Error: ${error.response.data.message || error.message}`);
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

  getSurvey: async (surveyId, suscriptionId = SUB_ID, jwtToken = null) => {
    const endpoint = `/api/v1/suscription/${suscriptionId}/survey/${surveyId}/get`;
    return jwtToken ? postWithToken(endpoint, {}, jwtToken) : post(endpoint, {});
  },

  getSurveyQuestions: async (surveyId, suscriptionId = SUB_ID, jwtToken = null) => {
    const endpoint = `/api/v1/suscription/${suscriptionId}/survey/${surveyId}/question/list`;
    return jwtToken ? postWithToken(endpoint, {}, jwtToken) : post(endpoint, {});
  },

  getSurveySubmissions: async (surveyId, suscriptionId = SUB_ID, jwtToken = null) => {
    const endpoint = `/api/v1/suscription/${suscriptionId}/survey/${surveyId}/submission/list`;
    return jwtToken ? postWithToken(endpoint, { maxRows: 1000 }, jwtToken) : post(endpoint, { maxRows: 1000 });
  },

  submitSurveyComplete: async (surveyId, clientId, answers, suscriptionId = SUB_ID, jwtToken = null) => {
    // Paso 1: Crear el Submission (el "sobre")
    let submission;
    try {
      const endpoint = `/api/v1/suscription/${suscriptionId}/survey/${surveyId}/submission/create`;
      const payload = { clientId: String(clientId) };
      submission = jwtToken ? await postWithToken(endpoint, payload, jwtToken) : await post(endpoint, payload);
    } catch (err) {
      throw new Error(`Error creando submission: ${err.message}`);
    }

    const submissionId = submission?.id || submission?.submissionId || submission?.data?.id || Object.values(submission || {})[0];
    if (!submissionId) {
      console.warn("No se pudo extraer el ID del submission, se usará '1' por defecto como contingencia. Payload devuelto:", submission);
    }
    const finalSubId = submissionId || 1;

    // Paso 2: Iterar sobre las respuestas y enviarlas una a una asociadas al submission
    const results = [];
    for (const ans of answers) {
      const type = (ans.type || "").toUpperCase();
      let payload = { questionId: String(ans.questionId) };

      if (type === "MULTIPLE_CHOICE") {
        // En frontend aseguramos que answer sea un arreglo de strings
        payload.optionId = Array.isArray(ans.answer) ? ans.answer : [String(ans.answer)];
      } else if (type === "SINGLE_CHOICE" || type === "CHOICE") {
        payload.optionId = String(ans.answer);
      } else {
        // TEXT, NUMERIC, DATE, etc. usan 'content'
        payload.content = String(ans.answer);
      }

      try {
        const endpoint = `/api/v1/suscription/${suscriptionId}/survey/${surveyId}/submission/${finalSubId}/response/create`;
        const res = jwtToken ? await postWithToken(endpoint, payload, jwtToken) : await post(endpoint, payload);
        results.push(res);
      } catch (err) {
        console.error(`Error guardando respuesta a pregunta ${ans.questionId}:`, err.message);
      }
    }

    // Paso 3: Cerrar la encuesta (status: COMPLETED)
    try {
      const endpoint = `/api/v1/suscription/${suscriptionId}/survey/${surveyId}/submission/${finalSubId}/update`;
      const payload = { status: "COMPLETED" };
      jwtToken ? await postWithToken(endpoint, payload, jwtToken) : await post(endpoint, payload);
    } catch (err) {
      console.error(`Error cerrando el submission ${finalSubId}:`, err.message);
    }

    return { submissionId: finalSubId, results };
  },
};

module.exports = kiuflowService;
