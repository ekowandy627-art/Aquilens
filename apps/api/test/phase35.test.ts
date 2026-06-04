import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatExecutionSchedule,
  formatReviewFrequency,
} from "../src/processes/execution-schedule";
import { resolveDemoUser } from "../src/auth/demo-users";
import {
  hasGlobalProcessRead,
  resolveProcessAccess,
} from "../src/processes/process-access";

describe("phase 3.5 access and schedules", () => {
  it("formats execution and review cadences differently", () => {
    assert.equal(formatReviewFrequency("annually"), "Annual SOP review");
    assert.equal(
      formatExecutionSchedule({ kind: "daily", timezone: "Africa/Accra" }),
      "Daily",
    );
    assert.equal(
      formatExecutionSchedule({
        kind: "relative",
        offsetDays: -5,
        relativeTo: { type: "calendar_event", key: "term_start" },
      }),
      "5 days before term start",
    );
  });

  it("grants staff viewer access only when assigned", () => {
    const staff = resolveDemoUser("demo:user-gis-staff");

    assert.equal(hasGlobalProcessRead(staff), false);

    const assigned = resolveProcessAccess(staff, [
      { userId: "user-gis-staff", role: "viewer" },
    ]);
    assert.equal(assigned.canView, true);
    assert.equal(assigned.canEdit, false);

    const unassigned = resolveProcessAccess(staff, [
      { userId: "user-gis-owner", role: "owner" },
    ]);
    assert.equal(unassigned.canView, false);
  });

  it("allows compliance to read all processes globally", () => {
    const compliance = resolveDemoUser("demo:user-gis-compliance");

    assert.equal(hasGlobalProcessRead(compliance), true);
  });
});
