import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import { resetRecurringControlsDemoStore } from "../src/recurring-controls/recurring-controls-demo.store";

describe("Spec Sprint 9 — Recurring controls", () => {
  beforeEach(() => {
    resetRecurringControlsDemoStore();
  });

  it("S9-RC-01: lists recurring control register", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer())
      .get("/api/v1/recurring-controls")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);

    assert.ok(response.body.data.length >= 1);

    await app.close();
  });

  it("S9-RC-02: verification status transitions", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const updated = await request(app.getHttpServer())
      .patch("/api/v1/recurring-controls/rc-gis-attendance-log/verification")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({ status: "verified" })
      .expect(200);

    assert.equal(updated.body.data.verificationStatus, "verified");

    await app.close();
  });
});
