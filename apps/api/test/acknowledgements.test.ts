import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import { auditDemoStore } from "../src/audit/audit-demo.store";
import {
  acknowledgementDemoStore,
  resetAcknowledgementDemoStore,
} from "../src/acknowledgements/acknowledgement-demo.store";
import {
  processDemoStore,
  resetProcessDemoStore,
} from "../src/processes/process-demo.store";

describe("acknowledgements API (Phase 15)", () => {
  beforeEach(() => {
    resetAcknowledgementDemoStore();
    resetProcessDemoStore();
  });

  async function createApp() {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    return app;
  }

  it("P15-A-02: create campaign assigns users", async () => {
    const app = await createApp();
    const response = await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-enrolment/acknowledgements/campaigns")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({ userIds: ["user-gis-staff"], dueDate: "2026-12-31" })
      .expect(201);

    assert.equal(response.body.data.assignments.length, 1);
    assert.equal(response.body.data.assignments[0].userId, "user-gis-staff");
    await app.close();
  });

  it("P15-A-03: GET my pending for staff", async () => {
    const app = await createApp();
    acknowledgementDemoStore.createCampaign({
      tenantId: "tenant-gis",
      processId: "proc-gis-enrolment",
      processVersionId: "proc-gis-enrolment-v3",
      userIds: ["user-gis-staff", "user-gis-owner"],
    });

    const response = await request(app.getHttpServer())
      .get("/api/v1/acknowledgements/my")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(200);

    assert.equal(response.body.data.length, 1);
    assert.equal(response.body.data[0].processId, "proc-gis-enrolment");
    await app.close();
  });

  it("P15-A-04: confirm acknowledgement", async () => {
    const app = await createApp();
    const { assignments } = acknowledgementDemoStore.createCampaign({
      tenantId: "tenant-gis",
      processId: "proc-gis-enrolment",
      processVersionId: "proc-gis-enrolment-v3",
      userIds: ["user-gis-staff"],
    });
    const assignmentId = assignments[0]!.id;

    const confirm = await request(app.getHttpServer())
      .post(`/api/v1/acknowledgements/${assignmentId}/confirm`)
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(201);

    assert.equal(confirm.body.data.assignment.status, "completed");
    assert.ok(confirm.body.data.acknowledgement.acknowledgedAt);
    await app.close();
  });

  it("P15-A-05: confirm wrong user forbidden", async () => {
    const app = await createApp();
    const { assignments } = acknowledgementDemoStore.createCampaign({
      tenantId: "tenant-gis",
      processId: "proc-gis-enrolment",
      processVersionId: "proc-gis-enrolment-v3",
      userIds: ["user-gis-staff"],
    });

    await request(app.getHttpServer())
      .post(`/api/v1/acknowledgements/${assignments[0]!.id}/confirm`)
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(403);
    await app.close();
  });

  it("P15-A-06: confirm twice is idempotent", async () => {
    const app = await createApp();
    const { assignments } = acknowledgementDemoStore.createCampaign({
      tenantId: "tenant-gis",
      processId: "proc-gis-enrolment",
      processVersionId: "proc-gis-enrolment-v3",
      userIds: ["user-gis-staff"],
    });
    const assignmentId = assignments[0]!.id;

    const first = await request(app.getHttpServer())
      .post(`/api/v1/acknowledgements/${assignmentId}/confirm`)
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(201);

    const second = await request(app.getHttpServer())
      .post(`/api/v1/acknowledgements/${assignmentId}/confirm`)
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(201);

    assert.equal(
      second.body.data.acknowledgement.acknowledgedAt,
      first.body.data.acknowledgement.acknowledgedAt,
    );
    await app.close();
  });

  it("P15-A-08: manager read progress", async () => {
    const app = await createApp();
    acknowledgementDemoStore.createCampaign({
      tenantId: "tenant-gis",
      processId: "proc-gis-enrolment",
      processVersionId: "proc-gis-enrolment-v3",
      userIds: ["user-gis-staff"],
    });

    const response = await request(app.getHttpServer())
      .get("/api/v1/processes/proc-gis-enrolment/acknowledgements")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);

    assert.ok(response.body.data.campaigns.length >= 1);
    assert.equal(response.body.data.campaigns[0].assignments.length, 1);
    await app.close();
  });

  it("P15-A-09: staff cannot manage campaign", async () => {
    const app = await createApp();
    await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-enrolment/acknowledgements/campaigns")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .send({ userIds: ["user-gis-staff"] })
      .expect(403);
    await app.close();
  });

  it("P15-A-10: overdue list", async () => {
    const app = await createApp();
    acknowledgementDemoStore.createCampaign({
      tenantId: "tenant-gis",
      processId: "proc-gis-enrolment",
      processVersionId: "proc-gis-enrolment-v3",
      userIds: ["user-gis-staff"],
      dueDate: "2020-01-01",
    });

    const response = await request(app.getHttpServer())
      .get("/api/v1/acknowledgements/overdue")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);

    assert.ok(response.body.data.length >= 1);
    assert.equal(response.body.data[0].status, "overdue");
    await app.close();
  });

  it("P15-A-12: tenant isolation", async () => {
    const app = await createApp();
    const { assignments } = acknowledgementDemoStore.createCampaign({
      tenantId: "tenant-gis",
      processId: "proc-gis-enrolment",
      processVersionId: "proc-gis-enrolment-v3",
      userIds: ["user-gis-staff"],
    });

    await request(app.getHttpServer())
      .post(`/api/v1/acknowledgements/${assignments[0]!.id}/confirm`)
      .set("Authorization", "Bearer demo:user-hospital-staff")
      .expect(404);
    await app.close();
  });

  it("P15-A-13: audit on confirm", async () => {
    const app = await createApp();
    const { assignments } = acknowledgementDemoStore.createCampaign({
      tenantId: "tenant-gis",
      processId: "proc-gis-enrolment",
      processVersionId: "proc-gis-enrolment-v3",
      userIds: ["user-gis-staff"],
    });

    await request(app.getHttpServer())
      .post(`/api/v1/acknowledgements/${assignments[0]!.id}/confirm`)
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(201);

    const audit = auditDemoStore.list("tenant-gis", { limit: 20 });
    assert.ok(
      audit.items.some((row) => row.eventType === "acknowledgement.completed"),
    );
    await app.close();
  });

  it("P15-A-01: publish creates campaign when ack required", async () => {
    const app = await createApp();

    await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-hr-recruitment/approve")
      .set("Authorization", "Bearer demo:user-gis-head")
      .send({ comment: "Approved for acknowledgement test" })
      .expect(201);

    await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-hr-recruitment/publish")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({
        effectiveDate: "2026-06-01",
        acknowledgementRequired: true,
      })
      .expect(201);

    const acks = await request(app.getHttpServer())
      .get("/api/v1/processes/proc-gis-hr-recruitment/acknowledgements")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);

    assert.ok(acks.body.data.campaigns.length >= 1);
    await app.close();
  });

  it("P15-A-07: confirm wrong version returns 422", async () => {
    const app = await createApp();
    const { assignments } = acknowledgementDemoStore.createCampaign({
      tenantId: "tenant-gis",
      processId: "proc-gis-enrolment",
      processVersionId: "proc-gis-enrolment-v3",
      userIds: ["user-gis-staff"],
    });

    await request(app.getHttpServer())
      .post(`/api/v1/acknowledgements/${assignments[0]!.id}/confirm`)
      .set("Authorization", "Bearer demo:user-gis-staff")
      .send({ processVersionId: "proc-gis-enrolment-v1" })
      .expect(422);

    await app.close();
  });

  it("P15-A-11: version-specific campaign history", async () => {
    const app = await createApp();
    acknowledgementDemoStore.createCampaign({
      tenantId: "tenant-gis",
      processId: "proc-gis-enrolment",
      processVersionId: "proc-gis-enrolment-v2",
      userIds: ["user-gis-staff"],
    });
    acknowledgementDemoStore.createCampaign({
      tenantId: "tenant-gis",
      processId: "proc-gis-enrolment",
      processVersionId: "proc-gis-enrolment-v3",
      userIds: ["user-gis-staff"],
    });

    const response = await request(app.getHttpServer())
      .get("/api/v1/processes/proc-gis-enrolment/acknowledgements")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);

    const versionIds = response.body.data.campaigns.map(
      (row: { processVersionId: string }) => row.processVersionId,
    );
    assert.ok(versionIds.includes("proc-gis-enrolment-v2"));
    assert.ok(versionIds.includes("proc-gis-enrolment-v3"));
    await app.close();
  });

  it("P15-A-14: publish without ack flag does not add campaign", async () => {
    const app = await createApp();

    await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-fees/submit")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(201);

    await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-fees/approve")
      .set("Authorization", "Bearer demo:user-gis-head")
      .send({ comment: "Approved without ack" })
      .expect(201);

    const before = await request(app.getHttpServer())
      .get("/api/v1/processes/proc-gis-fees/acknowledgements")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);
    const countBefore = before.body.data.campaigns?.length ?? 0;

    await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-fees/publish")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({
        effectiveDate: "2026-06-01",
        acknowledgementRequired: false,
      })
      .expect(201);

    const after = await request(app.getHttpServer())
      .get("/api/v1/processes/proc-gis-fees/acknowledgements")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);

    assert.equal(after.body.data.campaigns?.length ?? 0, countBefore);
    await app.close();
  });

  it("P15-A-15: empty userIds on campaign returns 422", async () => {
    const app = await createApp();
    await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-enrolment/acknowledgements/campaigns")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({ userIds: [] })
      .expect(422);
    await app.close();
  });

  it("P15-A-16: staff can read assignment SOP", async () => {
    const app = await createApp();
    const { assignments } = acknowledgementDemoStore.createCampaign({
      tenantId: "tenant-gis",
      processId: "proc-gis-enrolment",
      processVersionId: "proc-gis-enrolment-v3",
      userIds: ["user-gis-staff"],
    });
    processDemoStore.ensureViewerAccess("proc-gis-enrolment-v3", ["user-gis-staff"]);

    const response = await request(app.getHttpServer())
      .get(`/api/v1/acknowledgements/assignments/${assignments[0]!.id}/sop`)
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(200);

    assert.equal(response.body.data.processVersionId, "proc-gis-enrolment-v3");
    assert.ok(response.body.data.steps.length >= 1);
    await app.close();
  });

  it("P15-A-17: overdue sends notification once", async () => {
    const app = await createApp();
    const { assignments } = acknowledgementDemoStore.createCampaign({
      tenantId: "tenant-gis",
      processId: "proc-gis-enrolment",
      processVersionId: "proc-gis-enrolment-v3",
      userIds: ["user-gis-staff"],
      dueDate: "2020-01-01",
    });

    await request(app.getHttpServer())
      .get("/api/v1/acknowledgements/overdue")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);

    const notifications = await request(app.getHttpServer())
      .get("/api/v1/notifications")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(200);

    assert.ok(
      notifications.body.data.some(
        (row: { type: string; entityId?: string }) =>
          row.type === "acknowledgement.overdue" &&
          row.entityId === assignments[0]!.id,
      ),
    );
    await app.close();
  });
});
