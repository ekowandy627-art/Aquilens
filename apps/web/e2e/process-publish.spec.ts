import { expect, test } from "@playwright/test";
import {
  apiBase,
  demoAuthHeaders,
  resetGisDemo,
  signInAs,
  waitForAppReady,
} from "./helpers/demo-session";

test.describe.configure({ mode: "serial" });

test.describe("Phase 13 SOP control", () => {
  test.beforeAll(async ({ request }) => {
    await resetGisDemo(request);
  });

  test("P13-UI-05: draft fees process has no publish before approval", async ({ page }) => {
    await signInAs(page, "gis-owner@aquilens.test");
    await page.goto("/processes/proc-gis-fees");
    await waitForAppReady(page);
    await expect(page.getByTestId("process-tab-overview")).toBeVisible();
    await expect(page.getByTestId("publish-sop-button")).toHaveCount(0);
  });

  test("P13-UI-01: control fields persist on fees draft", async ({ page }) => {
    const patch = await page.request.patch(`${apiBase}/processes/proc-gis-fees`, {
      headers: demoAuthHeaders("user-gis-owner"),
      data: {
        triggerDescription: "Invoice received from finance",
        exceptions: "Scholarship fee waivers",
      },
    });
    expect(patch.ok()).toBeTruthy();

    await signInAs(page, "gis-owner@aquilens.test");
    await page.goto("/processes/proc-gis-fees");
    await waitForAppReady(page);
    await expect(page.getByTestId("process-tab-control")).toBeVisible();
    await page.getByTestId("process-tab-control").click();
    await expect(page.getByText("Invoice received from finance")).toBeVisible();
    await expect(page.getByText("Scholarship fee waivers")).toBeVisible();
  });

  test("P13-UI-06: upload document on fees process", async ({ page }) => {
    await signInAs(page, "gis-owner@aquilens.test");
    await page.goto("/processes/proc-gis-fees");
    await waitForAppReady(page);
    await page.getByTestId("process-tab-documents").click();

    const upload = page.getByTestId("process-document-upload");
    await upload.setInputFiles({
      name: "fee-policy.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 playwright"),
    });

    await expect(page.getByTestId("process-document-row")).toContainText("fee-policy.pdf");
  });

  test("P13-UI-02/04: publish approved fees SOP", async ({ page }) => {
    const submit = await page.request.post(`${apiBase}/processes/proc-gis-fees/submit`, {
      headers: demoAuthHeaders("user-gis-owner"),
    });
    expect(submit.ok()).toBeTruthy();
    const approve = await page.request.post(`${apiBase}/processes/proc-gis-fees/approve`, {
      headers: demoAuthHeaders("user-gis-head"),
      data: { comment: "Approved for publish E2E" },
    });
    expect(approve.ok()).toBeTruthy();

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
});
