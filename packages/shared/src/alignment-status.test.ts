import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ALIGNMENT_STATUS_LABELS,
  ALIGNMENT_STATUS_VALUES,
  GUIDANCE_SELECTION_LABELS,
} from "./alignment-status.js";

const forbiddenInLabels = [
  "compliant",
  "certified",
  "passed",
  "regulator_approved",
  "regulator-approved",
];

describe("alignment-status", () => {
  it("P12-U-03: alignment status values use approved PRD list", () => {
    assert.ok(ALIGNMENT_STATUS_VALUES.includes("not_started"));
    assert.ok(ALIGNMENT_STATUS_VALUES.includes("ready_for_internal_review"));
    assert.equal(ALIGNMENT_STATUS_VALUES.length, 10);
  });

  it("P12-U-03: display labels avoid forbidden certification wording", () => {
    for (const label of Object.values(ALIGNMENT_STATUS_LABELS)) {
      const lower = label.toLowerCase();
      for (const bad of forbiddenInLabels) {
        assert.ok(
          !lower.includes(bad.replace("_", "-")) && !lower.includes(bad),
          `Label "${label}" must not imply certification`,
        );
      }
    }
  });

  it("guidance selection labels are defined for Phase 14", () => {
    assert.equal(Object.keys(GUIDANCE_SELECTION_LABELS).length, 5);
  });
});
