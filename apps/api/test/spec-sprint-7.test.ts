import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";

const INTERNAL_SECRET = "test-manager-platform-secret";

describe("Spec Sprint 7 — Attestation due trigger", () => {
  beforeEach(() => {
    process.env.MANAGER_PLATFORM_SECRET = INTERNAL_SECRET;
  });

  it("S7-ATT-01: cron triggers attestation due workflows", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer())
      .post("/api/internal/cron/attestation-due")
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .expect(201);

    assert.ok(response.body.data.triggered >= 0);

    await app.close();
  });
});
