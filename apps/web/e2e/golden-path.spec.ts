import { expect, test } from "@playwright/test";
import {
  apiBase,
  demoAuthHeaders,
  expectRouteReady,
  resetGisDemo,
  signInAs,
  waitForAppReady,
} from "./helpers/demo-session";

test.describe.configure({ mode: "serial" });

test.describe("GIS golden path (UI → API)", () => {
  test.beforeAll(async ({ request }) => {
    await resetGisDemo(request);
  });

  test("GP-01: compliance can open core product areas", async ({ page }) => {
    await signInAs(page, "gis-compliance@aquilens.test");
    await waitForAppReady(page);

    await expectRouteReady(page, "/agents", "AI Agent Registry");
    await expectRouteReady(page, "/audit", "Audit");
    await expectRouteReady(page, "/audit-packs", "Audit Packs");
    await expectRouteReady(page, "/processes", "Processes");
    await expectRouteReady(page, "/workflows", "Compliance Records");
  });

  test("GP-02: register a new AI agent", async ({ page }) => {
    const agentName = `E2E Agent ${Date.now()}`;

    await signInAs(page, "gis-compliance@aquilens.test");
    await page.goto("/agents/new");
    await waitForAppReady(page);

    await page.getByRole("textbox", { name: "Name *" }).fill(agentName);
    await page.getByRole("textbox", { name: "Purpose" }).fill(
      "Playwright golden-path registration",
    );
    await page.getByRole("button", { name: "Register agent" }).click();

    await page.waitForURL(
      (url) =>
        /^\/agents\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/new"),
    );
    await waitForAppReady(page);
    await expect(page.getByRole("heading", { name: agentName })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("GP-03: admin adds a function on structure settings", async ({ page }) => {
    await signInAs(page, "gis-admin@aquilens.test");
    await page.goto("/settings/structure");
    await waitForAppReady(page);

    await page.getByRole("button", { name: "Add function" }).click();
    await page.getByRole("button", { name: "Save scaffold" }).click();
    await expect(
      page.getByText("Scaffold saved to Supabase and the audit log."),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("GP-04: owner can open manual SOP create wizard", async ({ page }) => {
    await signInAs(page, "gis-owner@aquilens.test");
    await page.goto("/processes/new/manual");
    await waitForAppReady(page);
    await expect(page.getByText("Location").first()).toBeVisible();
    await expect(page.getByText("Identity").first()).toBeVisible();
  });

  test("GP-05: processes list shows seeded GIS SOPs", async ({ page }) => {
    await signInAs(page, "gis-owner@aquilens.test");
    await page.goto("/processes");
    await waitForAppReady(page);
    await expect(page.getByText("Enrol New Student")).toBeVisible();
    await expect(page.getByText("Process Fee Payment")).toBeVisible();
  });

  test("GP-06: owner submits fees SOP for approval", async ({ page }) => {
    await signInAs(page, "gis-owner@aquilens.test");
    await page.goto("/processes/proc-gis-fees");
    await waitForAppReady(page);
    await page.getByRole("button", { name: "Submit for Approval" }).click();
    await expect(page.getByText(/under review|submitted/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("GP-07: head approves fees from queue", async ({ page }) => {
    await signInAs(page, "gis-head@aquilens.test");
    await page.goto("/approvals");
    await waitForAppReady(page);
    await expect(page.getByText("Process Fee Payment")).toBeVisible();
    await page.getByRole("link", { name: "Review" }).first().click();
    await waitForAppReady(page);
    await page.getByRole("button", { name: "Approve" }).click();
    await page.waitForURL("**/approvals");
    await expect(page.getByText("Process Fee Payment")).not.toBeVisible();
  });

  test("GP-08: owner publishes approved fees SOP", async ({ page }) => {
    await signInAs(page, "gis-owner@aquilens.test");
    await page.goto("/processes/proc-gis-fees");
    await waitForAppReady(page);

    await page.getByTestId("publish-sop-button").getByRole("button", { name: "Publish" }).click();
    await page.getByTestId("publish-effective-date").fill("2026-06-15");
    await page.getByTestId("publish-review-due-date").fill("2027-06-15");
    await page.getByTestId("publish-confirm").click();
    await waitForAppReady(page);

    await expect(page.getByText("active").first()).toBeVisible();
    await page.getByTestId("process-tab-version-history").click();
    await expect(page.getByText("Effective 2026-06-15")).toBeVisible();
  });

  test("GP-09: owner sees resolution workflows list (manual start removed)", async ({
    page,
  }) => {
    await signInAs(page, "gis-owner@aquilens.test");
    await page.goto("/workflows/new");
    await waitForAppReady(page);
    await expect(page).toHaveURL(/\/workflows\/?$/);

    await expect(
      page.getByText("Enrol New Student — Term 2 Audit Sample"),
    ).toBeVisible();
    await expect(page.getByText(/in progress/i).first()).toBeVisible();
    await expect(
      page.getByText(/Manual start is disabled|started automatically/i).first(),
    ).toBeVisible();
  });

  test("GP-10: department head completes in-progress compliance record task", async ({ page }) => {
    await signInAs(page, "gis-head@aquilens.test");
    await page.goto("/workflows/workflow-gis-enrolment-t2");
    await waitForAppReady(page);
    await expect(page.getByText("Safeguarding review", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText(/approved|completed/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("GP-11: compliance views audit trail", async ({ page }) => {
    await signInAs(page, "gis-compliance@aquilens.test");
    await page.goto("/audit");
    await waitForAppReady(page);
    await expect(page.locator("table tbody tr").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("GP-12: compliance generates audit pack to ready", async ({ page }) => {
    test.setTimeout(120_000);

    await signInAs(page, "gis-compliance@aquilens.test");
    await page.goto("/audit-packs");
    await waitForAppReady(page);

    await page.getByRole("button", { name: "Generate Pack" }).click();
    await expect(
      page.getByRole("button", { name: "Download" }).first(),
    ).toBeVisible({ timeout: 90_000 });
  });

  test("GP-13: staff completes acknowledge-only training", async ({ page }) => {
    await signInAs(page, "gis-staff@aquilens.test");
    await page.goto("/my-training");
    await waitForAppReady(page);
    await expect(page.getByRole("heading", { name: "My Training" }).first()).toBeVisible();
    await expect(page.getByText("Code of conduct read")).toBeVisible();
    await page.getByRole("button", { name: "Acknowledge" }).first().click();
    await expect(page.getByText("completed")).toBeVisible({ timeout: 15_000 });
  });

  test("GP-14: staff dashboard shows pending training", async ({ page }) => {
    await signInAs(page, "gis-staff@aquilens.test");
    await page.goto("/dashboard");
    await waitForAppReady(page);
    await expect(page.getByText("Pending training")).toBeVisible();
    await expect(page.getByText("Safeguarding essentials")).toBeVisible();
  });
});
