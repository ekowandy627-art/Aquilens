import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppModule } from "../src/app.module";

describe("health", () => {
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
