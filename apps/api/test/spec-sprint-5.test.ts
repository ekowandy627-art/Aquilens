import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import { resetIncidentDemoStore } from "../src/incidents/incident-demo.store";
import { resetSiaiDemoStore } from "../src/siai/siai-demo.store";
import { resetWorkflowDemoStore, workflowDemoStore } from "../src/workflows/workflow-demo.store";

describe("Spec Sprint 5 — Incidents + SIAI", () => {
  beforeEach(() => {
    resetIncidentDemoStore();
    resetSiaiDemoStore();
    resetWorkflowDemoStore();
  });

  it("S5-INC-01: POST incident creates resolution workflow", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const created = await request(app.getHttpServer())
      .post("/api/v1/incidents")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({
        title: "Data breach attempt",
        description: "Unauthorized access detected.",
        incidentType: "security",
        severity: "high",
      })
      .expect(201);

    assert.ok(created.body.data.linkedWorkflowInstanceId);
    assert.equal(created.body.data.derivedStatus, "resolution_in_progress");

    const workflows = await request(app.getHttpServer())
      .get("/api/v1/workflows")
      .set("Authorization", "Bearer demo:user-gis-compliance")
      .expect(200);

    const match = workflows.body.data.find(
      (row: { id?: string }) => row.id === created.body.data.linkedWorkflowInstanceId,
    );
    assert.ok(match);

    await app.close();
  });

  it("S5-INC-02: complete action with notes, urls, and file ids", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const created = await request(app.getHttpServer())
      .post("/api/v1/incidents")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({
        title: "Policy gap",
        description: "Missing control evidence.",
        incidentType: "compliance",
        severity: "medium",
        correctiveAction: "Update SOP appendix",
      })
      .expect(201);

    const actionId = created.body.data.actions[0].id;
    const completed = await request(app.getHttpServer())
      .post(`/api/v1/incidents/${created.body.data.id}/actions/${actionId}/complete`)
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({
        notes: "Evidence uploaded",
        referenceUrls: ["https://example.com/report"],
        evidenceFileIds: ["file-demo-1"],
      })
      .expect(201);

    assert.equal(completed.body.data.status, "completed");
    assert.equal(completed.body.data.evidenceNotes, "Evidence uploaded");
    assert.deepEqual(completed.body.data.referenceUrls, ["https://example.com/report"]);
    assert.deepEqual(completed.body.data.evidenceFileIds, ["file-demo-1"]);

    await app.close();
  });

  it("S5-INC-03: raiser cannot close via sign-off; different user closes", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const created = await request(app.getHttpServer())
      .post("/api/v1/incidents")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({
        title: "Sign-off rule",
        description: "Raiser must not close.",
        incidentType: "operational",
        severity: "low",
      })
      .expect(201);

    const workflowId = created.body.data.linkedWorkflowInstanceId as string;
    const tasks = workflowDemoStore.listTasks(workflowId);
    const actionTask = tasks.find((task) => task.title.includes("corrective"));
    const signOffTask = tasks.find((task) => task.title.includes("sign-off"));
    assert.ok(actionTask && signOffTask);

    await request(app.getHttpServer())
      .post(`/api/v1/workflows/${workflowId}/tasks/${actionTask.id}/evidence`)
      .set("Authorization", "Bearer demo:user-gis-compliance")
      .attach("file", Buffer.from("demo evidence"), "evidence.txt")
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/workflows/${workflowId}/tasks/${actionTask.id}/complete`)
      .set("Authorization", "Bearer demo:user-gis-compliance")
      .send({ notes: "Done" })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/workflows/${workflowId}/tasks/${signOffTask.id}/approve`)
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({ notes: "Self close attempt" })
      .expect(403);

    let detail = await request(app.getHttpServer())
      .get(`/api/v1/incidents/${created.body.data.id}`)
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);

    assert.notEqual(detail.body.data.derivedStatus, "closed");

    await request(app.getHttpServer())
      .post(`/api/v1/workflows/${workflowId}/tasks/${signOffTask.id}/approve`)
      .set("Authorization", "Bearer demo:user-gis-head")
      .send({ notes: "Approved by head" })
      .expect(201);

    detail = await request(app.getHttpServer())
      .get(`/api/v1/incidents/${created.body.data.id}`)
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);

    assert.equal(detail.body.data.derivedStatus, "closed");

    await app.close();
  });

  it("S5-INC-04: CO can open-resolution when workflow missing", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const created = await request(app.getHttpServer())
      .post("/api/v1/incidents")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({
        title: "Reopen case",
        description: "Needs CO intervention.",
        incidentType: "quality",
        severity: "medium",
      })
      .expect(201);

    const incidentId = created.body.data.id as string;
    const workflowId = created.body.data.linkedWorkflowInstanceId as string;
    workflowDemoStore.deleteInstance("tenant-gis", workflowId);

    const reopened = await request(app.getHttpServer())
      .post(`/api/v1/incidents/${incidentId}/open-resolution`)
      .set("Authorization", "Bearer demo:user-gis-compliance")
      .expect(201);

    assert.equal(reopened.body.data.reopened, true);
    assert.ok(reopened.body.data.workflowId);

    await app.close();
  });

  it("S5-SIAI-01: POST siai creates resolution workflow", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const created = await request(app.getHttpServer())
      .post("/api/v1/siai")
      .set("Authorization", "Bearer demo:user-gis-compliance")
      .send({
        title: "Supplier integrity alert",
        description: "Conflict of interest flagged.",
        category: "integrity",
        severity: "high",
      })
      .expect(201);

    assert.ok(created.body.data.linkedWorkflowInstanceId);
    assert.match(created.body.data.siaiCode, /^SIAI-/);

    await app.close();
  });
});
