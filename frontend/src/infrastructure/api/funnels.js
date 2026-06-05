import { API_URL } from "./config";

export const getFunnels = (clientId, subId) =>
  fetch(`${API_URL}/funnels?client_id=${clientId}&sub_id=${subId}`).then((r) => r.json());

export const getFunnel = (id, subId) =>
  fetch(`${API_URL}/funnels/${id}?sub_id=${subId || ''}`).then((r) => r.json());

export const createFunnel = (body) =>
  fetch(`${API_URL}/funnels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

export const updateFunnel = (id, body) =>
  fetch(`${API_URL}/funnels/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

export const publishFunnel = (id, subId) =>
  fetch(`${API_URL}/funnels/${id}/publish?sub_id=${subId || ''}`, { method: "PUT" }).then((r) => r.json());

export const unpublishFunnel = (id, subId) =>
  fetch(`${API_URL}/funnels/${id}/unpublish?sub_id=${subId || ''}`, { method: "PUT" }).then((r) => r.json());

export const deleteFunnel = (id, clientId, subId) =>
  fetch(`${API_URL}/funnels/${id}?client_id=${clientId}&sub_id=${subId || ''}`, { method: "DELETE" }).then((r) => r.json());

export const getLeads = (funnelId, clientId, subId) =>
  fetch(`${API_URL}/funnels/${funnelId}/leads?client_id=${clientId}&sub_id=${subId || ''}`).then((r) => r.json());