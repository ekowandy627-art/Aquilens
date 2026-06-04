import { expect, test } from "@playwright/test";
import { resetGisDemo, signInAs, waitForAppReady } from "./helpers/demo-session";

test.describe("SOP composer shell", () => {
  test.beforeAll(async ({ request }) => {
    await resetGisDemo(request);
  });

  test("CMP-UI-01: owner lands on compose page", async ({ page }) => {
    await signInAs(page, "gis-owner@aquilens.test");
    await page.goto("/processes/compose");
    await waitForAppReady(page);
    await expect(page.getByRole("heading", { name: "Compose SOP" })).toBeVisible();
    await expect(page.getByTestId("compose-narrative")).toBeVisible();
    await expect(page.getByTestId("compose-function")).toBeVisible();
  });
});
