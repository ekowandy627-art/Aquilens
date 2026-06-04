import { expect, test } from "@playwright/test";
import { expectRouteReady, signInAs } from "./helpers/demo-session";

test.describe("standards updates", () => {
  test("loads standards updates page", async ({ page }) => {
    await signInAs(page, "gis-owner@aquilens.test");
    await expectRouteReady(page, "/standards/updates", /Standards updates/i);
    await expect(page.getByText(/latest published version|Run gap analysis/i).first()).toBeVisible();
  });
});
