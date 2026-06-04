import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";

const INTERNAL_SECRET = "test-manager-platform-secret";

describe("Spec Sprint 8 — Readiness score", () => {
  beforeEach(() => {
    process.env.MANAGER_PLATFORM_SECRET = INTERNAL_SECRET;
  });
  it("S8-RDY-01: dashboard includes readiness breakdown", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer())
      .get("/api/v1/dashboard")
      .set("Authorization", "Bearer demo:user-gis-compliance")
      .expect(200);

    assert.ok(response.body.data.readiness);
    assert.ok(typeof response.body.data.readiness.score === "number");
    assert.ok(response.body.data.readiness.components);

    await app.close();
  });

  it("S8-RDY-02: readiness cron sends notification", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer())
      .post("/api/internal/cron/readiness-notifications")
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .expect(201);

    assert.equal(response.body.data.notificationsSent, 1);
    assert.ok(response.body.data.readiness.score >= 0);

    await app.close();
  });
});
