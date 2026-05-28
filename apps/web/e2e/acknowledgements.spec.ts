import { expect, test } from "@playwright/test";
import {
  apiBase,
  demoAuthHeaders,
  resetGisDemo,
  signInAs,
  waitForAppReady,
} from "./helpers/demo-session";

test.describe.configure({ mode: "serial" });

test.describe("Phase 15 acknowledgements UI", () => {
  test.beforeAll(async ({ request }) => {
    await resetGisDemo(request);
  });

  test("P15-UI-01: staff sees My Acknowledgements with pending item", async ({ page }) => {
    await signInAs(page, "gis-staff@aquilens.test");
    await page.goto("/my-acknowledgements");
    await waitForAppReady(page);
    await expect(page.getByRole("heading", { name: "My Acknowledgements" })).toBeVisible();
    await expect(page.getByText("Enrol New Student")).toBeVisible();
  });

  test("P15-UI-02/04: read version-scoped SOP and confirm", async ({ page }) => {
    const pending = await page.request.get(`${apiBase}/acknowledgements/my`, {
      headers: demoAuthHeaders("user-gis-staff"),
    });
    expect(pending.ok()).toBeTruthy();
    const body = await pending.json();
    const assignmentId = (body.data as Array<{ id: string }>)[0]?.id;
    expect(assignmentId).toBeTruthy();

    await signInAs(page, "gis-staff@aquilens.test");
    await page.goto(`/my-acknowledgements/${assignmentId}`);
    await waitForAppReady(page);
    await expect(page.getByTestId("ack-sop-read-view")).toBeVisible();
    await page
      .getByRole("button", { name: "Confirm acknowledgement" })
      .click();
    await page.waitForURL("**/my-acknowledgements");
    await expect(page.getByText("Nothing pending")).toBeVisible();
  });

  test("P15-UI-05: manager sees acknowledgement progress tab", async ({ page }) => {
    await signInAs(page, "gis-owner@aquilens.test");
    await page.goto("/processes/proc-gis-enrolment");
    await waitForAppReady(page);
    await page.getByTestId("process-tab-acknowledgements").click();
    await expect(page.getByText("100% complete")).toBeVisible();
    await expect(page.getByText("Grace Osei")).toBeVisible();
  });

  test("P15-UI-07: overdue badge on list", async ({ page, request }) => {
    const campaigns = await request.post(
      `${apiBase}/processes/proc-gis-enrolment/acknowledgements/campaigns`,
      {
        headers: demoAuthHeaders("user-gis-owner"),
        data: { userIds: ["user-gis-staff"], dueDate: "2020-01-01" },
      },
    );
    expect(campaigns.ok()).toBeTruthy();

    await signInAs(page, "gis-staff@aquilens.test");
    await page.goto("/my-acknowledgements");
    await waitForAppReady(page);
    await expect(page.getByText("overdue")).toBeVisible();
  });
});
