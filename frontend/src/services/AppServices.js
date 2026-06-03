import { api as infrastructureApi } from "../infrastructure/api";

/**
 * ProjectService
 * Gestiona el ciclo de vida de las Landing Pages (Classic Builder).
 * Sirve como fachada de la API Gateway (Backend).
 */
export class ProjectService {
  static async getProjectsByClient(clientId, subId) {
    if (!clientId) throw new Error("Client ID is required");
    const data = await infrastructureApi.getProjects(clientId, subId);
    return data.projects || [];
  }

  static async createProject(projectData) {
    if (!projectData.client_id || !projectData.name) {
      throw new Error("Missing required fields for project");
    }
    return await infrastructureApi.createProject(projectData);
  }

  static async getProjectById(projectId, clientId) {
    return await infrastructureApi.getProject(projectId, clientId);
  }

  static async saveProject(projectId, clientId, jsonData, html, css, name) {
    return await infrastructureApi.saveProject(projectId, clientId, jsonData, html, css, name);
  }

  static async deleteProject(projectId, clientId) {
    return await infrastructureApi.deleteProject(projectId, clientId);
  }
}

/**
 * ClientService
 * Gestiona la información base de clientes/suscriptores.
 */
export class ClientService {
  static async getClients() {
    return await infrastructureApi.getClients();
  }
}

/**
 * FunnelService
 * Gestiona el ciclo de vida de los Video Funnels y su 
 * integración con los módulos CRM (Canales, Plantillas, Archivos).
 */
export class FunnelService {
  static async getFunnelsByClient(clientId, subId) {
    return await infrastructureApi.getFunnels(clientId, subId);
  }

  static async getFunnelById(funnelId, clientId) {
    return await infrastructureApi.getFunnel(funnelId, clientId);
  }

  static async createFunnel(funnelData) {
    return await infrastructureApi.createFunnel(funnelData);
  }

  static async updateFunnel(funnelId, clientId, funnelData) {
    return await infrastructureApi.updateFunnel(funnelId, funnelData);
  }

  static async deleteFunnel(funnelId, clientId) {
    return await infrastructureApi.deleteFunnel(funnelId, clientId);
  }

  static async publishFunnel(funnelId) {
    return await infrastructureApi.publishFunnel(funnelId);
  }

  static async unpublishFunnel(funnelId) {
    return await infrastructureApi.unpublishFunnel(funnelId);
  }

  static async getLeads(funnelId, clientId) {
    return await infrastructureApi.getLeads(funnelId, clientId);
  }

  /**
   * Métodos integrados del CRM KiuFlow
   */
  static async getChannels() {
    return await infrastructureApi.getChannels();
  }
  static async getTemplates(channelId) {
    return await infrastructureApi.getTemplates(channelId);
  }
  static async getFiles(directoryId) {
    return await infrastructureApi.getFiles(directoryId);
  }
}