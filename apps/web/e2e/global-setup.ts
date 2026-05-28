import { request } from "@playwright/test";
import { apiBase, demoAuthHeaders } from "./helpers/demo-session";

export default async function globalSetup() {
  const context = await request.newContext();
  const reset = await context.post(`${apiBase}/demo/reset-gis`, {
    headers: demoAuthHeaders("user-gis-admin"),
  });
  if (!reset.ok()) {
    throw new Error(`GIS demo reset failed: ${reset.status()} ${await reset.text()}`);
  }
  await context.dispose();
}
