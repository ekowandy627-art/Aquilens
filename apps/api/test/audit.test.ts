import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import { resetAuditDemoStore } from "../src/audit/audit-demo.store";
import { resetAuditPacksDemoStore } from "../src/audit/audit-packs-demo.store";
import { resetGuestAccessDemoStore } from "../src/audit/guest-access-demo.store";
import { resetProcessDemoStore } from "../src/processes/process-demo.store";
import { isValidAuditPackPdf, generateAuditPackPdf } from "../src/audit/audit-pack-pdf";
import { auditPacksDemoStore } from "../src/audit/audit-packs-demo.store";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("audit API", () => {
  beforeEach(() => {
    resetProcessDemoStore();
    resetAuditDemoStore();
    resetAuditPacksDemoStore();
    resetGuestAccessDemoStore();
  });

  it("lists full audit trail for compliance officer", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/audit")
      .set("Authorization", "Bearer demo:user-gis-compliance")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.success, true);
        assert.ok(response.body.data.items.length >= 10);
        assert.ok(
          response.body.data.items.some(
            (item: { eventType?: string }) => item.eventType === "process.approved",
          ),
        );
      });

    await app.close();
  });

  it("scopes audit trail to staff own events only", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/audit")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.success, true);
        assert.ok(response.body.data.items.length >= 1);
        assert.ok(
          response.body.data.items.every(
            (item: { actorId?: string }) => item.actorId === "user-gis-staff",
          ),
        );
      });

    await app.close();
  });

  it("filters audit trail by entity type", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/audit?entityType=Process")
      .set("Authorization", "Bearer demo:user-gis-compliance")
      .expect(200)
      .expect((response) => {
        assert.ok(
          response.body.data.items.every(
            (item: { entityType?: string }) => item.entityType === "Process",
          ),
        );
      });

    await app.close();
  });

  it("exports CSV with expected columns", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer())
      .get("/api/v1/audit/export")
      .set("Authorization", "Bearer demo:user-gis-compliance")
      .expect(200);

    assert.match(response.text, /^timestamp,event_type,entity_type/);
    assert.match(response.text, /process\.approved/);

    await app.close();
  });

  it("generates audit pack job and produces PDF with all sections", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const generateResponse = await request(app.getHttpServer())
      .post("/api/v1/audit-packs/generate")
      .set("Authorization", "Bearer demo:user-gis-compliance")
      .send({
        scope: "function",
        scopeId: "fn-school-academics",
      })
      .expect(201);

    const jobId = generateResponse.body.data.jobId as string;
    assert.ok(jobId);

    await sleep(250);

    await request(app.getHttpServer())
      .get(`/api/v1/audit-packs/${jobId}/status`)
      .set("Authorization", "Bearer demo:user-gis-compliance")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.data.status, "ready");
      });

    const pdfResponse = await request(app.getHttpServer())
      .get(`/api/v1/audit-packs/${jobId}/file`)
      .set("Authorization", "Bearer demo:user-gis-compliance")
      .expect(200);

    assert.match(pdfResponse.headers["content-type"], /pdf/);
    assert.equal(isValidAuditPackPdf(pdfResponse.body), true);

    await app.close();
  });

  it("lists previously generated audit packs", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/audit-packs")
      .set("Authorization", "Bearer demo:user-gis-compliance")
      .expect(200)
      .expect((response) => {
        assert.ok(response.body.data.length >= 2);
        assert.ok(
          response.body.data.some(
            (item: { scopeLabel?: string }) => item.scopeLabel === "Academics",
          ),
        );
      });

    await app.close();
  });

  it("creates and revokes guest access", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const createResponse = await request(app.getHttpServer())
      .post("/api/v1/guest-access")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .send({
        scope: "function",
        scopeId: "fn-school-academics",
        auditorEmail: "external@cis.org",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    const token = createResponse.body.data.token as string;
    assert.ok(createResponse.body.data.accessUrl.includes(token));

    await request(app.getHttpServer())
      .get(`/api/v1/guest-access/validate/${token}`)
      .expect(200);

    const grantId = createResponse.body.data.id as string;

    await request(app.getHttpServer())
      .delete(`/api/v1/guest-access/${grantId}`)
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/guest-access/validate/${token}`)
      .expect(403);

    await app.close();
  });

  it("rejects non-admin guest access management", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/guest-access")
      .set("Authorization", "Bearer demo:user-gis-compliance")
      .send({
        scope: "function",
        scopeId: "fn-school-academics",
        auditorEmail: "external@cis.org",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .expect(403);

    await app.close();
  });

  it("unit: seeded PDF generates valid document", async () => {
    const job = auditPacksDemoStore.get("tenant-gis", "pack-academics-month");
    assert.ok(job);
    const buffer = await generateAuditPackPdf(job!, {
      institutionName: "Ghana International School",
      generatedBy: "James Asante",
      generatedAt: job!.createdAt,
    });
    assert.equal(isValidAuditPackPdf(buffer), true);
  });
});
