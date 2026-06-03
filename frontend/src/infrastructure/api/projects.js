import { API_URL } from "./config";

export const getProjects = (clientId, subId) =>
  fetch(`${API_URL}/projects?client_id=${clientId}&sub_id=${subId}`).then((r) => r.json());

export const getProject = (id, clientId) =>
  fetch(`${API_URL}/projects/${id}?client_id=${clientId}`).then((r) => r.json());

export const createProject = (body) =>
  fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

export const saveProject = (id, clientId, jsonData, html, css, name) =>
  fetch(`${API_URL}/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, json_data: jsonData, html, css, name }),
  }).then((r) => r.json());

export const deleteProject = (id, clientId) =>
  fetch(`${API_URL}/projects/${id}?client_id=${clientId}`, {
    method: "DELETE",
  }).then((r) => r.json());