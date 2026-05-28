import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeAssignmentStatus,
  completionRate,
} from "../src/acknowledgements/acknowledgement-status";

describe("acknowledgement status (Phase 15)", () => {
  it("P15-U-01: pending becomes overdue after due date", () => {
    const status = computeAssignmentStatus(
      "pending",
      "2020-01-01",
      new Date("2026-05-28T12:00:00.000Z"),
    );
    assert.equal(status, "overdue");
  });

  it("P15-U-02: completion rate", () => {
    const rate = completionRate([
      { status: "completed" },
      { status: "completed" },
      { status: "pending" },
      { status: "overdue" },
    ]);
    assert.equal(rate, 50);
  });

  it("P15-U-03: completed stays completed", () => {
    assert.equal(
      computeAssignmentStatus("completed", "2020-01-01"),
      "completed",
    );
  });
});
