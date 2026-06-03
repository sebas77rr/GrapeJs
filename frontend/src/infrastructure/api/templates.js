import { API_URL } from "./config";

export const getTemplates = () => fetch(`${API_URL}/templates`).then((r) => r.json());
