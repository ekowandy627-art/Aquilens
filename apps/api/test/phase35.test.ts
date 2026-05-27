import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatExecutionSchedule,
  formatReviewFrequency,
} from "../src/processes/execution-schedule";
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
    const staff = {
      id: "user-gis-staff",
      tenantId: "tenant-gis",
      email: "gis-staff@aquilens.test",
      roles: ["Staff"],
      permissions: ["processes:read", "workflows:complete"],
    };

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
    const compliance = {
      id: "user-gis-compliance",
      tenantId: "tenant-gis",
      email: "gis-compliance@aquilens.test",
      roles: ["Compliance Officer"],
      permissions: ["processes:read", "audit:read"],
    };

    assert.equal(hasGlobalProcessRead(compliance), true);
  });
});
