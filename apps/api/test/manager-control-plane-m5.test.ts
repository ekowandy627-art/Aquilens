import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import { resetGuidanceDemoStore } from "../src/standards/guidance-demo.store";
import { resetGuidanceVersionMeta } from "../src/internal/internal-guidance.service";
import { resetStandardsGapDemoStore } from "../src/standards/standards-gap-demo.store";
import {
  resetTenantPlatformConfigDemoStore,
} from "../src/platform-ops/tenant-platform-config-demo.store";

const INTERNAL_SECRET = "test-manager-platform-secret";
const DEMO_OWNER = "demo:user-gis-owner";
const DEMO_ADMIN = "demo:user-gis-admin";

describe("M5 standards updates + gap analysis", () => {
  beforeEach(() => {
    process.env.MANAGER_PLATFORM_SECRET = INTERNAL_SECRET;
    resetGuidanceDemoStore();
    resetGuidanceVersionMeta();
    resetStandardsGapDemoStore();
    resetTenantPlatformConfigDemoStore();
  });

  it("lists updates and runs gap analysis when a newer version is published", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .patch("/api/internal/tenants/tenant-gis/platform-config")
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .send({ aiMonthlyBudgetUsd: 500 })
      .expect(200);

    const created = await request(app.getHttpServer())
      .post("/api/internal/guidance-packs")
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .send({
        slug: "gap-test-pack",
        name: "Gap Test Pack",
        packType: "standard",
        requirements: [{ requirementArea: "Ownership", summary: "Must have owner" }],
      })
      .expect(201);

    const packId = created.body.data.id as string;

    await request(app.getHttpServer())
      .post(`/api/internal/guidance-packs/${packId}/publish`)
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .send({ changelog: "Initial publish" })
      .expect(201);

    await request(app.getHttpServer())
      .put("/api/v1/tenants/me/guidance-selections")
      .set("Authorization", `Bearer ${DEMO_OWNER}`)
      .send({ selections: [{ packId, selectionStatus: "relevant" }] })
      .expect(200);

    const v2 = await request(app.getHttpServer())
      .post(`/api/internal/guidance-packs/${packId}/new-version`)
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/internal/guidance-packs/${v2.body.data.id}/publish`)
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .send({ changelog: "Added retention controls" })
      .expect(201);

    const updates = await request(app.getHttpServer())
      .get("/api/v1/standards/updates")
      .set("Authorization", `Bearer ${DEMO_OWNER}`)
      .expect(200);

    assert.ok(updates.body.data.length >= 1);
    const familyId = updates.body.data[0].familyId as string;

    const analysis = await request(app.getHttpServer())
      .post(`/api/v1/standards/updates/${familyId}/gap-analysis`)
      .set("Authorization", `Bearer ${DEMO_OWNER}`)
      .expect(201);

    assert.equal(analysis.body.data.status, "complete");
    assert.ok(analysis.body.data.results.diff);

    const fetched = await request(app.getHttpServer())
      .get(`/api/v1/standards/gap-analyses/${analysis.body.data.id}`)
      .set("Authorization", `Bearer ${DEMO_OWNER}`)
      .expect(200);

    assert.equal(fetched.body.data.id, analysis.body.data.id);

    await app.close();
  });

  it("returns tenant AI usage for settings editors", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .patch("/api/internal/tenants/tenant-gis/platform-config")
      .set("Authorization", `Bearer ${INTERNAL_SECRET}`)
      .send({ aiMonthlyBudgetUsd: 100 })
      .expect(200);

    const usage = await request(app.getHttpServer())
      .get("/api/v1/tenant/ai-usage")
      .set("Authorization", `Bearer ${DEMO_ADMIN}`)
      .expect(200);

    assert.equal(typeof usage.body.data.mtdCostUsd, "number");
    assert.equal(usage.body.data.budgetUsd, 100);

    await app.close();
  });
});
