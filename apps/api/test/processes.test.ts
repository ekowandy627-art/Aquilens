import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppModule } from "../src/app.module";

describe("processes API", () => {
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

  it("returns process list for demo bearer token", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/processes")
      .set("Authorization", "Bearer demo")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.success, true);
        assert.ok(Array.isArray(response.body.data));
      });

    await app.close();
  });
});
