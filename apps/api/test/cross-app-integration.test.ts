import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import { resetTenantPlatformConfigDemoStore } from "../src/platform-ops/tenant-platform-config-demo.store";

const INTERNAL_SECRET = "test-manager-platform-secret";

describe("cross-app manager ↔ API integration", () => {
  beforeEach(() => {
    process.env.MANAGER_PLATFORM_SECRET = INTERNAL_SECRET;
    resetTenantPlatformConfigDemoStore();
  });

  it("manager secret can list tenants, metrics, and patch config", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const tenants = await request(app.getHttpServer())
      .get("/api/internal/tenants")
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .expect(200);
    assert.ok(tenants.body.data.items.length >= 1);

    const overview = await request(app.getHttpServer())
      .get("/api/internal/metrics/overview")
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .expect(200);
    assert.ok(overview.body.data);

    const tenantId = tenants.body.data.items[0].tenantId as string;
    await request(app.getHttpServer())
      .patch(`/api/internal/tenants/${tenantId}/platform-config`)
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .send({ planLabel: "Cross-app test" })
      .expect(200);

    await app.close();
  });
});
