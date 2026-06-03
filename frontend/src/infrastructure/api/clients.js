import { API_URL } from "./config";

export const getClients = () => fetch(`${API_URL}/clients`).then((r) => r.json());
