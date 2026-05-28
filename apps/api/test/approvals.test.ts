import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import { resetProcessDemoStore } from "../src/processes/process-demo.store";

describe("approvals API", () => {
  beforeEach(() => {
    resetProcessDemoStore();
  });
  it("lists pending approvals for gis-head", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/approvals")
      .set("Authorization", "Bearer demo:user-gis-head")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.success, true);
        assert.ok(response.body.data.length >= 1);
        assert.ok(
          response.body.data.some(
            (item: { processName?: string }) =>
              item.processName === "Recruit New Teacher",
          ),
        );
      });

    await app.close();
  });

  it("submits draft process for approval", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-fees/submit")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(201)
      .expect((response) => {
        assert.equal(response.body.data.status, "under_review");
      });

    await request(app.getHttpServer())
      .get("/api/v1/processes/proc-gis-fees")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.data.status, "under_review");
      });

    await app.close();
  });

  it("approves under_review process", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-hr-recruitment/approve")
      .set("Authorization", "Bearer demo:user-gis-head")
      .send({ comment: "Looks good" })
      .expect(201)
      .expect((response) => {
        assert.equal(response.body.data.status, "active");
      });

    await app.close();
  });

  it("rejects without comment returns 422", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-fees/submit")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(201);

    await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-fees/reject")
      .set("Authorization", "Bearer demo:user-gis-head")
      .send({ comment: "" })
      .expect(422)
      .expect((response) => {
        assert.equal(response.body.error.code, "COMMENT_REQUIRED");
      });

    await app.close();
  });

  it("staff cannot approve", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-hr-recruitment/approve")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .send({ comment: "nope" })
      .expect(403);

    await app.close();
  });

  it("creates new draft version from active process", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-enrolment/versions")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(201)
      .expect((response) => {
        assert.equal(response.body.data.versionNumber, 4);
        assert.equal(response.body.data.status, "draft");
      });

    await request(app.getHttpServer())
      .get("/api/v1/processes/proc-gis-enrolment/versions")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200)
      .expect((response) => {
        assert.ok(response.body.data.length >= 3);
      });

    await app.close();
  });
});
