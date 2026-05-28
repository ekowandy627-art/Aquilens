import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppModule } from "../src/app.module";

describe("auth guards", () => {
  it("rejects protected routes without a bearer token", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/tenants/me")
      .expect(401)
      .expect((response) => {
        assert.equal(response.body.error.code, "UNAUTHORIZED");
      });

    await app.close();
  });

  it("returns the current tenant with a bearer token", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/tenants/me")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.success, true);
        assert.equal(response.body.data.slug, "gis");
      });

    await app.close();
  });
});
