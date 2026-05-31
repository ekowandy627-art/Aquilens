import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import { resetGuidanceDemoStore } from "../src/standards/guidance-demo.store";

const INTERNAL_SECRET = "test-manager-platform-secret";

describe("internal manager API", () => {
  beforeEach(() => {
    process.env.MANAGER_PLATFORM_SECRET = INTERNAL_SECRET;
    resetGuidanceDemoStore();
  });

  it("rejects internal routes without bearer secret", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/internal/tenant-lookup?slug=gis")
      .expect(401);

    await app.close();
  });

  it("returns demo tenant lookup for gis slug", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/internal/tenant-lookup?slug=gis")
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.success, true);
        assert.equal(response.body.data.slug, "gis");
        assert.equal(response.body.data.status, "active");
      });

    await app.close();
  });

  it("lists guidance packs and toggles active flag", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const listResponse = await request(app.getHttpServer())
      .get("/api/internal/guidance-packs")
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .expect(200);

    const pack = listResponse.body.data.items[0];
    assert.ok(pack?.id);

    await request(app.getHttpServer())
      .patch(`/api/internal/guidance-packs/${pack.id}`)
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .send({ isActive: false })
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.data.isActive, false);
      });

    await app.close();
  });
});
