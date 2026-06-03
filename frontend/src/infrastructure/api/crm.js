import { BASE_URL } from "./config";

export async function getChannels() {
  const res = await fetch(`${BASE_URL}/api/crm/channels`);
  if (!res.ok) throw new Error("Error al cargar canales");
  return await res.json();
}

export async function getTemplates(channelId) {
  const res = await fetch(`${BASE_URL}/api/crm/templates?channelId=${channelId}`);
  if (!res.ok) throw new Error("Error al cargar plantillas");
  return await res.json();
}

export async function getFiles(directoryId = 85) {
  const res = await fetch(`${BASE_URL}/api/crm/files?directoryId=${directoryId}`);
  if (!res.ok) throw new Error("Error al cargar archivos");
  return await res.json();
}
