import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import { resetProcessDemoStore } from "../src/processes/process-demo.store";
import { resetWorkflowDemoStore } from "../src/workflows/workflow-demo.store";

describe("workflows API", () => {
  beforeEach(() => {
    resetProcessDemoStore();
    resetWorkflowDemoStore();
  });

  it("lists seeded workflows for gis-owner", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/workflows")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.success, true);
        assert.ok(response.body.data.length >= 4);
        assert.ok(
          response.body.data.some(
            (item: { title?: string }) =>
              item.title === "Enrol New Student — Term 2 Audit Sample",
          ),
        );
      });

    await app.close();
  });

  it("blocks manual workflow start (system triggers only)", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/workflows")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({
        processId: "proc-gis-enrolment",
        title: "Enrol New Student — Summer 2026",
        context: "Summer intake",
      })
      .expect(422)
      .expect((response) => {
        assert.equal(response.body.error.code, "MANUAL_START_DISABLED");
      });

    await app.close();
  });

  it("manual start remains disabled for non-active processes", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/workflows")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({
        processId: "proc-gis-fees",
        title: "Fees Invoice — blocked",
      })
      .expect(422)
      .expect((response) => {
        assert.equal(response.body.error.code, "MANUAL_START_DISABLED");
      });

    await app.close();
  });

  it("returns 409 when completing task out of sequence", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const task5Id = "workflow-gis-enrolment-t2-task-5";

    await request(app.getHttpServer())
      .post(`/api/v1/workflows/workflow-gis-enrolment-t2/tasks/${task5Id}/complete`)
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({ notes: "Should fail — prior step still open" })
      .expect(409)
      .expect((response) => {
        assert.equal(response.body.error.code, "SEQUENCE_VIOLATION");
      });

    await app.close();
  });

  it("completing task N-1 unlocks task N only", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const task3Id = "workflow-gis-enrolment-t2-task-3";
    const task4Id = "workflow-gis-enrolment-t2-task-4";

    await request(app.getHttpServer())
      .post(`/api/v1/workflows/workflow-gis-enrolment-t2/tasks/${task3Id}/approve`)
      .set("Authorization", "Bearer demo:user-gis-head")
      .send({ notes: "Safeguarding review approved" })
      .expect(201)
      .expect((response) => {
        assert.equal(response.body.data.status, "approved");
      });

    await request(app.getHttpServer())
      .get(`/api/v1/workflows/workflow-gis-enrolment-t2`)
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200)
      .expect((response) => {
        const tasks = response.body.data.tasks as Array<{ id: string; status: string }>;
        assert.equal(
          tasks.find((task) => task.id === task4Id)?.status,
          "in_progress",
        );
      });

    await app.close();
  });

  it("staff cannot complete compliance record tasks", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const task3Id = "workflow-gis-enrolment-t2-task-3";

    await request(app.getHttpServer())
      .post(`/api/v1/workflows/workflow-gis-enrolment-t2/tasks/${task3Id}/approve`)
      .set("Authorization", "Bearer demo:user-gis-staff")
      .send({ notes: "Staff should not approve compliance tasks" })
      .expect(403);

    await app.close();
  });

  it("only approval tasks accept approve/reject actions", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const task1Id = "workflow-gis-enrolment-t2-task-1";

    await request(app.getHttpServer())
      .post(`/api/v1/workflows/workflow-gis-enrolment-t2/tasks/${task1Id}/approve`)
      .set("Authorization", "Bearer demo:user-gis-head")
      .send({ notes: "Wrong type" })
      .expect(422)
      .expect((response) => {
        assert.equal(response.body.error.code, "INVALID_TASK_TYPE");
      });

    await app.close();
  });

  it("lists my tasks for assigned department head", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/workflows/my-tasks")
      .set("Authorization", "Bearer demo:user-gis-head")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.success, true);
        assert.ok(response.body.data.length >= 1);
        assert.ok(
          response.body.data.some(
            (item: { title?: string }) => item.title === "Safeguarding review",
          ),
        );
      });

    await app.close();
  });

  it("returns 403 for staff accessing my-tasks", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/workflows/my-tasks")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(403);

    await app.close();
  });

  it("returns workflow audit trail", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/workflows/workflow-gis-enrolment-t2/audit")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.success, true);
        assert.ok(response.body.data.length >= 1);
      });

    await app.close();
  });
});
