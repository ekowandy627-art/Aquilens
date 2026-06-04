import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import {
  resetProcessDemoStore,
  processDemoStore,
} from "../src/processes/process-demo.store";
import { resetWorkflowDemoStore } from "../src/workflows/workflow-demo.store";

describe("Spec Sprint 4 — WorkflowEngine", () => {
  beforeEach(() => {
    resetProcessDemoStore();
    resetWorkflowDemoStore();
  });

  it("S4-WF-01: manual POST /workflows is disabled", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/workflows")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({ processId: "proc-gis-enrolment", title: "Manual" })
      .expect(422);

    await app.close();
  });

  it("S4-WF-02: submit for approval triggers approval workflow", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const owner = "demo:user-gis-owner";
    const created = await request(app.getHttpServer())
      .post("/api/v1/processes")
      .set("Authorization", `Bearer ${owner}`)
      .send({
        functionId: "fn-school-academics",
        processAreaId: "area-school-academics-student-records",
        name: "Submit triggers workflow",
      })
      .expect(201);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/processes/${created.body.data.id}`)
      .set("Authorization", `Bearer ${owner}`)
      .expect(200);

    processDemoStore.replacePeople(detail.body.data.currentVersion.id, [
      { userId: "user-gis-head", role: "approver" },
    ]);

    await request(app.getHttpServer())
      .post(`/api/v1/processes/${created.body.data.id}/submit`)
      .set("Authorization", `Bearer ${owner}`)
      .expect(201);

    const workflows = await request(app.getHttpServer())
      .get("/api/v1/workflows")
      .set("Authorization", "Bearer demo:user-gis-head")
      .expect(200);

    const match = workflows.body.data.find(
      (row: { title?: string; processId?: string }) =>
        row.processId === created.body.data.id &&
        row.title?.includes("Approve SOP"),
    );
    assert.ok(match);

    await app.close();
  });
});
