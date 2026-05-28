import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertCanPublish,
  ProcessLifecycleError,
} from "../src/approvals/process-lifecycle";
import { isReviewOverdue } from "../src/processes/review-schedule";

describe("process lifecycle (Phase 13)", () => {
  it("P13-U-01: approved version can be published", () => {
    assert.doesNotThrow(() => assertCanPublish("approved"));
  });

  it("P13-U-02: draft version cannot be published", () => {
    assert.throws(
      () => assertCanPublish("draft"),
      (error: unknown) =>
        error instanceof ProcessLifecycleError && error.code === "INVALID_STATE",
    );
  });

  it("P13-U-03: isReviewOverdue is true for past dates", () => {
    assert.equal(isReviewOverdue("2020-01-01", new Date("2026-05-28")), true);
    assert.equal(isReviewOverdue("2099-01-01", new Date("2026-05-28")), false);
  });
});
