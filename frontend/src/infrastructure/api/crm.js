import { BASE_URL } from "./config";

export async function getChannels(subId) {
  const query = subId ? `?sub_id=${subId}` : '';
  const res = await fetch(`${BASE_URL}/api/crm/channels${query}`);
  if (!res.ok) throw new Error("Error al cargar canales");
  return await res.json();
}

export async function getTemplates(channelId, subId) {
  const res = await fetch(`${BASE_URL}/api/crm/templates?channelId=${channelId}&sub_id=${subId || ''}`);
  if (!res.ok) throw new Error("Error al cargar plantillas");
  return await res.json();
}

export async function getFiles(directoryId = 85, subId) {
  const res = await fetch(`${BASE_URL}/api/crm/files?directoryId=${directoryId}&sub_id=${subId || ''}`);
  if (!res.ok) throw new Error("Error al cargar archivos");
  return await res.json();
}
