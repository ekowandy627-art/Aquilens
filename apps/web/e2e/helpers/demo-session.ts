import { expect, type APIRequestContext, type Page } from "@playwright/test";

const SESSION_KEY = "aquilens.auth-session.v1";
const DEMO_SESSION_COOKIE = "aquilens-demo-session";

export const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3001/api/v1";

const userByEmail: Record<string, { userId: string; tenantId: string }> = {
  "gis-admin@aquilens.test": { userId: "user-gis-admin", tenantId: "tenant-gis" },
  "gis-compliance@aquilens.test": {
    userId: "user-gis-compliance",
    tenantId: "tenant-gis",
  },
  "gis-head@aquilens.test": { userId: "user-gis-head", tenantId: "tenant-gis" },
  "gis-owner@aquilens.test": { userId: "user-gis-owner", tenantId: "tenant-gis" },
  "gis-staff@aquilens.test": { userId: "user-gis-staff", tenantId: "tenant-gis" },
};

export function demoAuthHeaders(userId = "user-gis-owner") {
  return { Authorization: `Bearer demo:${userId}` };
}

function e2eBaseUrl() {
  return (process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000").replace(
    /\/$/,
    "",
  );
}

export async function resetGisDemo(request: APIRequestContext) {
  const reset = await request.post(`${apiBase}/demo/reset-gis`, {
    headers: demoAuthHeaders("user-gis-admin"),
  });
  expect(reset.ok()).toBeTruthy();
}

export async function signInAs(page: Page, email = "gis-admin@aquilens.test") {
  const session = userByEmail[email] ?? userByEmail["gis-admin@aquilens.test"];
  const payload = JSON.stringify(session);
  const encoded = encodeURIComponent(payload);

  await page.context().addCookies([
    {
      name: DEMO_SESSION_COOKIE,
      value: encoded,
      url: e2eBaseUrl(),
    },
  ]);

  await page.addInitScript(
    ({ key, body }) => {
      window.localStorage.setItem(key, body);
    },
    { key: SESSION_KEY, body: payload },
  );

  await page.goto("/dashboard");
}

export async function waitForAppReady(page: Page) {
  await page.waitForFunction(
    () => !document.body.innerText.includes("Checking session"),
    undefined,
    { timeout: 20_000 },
  );
  await page.locator("main").waitFor({ state: "visible", timeout: 20_000 });
}

/** Navigate and assert a primary heading is visible (route smoke). */
export async function expectRouteReady(
  page: Page,
  path: string,
  heading: string | RegExp,
) {
  await page.goto(path);
  await waitForAppReady(page);
  await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
}
