import { expect, test } from "@playwright/test";
import {
  apiBase,
  demoAuthHeaders,
  resetGisDemo,
  signInAs,
  waitForAppReady,
} from "./helpers/demo-session";

test.describe.configure({ mode: "serial" });

test.describe("Training UI (replaces legacy acknowledgements)", () => {
  test.beforeAll(async ({ request }) => {
    await resetGisDemo(request);
  });

  test("TRN-UI-01: staff sees My Training with pending items", async ({ page }) => {
    await signInAs(page, "gis-staff@aquilens.test");
    await page.goto("/my-training");
    await waitForAppReady(page);
    await expect(page.getByRole("heading", { name: "My Training" }).first()).toBeVisible();
    await expect(page.getByText("Code of conduct read")).toBeVisible();
    await expect(page.getByText("Safeguarding essentials")).toBeVisible();
  });

  test("TRN-UI-02: staff completes acknowledge-only assignment", async ({ page }) => {
    await signInAs(page, "gis-staff@aquilens.test");
    await page.goto("/my-training");
    await waitForAppReady(page);
    await page.getByRole("button", { name: "Acknowledge" }).click();
    await expect(page.getByText("completed")).toBeVisible({ timeout: 15_000 });
  });

  test("TRN-UI-03: training API lists assignments for staff", async ({ request }) => {
    const response = await request.get(`${apiBase}/training/my`, {
      headers: demoAuthHeaders("user-gis-staff"),
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.data.length).toBeGreaterThan(0);
  });
});
