import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import {
  resetGuidanceDemoStore,
} from "../src/standards/guidance-demo.store";
import { resetGuidanceVersionMeta } from "../src/internal/internal-guidance.service";
import {
  resetPlatformAuditDemoStore,
} from "../src/internal/platform-audit-demo.store";
import {
  resetPlatformSupportDemoStore,
} from "../src/internal/platform-support-demo.store";
import {
  resetTenantPlatformConfigDemoStore,
} from "../src/platform-ops/tenant-platform-config-demo.store";

const INTERNAL_SECRET = "test-manager-platform-secret";

describe("M3 internal control plane routes", () => {
  beforeEach(() => {
    process.env.MANAGER_PLATFORM_SECRET = INTERNAL_SECRET;
    resetGuidanceDemoStore();
    resetGuidanceVersionMeta();
    resetPlatformAuditDemoStore();
    resetPlatformSupportDemoStore();
    resetTenantPlatformConfigDemoStore();
  });

  it("returns metrics overview and platform agents", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const overview = await request(app.getHttpServer())
      .get("/api/internal/metrics/overview")
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .expect(200);
    assert.equal(overview.body.success, true);
    assert.ok(typeof overview.body.data.mtdPlatformCostUsd === "number");

    const agents = await request(app.getHttpServer())
      .get("/api/internal/platform-agents")
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .expect(200);
    assert.ok(Array.isArray(agents.body.data.items));
    assert.ok(agents.body.data.items.length >= 1);

    await app.close();
  });

  it("patches platform config and issues support access", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .patch("/api/internal/tenants/tenant-gis/platform-config")
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .send({ aiMonthlyBudgetUsd: 250, planLabel: "Enterprise trial" })
      .expect(200)
      .expect((res) => {
        assert.equal(res.body.data.aiMonthlyBudgetUsd, 250);
      });

    const support = await request(app.getHttpServer())
      .post("/api/internal/tenants/tenant-gis/support-access")
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .send({ reason: "Customer reported compose issue" })
      .expect(201);
    assert.ok(support.body.data.magicLink);
    assert.ok(support.body.data.expiresAt);

    await app.close();
  });

  it("creates guidance pack, new version, and publishes", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const created = await request(app.getHttpServer())
      .post("/api/internal/guidance-packs")
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .send({
        slug: "test-pack",
        name: "Test Pack",
        packType: "standard",
        requirements: [{ requirementArea: "Ownership", summary: "Must have owner" }],
      })
      .expect(201);

    const packId = created.body.data.id as string;
    assert.equal(created.body.data.status, "draft");

    const published = await request(app.getHttpServer())
      .post(`/api/internal/guidance-packs/${packId}/publish`)
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .send({ changelog: "Initial publish" })
      .expect(201);
    assert.equal(published.body.data.status, "published");

    const v2 = await request(app.getHttpServer())
      .post(`/api/internal/guidance-packs/${packId}/new-version`)
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .expect(201);
    assert.ok(v2.body.data.version >= 2);

    await app.close();
  });

  it("runs standards-watch cron and lists platform audit", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const watch = await request(app.getHttpServer())
      .post("/api/internal/cron/standards-watch")
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .expect(201);
    assert.ok(typeof watch.body.data.tenantsChecked === "number");

    const audit = await request(app.getHttpServer())
      .get("/api/internal/platform-audit")
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .expect(200);
    assert.ok(Array.isArray(audit.body.data.items));

    await app.close();
  });
});
