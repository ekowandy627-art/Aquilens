import { expect, test } from "@playwright/test";
import { LEGAL_DISCLAIMER } from "@aquilens/shared";
import { signInAs, waitForAppReady } from "./helpers/demo-session";

test.describe("Phase 12 product language", () => {
  test("P12-UI-03: dashboard is not labelled Compliance Dashboard", async ({ page }) => {
    await signInAs(page, "gis-admin@aquilens.test");
    await waitForAppReady(page);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByText(/compliance dashboard/i)).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 2, name: /operational control room/i }),
    ).toBeVisible();
  });

  test("P12-UI-04 / P12-UI-05: audit packs show legal disclaimer", async ({ page }) => {
    await signInAs(page, "gis-compliance@aquilens.test");
    await page.goto("/audit-packs");
    await waitForAppReady(page);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { level: 2, name: "Audit Packs", exact: true }),
    ).toBeVisible();
    const disclaimer = page.getByTestId("legal-disclaimer");
    await expect(disclaimer).toBeVisible();
    await expect(disclaimer).toContainText(LEGAL_DISCLAIMER.slice(0, 60));
    await expect(page.getByText(/does not certify organisations/i)).toBeVisible();
  });

  test("P12-UI-01/02: key pages avoid forbidden certification copy", async ({ page }) => {
    await signInAs(page, "gis-admin@aquilens.test");
    const paths = ["/dashboard", "/audit-packs", "/processes"];
    for (const path of paths) {
      if (!page.url().includes(path)) {
        await page.goto(path);
      }
      await waitForAppReady(page);
      await expect(page).not.toHaveURL(/\/login/);
      const body = (await page.locator("main").innerText()).toLowerCase();
      expect(body).not.toContain("you are certified");
      expect(body).not.toContain("compliance dashboard");
      expect(body).not.toMatch(/\bcompliant\b/);
    }
  });
});
