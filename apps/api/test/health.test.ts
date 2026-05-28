import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppModule } from "../src/app.module";

describe("health", () => {
  it("returns api info at root", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.status, "ok");
        assert.equal(response.body.api, "/api/v1");
      });

    await app.close();
  });

  it("returns ok", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/health")
      .expect(200)
      .expect((response) => {
        assert.deepEqual(response.body, { status: "ok" });
      });

    await app.close();
  });
});
