import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import { resetProcessDemoStore } from "../src/processes/process-demo.store";

describe("process publish API (Phase 13)", () => {
  beforeEach(() => {
    resetProcessDemoStore();
  });

  it("P13-A-01: publish happy path after approval", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-hr-recruitment/approve")
      .set("Authorization", "Bearer demo:user-gis-head")
      .send({ comment: "Approved for publish test" })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-hr-recruitment/publish")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({ effectiveDate: "2026-06-01", reviewDueDate: "2027-06-01" })
      .expect(201);

    assert.equal(response.body.data.status, "active");
    assert.equal(response.body.data.effectiveDate, "2026-06-01");

    const detail = await request(app.getHttpServer())
      .get("/api/v1/processes/proc-gis-hr-recruitment")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);

    assert.equal(detail.body.data.status, "active");
    assert.equal(detail.body.data.currentVersion.status, "active");
    assert.equal(detail.body.data.currentVersion.effectiveDate, "2026-06-01");

    await app.close();
  });

  it("P13-A-02: publish requires auth", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-hr-recruitment/publish")
      .send({ effectiveDate: "2026-06-01" })
      .expect(401);

    await app.close();
  });

  it("P13-A-03: publish forbidden for staff", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-hr-recruitment/publish")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .send({ effectiveDate: "2026-06-01" })
      .expect(403);

    await app.close();
  });

  it("P13-A-04: publish draft version fails", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-fees/publish")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({ effectiveDate: "2026-06-01" })
      .expect(422)
      .expect((response) => {
        assert.equal(response.body.error.code, "INVALID_STATE");
      });

    await app.close();
  });

  it("P13-A-06: publish requires effective date", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-hr-recruitment/approve")
      .set("Authorization", "Bearer demo:user-gis-head")
      .send({ comment: "ok" })
      .expect(201);

    await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-hr-recruitment/publish")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({})
      .expect(422)
      .expect((response) => {
        assert.equal(response.body.error.code, "VALIDATION_ERROR");
      });

    await app.close();
  });

  it("P13-A-07: PATCH extended SOP control fields", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .patch("/api/v1/processes/proc-gis-fees")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({
        triggerDescription: "Fee invoice received",
        participants: [{ role: "Bursar" }],
        exceptions: "Scholarship waivers",
        acknowledgementRequired: true,
      })
      .expect(200);

    const detail = await request(app.getHttpServer())
      .get("/api/v1/processes/proc-gis-fees")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);

    assert.equal(detail.body.data.triggerDescription, "Fee invoice received");
    assert.equal(detail.body.data.acknowledgementRequired, true);

    await app.close();
  });
});
