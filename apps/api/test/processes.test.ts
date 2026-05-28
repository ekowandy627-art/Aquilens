import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import { resetProcessDemoStore } from "../src/processes/process-demo.store";

describe("processes API", () => {
  beforeEach(() => {
    resetProcessDemoStore();
  });
  it("rejects list without a bearer token", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/processes")
      .expect(401)
      .expect((response) => {
        assert.equal(response.body.error.code, "UNAUTHORIZED");
      });

    await app.close();
  });

  it("returns seeded processes for gis owner demo token", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/processes")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.success, true);
        assert.ok(response.body.data.length >= 3);
        assert.ok(
          response.body.data.some(
            (process: { processCode?: string }) =>
              process.processCode === "ACAD-STUD-001",
          ),
        );
      });

    await app.close();
  });

  it("returns process detail with steps", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/processes/proc-gis-attendance")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.data.name, "Record Student Attendance");
        assert.equal(response.body.data.steps.length, 3);
      });

    await app.close();
  });

  it("rejects create for staff demo token", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/processes")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .send({
        functionId: "fn-school-academics",
        processAreaId: "area-school-academics-student-records",
        name: "Staff should not create",
      })
      .expect(403)
      .expect((response) => {
        assert.equal(response.body.error.code, "FORBIDDEN");
      });

    await app.close();
  });

  it("staff list only includes assigned processes", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/processes")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.data.length, 1);
        assert.equal(response.body.data[0].name, "Record Student Attendance");
      });

    await app.close();
  });

  it("staff cannot edit assigned process", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .patch("/api/v1/processes/proc-gis-attendance")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .send({ name: "Should fail" })
      .expect(403);

    await app.close();
  });

  it("owner can assign editors and viewers", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const detail = await request(app.getHttpServer())
      .get("/api/v1/processes/proc-gis-attendance")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);

    const versionId = detail.body.data.currentVersion.id;

    await request(app.getHttpServer())
      .put(`/api/v1/processes/proc-gis-attendance/versions/${versionId}/people`)
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({
        people: [
          { userId: "user-gis-owner", role: "owner" },
          { userId: "user-gis-staff", role: "viewer" },
          { userId: "user-gis-head", role: "editor" },
        ],
      })
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.data.length, 3);
      });

    await app.close();
  });

  it("staff cannot assign process people", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const detail = await request(app.getHttpServer())
      .get("/api/v1/processes/proc-gis-attendance")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(200);

    const versionId = detail.body.data.currentVersion.id;

    await request(app.getHttpServer())
      .put(`/api/v1/processes/proc-gis-attendance/versions/${versionId}/people`)
      .set("Authorization", "Bearer demo:user-gis-staff")
      .send({
        people: [{ userId: "user-gis-staff", role: "owner" }],
      })
      .expect(403);

    await app.close();
  });

  it("persists execution schedule separately from review frequency", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .patch("/api/v1/processes/proc-gis-fees")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({
        reviewFrequency: "quarterly",
        executionSchedule: { kind: "weekly", anchor: "monday" },
      })
      .expect(200);

    await request(app.getHttpServer())
      .get("/api/v1/processes/proc-gis-fees")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.data.reviewFrequency, "quarterly");
        assert.equal(response.body.data.executionSchedule.kind, "weekly");
        assert.equal(response.body.data.executionSchedule.anchor, "monday");
      });

    await app.close();
  });

  it("reorders steps with correct step numbers", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const detail = await request(app.getHttpServer())
      .get("/api/v1/processes/proc-gis-fees")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);

    const versionId = detail.body.data.currentVersion.id;
    const orderedIds = [
      detail.body.data.steps[3].id,
      detail.body.data.steps[0].id,
      detail.body.data.steps[1].id,
      detail.body.data.steps[2].id,
    ];

    await request(app.getHttpServer())
      .post(`/api/v1/processes/proc-gis-fees/versions/${versionId}/steps/reorder`)
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({ orderedIds })
      .expect(201)
      .expect((response) => {
        assert.deepEqual(
          response.body.data.map((step: { stepNumber: number }) => step.stepNumber),
          [1, 2, 3, 4],
        );
        assert.equal(response.body.data[0].title, "Reconcile payment with invoice");
      });

    await app.close();
  });
});
