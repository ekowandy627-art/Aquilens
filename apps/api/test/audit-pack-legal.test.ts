import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
  auditPackPdfIncludesLegalNotice,
  generateAuditPackPdf,
  isValidAuditPackPdf,
} from "../src/audit/audit-pack-pdf";
import { resetAuditPacksDemoStore } from "../src/audit/audit-packs-demo.store";
import { resetProcessDemoStore } from "../src/processes/process-demo.store";
import { auditPacksDemoStore } from "../src/audit/audit-packs-demo.store";

describe("audit pack legal (Phase 12)", () => {
  beforeEach(() => {
    resetProcessDemoStore();
    resetAuditPacksDemoStore();
  });

  it("P12-A-01: PDF includes full disclaimer text", async () => {
    const job = auditPacksDemoStore.create({
      id: "pack-legal-test-1",
      tenantId: "tenant-gis",
      scope: "function",
      scopeId: "fn-school-academics",
      scopeLabel: "Academics",
      createdBy: "user-gis-compliance",
    });

    const buffer = await generateAuditPackPdf(job, {
      institutionName: "Ghana International School",
      generatedBy: "James Asante",
      generatedAt: new Date().toISOString(),
    });

    assert.ok(isValidAuditPackPdf(buffer));
    assert.ok(
      auditPackPdfIncludesLegalNotice(buffer),
      "PDF must include legal notice marker or disclaimer metadata",
    );
    assert.ok(buffer.length > 35_000, "PDF with legal section should exceed baseline size");
  });

  it("P12-A-02: PDF disclaimer present for organisation-wide scope", async () => {
    const job = auditPacksDemoStore.create({
      id: "pack-legal-test-2",
      tenantId: "tenant-gis",
      scope: "date_range",
      scopeLabel: "Organisation",
      createdBy: "user-gis-admin",
    });

    const buffer = await generateAuditPackPdf(job, {
      institutionName: "Test Org",
      generatedBy: "Admin",
      generatedAt: new Date().toISOString(),
    });

    assert.ok(auditPackPdfIncludesLegalNotice(buffer));
  });
});
