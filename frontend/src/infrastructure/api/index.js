import * as clients from "./clients";
import * as projects from "./projects";
import * as templates from "./templates";
import * as funnels from "./funnels";
import * as crm from "./crm";
import { BASE_URL } from "./config";

export const api = {
  ...clients,
  ...projects,
  ...templates,
  ...funnels,
  ...crm,
};

export { BASE_URL };
