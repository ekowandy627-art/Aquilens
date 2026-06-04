import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AQUILENS_SUPPORT_SYSTEM_KEY,
  supportUserEmailForSlug,
} from "../src/internal/internal-tenants.service";

describe("M4 onboard + support user", () => {
  it("defines aquilens-support role key and support email pattern", () => {
    assert.equal(AQUILENS_SUPPORT_SYSTEM_KEY, "aquilens-support");
    assert.equal(
      supportUserEmailForSlug("acme-school"),
      "support+acme-school@platform.aquilens.internal",
    );
  });
});
