import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import { auditDemoStore } from "../src/audit/audit-demo.store";
import { resetGuidanceDemoStore, guidanceDemoStore } from "../src/standards/guidance-demo.store";

describe("standards API (Phase 14)", () => {
  beforeEach(() => {
    resetGuidanceDemoStore();
  });

  async function createApp() {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    return app;
  }

  async function packIdBySlug(
    app: Awaited<ReturnType<typeof createApp>>,
    slug: string,
  ) {
    const list = await request(app.getHttpServer())
      .get("/api/v1/guidance/packs")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(200);
    const pack = list.body.data.find(
      (row: { slug: string }) => row.slug === slug,
    );
    assert.ok(pack, `pack ${slug} missing`);
    return pack.id as string;
  }

  it("P14-A-01: list active packs", async () => {
    const app = await createApp();
    const response = await request(app.getHttpServer())
      .get("/api/v1/guidance/packs")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(200);

    assert.ok(response.body.data.length >= 6);
    for (const pack of response.body.data) {
      assert.ok(pack.slug);
      assert.ok(pack.name);
      assert.ok(pack.disclaimer);
    }
    await app.close();
  });

  it("P14-A-02: get school-operations pack with requirements", async () => {
    const app = await createApp();
    const response = await request(app.getHttpServer())
      .get("/api/v1/guidance/packs/school-operations")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(200);

    assert.ok(response.body.data.requirements.length >= 10);
    await app.close();
  });

  it("P14-A-03: unknown slug returns 404", async () => {
    const app = await createApp();
    await request(app.getHttpServer())
      .get("/api/v1/guidance/packs/nonexistent")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(404);
    await app.close();
  });

  it("P14-A-04: school recommendations include school-operations", async () => {
    const app = await createApp();
    const response = await request(app.getHttpServer())
      .get("/api/v1/guidance/recommendations")
      .query({ organisationType: "school", country: "Ghana" })
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(200);

    assert.ok(
      response.body.data.some(
        (row: { slug: string }) => row.slug === "school-operations",
      ),
    );
    await app.close();
  });

  it("P14-A-05: healthcare recommendations exclude school-only pack", async () => {
    const app = await createApp();
    const response = await request(app.getHttpServer())
      .get("/api/v1/guidance/recommendations")
      .query({ organisationType: "healthcare" })
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(200);

    assert.ok(
      response.body.data.some(
        (row: { slug: string }) => row.slug === "health-and-care",
      ),
    );
    assert.equal(
      response.body.data.some(
        (row: { slug: string }) => row.slug === "school-operations",
      ),
      false,
    );
    await app.close();
  });

  it("P14-A-06: empty selections for fresh tenant", async () => {
    const app = await createApp();
    const response = await request(app.getHttpServer())
      .get("/api/v1/tenants/me/guidance-selections")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(200);
    assert.equal(response.body.data.length, 0);
    await app.close();
  });

  it("P14-A-07: upsert three selections", async () => {
    const app = await createApp();
    const packIds = await Promise.all([
      packIdBySlug(app, "universal-sop-control"),
      packIdBySlug(app, "school-operations"),
      packIdBySlug(app, "iso-45001-hse"),
    ]);

    await request(app.getHttpServer())
      .put("/api/v1/tenants/me/guidance-selections")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .send({
        selections: [
          { packId: packIds[0], selectionStatus: "align" },
          { packId: packIds[1], selectionStatus: "working_towards" },
          { packId: packIds[2], selectionStatus: "deferred" },
        ],
      })
      .expect(200);

    const listed = await request(app.getHttpServer())
      .get("/api/v1/tenants/me/guidance-selections")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(200);

    assert.equal(listed.body.data.length, 3);
    await app.close();
  });

  it("P14-A-08: invalid selection status returns 422", async () => {
    const app = await createApp();
    const packId = await packIdBySlug(app, "universal-sop-control");
    await request(app.getHttpServer())
      .put("/api/v1/tenants/me/guidance-selections")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .send({
        selections: [{ packId, selectionStatus: "invalid" }],
      })
      .expect(422);
    await app.close();
  });

  it("P14-A-09: upsert replaces same pack", async () => {
    const app = await createApp();
    const packId = await packIdBySlug(app, "iso-9001-quality");

    await request(app.getHttpServer())
      .put("/api/v1/tenants/me/guidance-selections")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .send({ selections: [{ packId, selectionStatus: "align" }] })
      .expect(200);

    await request(app.getHttpServer())
      .put("/api/v1/tenants/me/guidance-selections")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .send({ selections: [{ packId, selectionStatus: "deferred" }] })
      .expect(200);

    const listed = await request(app.getHttpServer())
      .get("/api/v1/tenants/me/guidance-selections")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(200);

    assert.equal(listed.body.data.length, 1);
    assert.equal(listed.body.data[0].selectionStatus, "deferred");
    await app.close();
  });

  it("P14-A-10: tenant isolation on GET selections", async () => {
    const app = await createApp();
    const packId = await packIdBySlug(app, "universal-sop-control");

    await request(app.getHttpServer())
      .put("/api/v1/tenants/me/guidance-selections")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .send({ selections: [{ packId, selectionStatus: "align" }] })
      .expect(200);

    const hospital = await request(app.getHttpServer())
      .get("/api/v1/tenants/me/guidance-selections")
      .set("Authorization", "Bearer demo:user-hospital-admin")
      .expect(200);

    assert.equal(hospital.body.data.length, 0);
    await app.close();
  });

  it("P14-A-11: unknown pack id returns 422", async () => {
    const app = await createApp();
    await request(app.getHttpServer())
      .put("/api/v1/tenants/me/guidance-selections")
      .set("Authorization", "Bearer demo:user-hospital-admin")
      .send({
        selections: [
          { packId: "pack-does-not-exist", selectionStatus: "align" },
        ],
      })
      .expect(422);
    await app.close();
  });

  it("P14-A-12: link pack to function", async () => {
    const app = await createApp();
    const packId = await packIdBySlug(app, "school-operations");

    await request(app.getHttpServer())
      .put("/api/v1/functions/fn-school-academics/guidance")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .send({ packIds: [packId] })
      .expect(200);

    const linked = await request(app.getHttpServer())
      .get("/api/v1/functions/fn-school-academics/guidance")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(200);

    assert.equal(linked.body.data.length, 1);
    assert.equal(linked.body.data[0].packSlug, "school-operations");
    await app.close();
  });

  it("P14-A-13: link pack to process", async () => {
    const app = await createApp();
    const packId = await packIdBySlug(app, "school-operations");

    await request(app.getHttpServer())
      .put("/api/v1/processes/proc-gis-fees/guidance")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({ links: [{ packId }] })
      .expect(200);

    const detail = await request(app.getHttpServer())
      .get("/api/v1/processes/proc-gis-fees")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);

    assert.equal(detail.body.data.linkedGuidance.length, 1);
    await app.close();
  });

  it("P14-A-14: cross-tenant process guidance returns 404", async () => {
    const app = await createApp();
    const packId = await packIdBySlug(app, "universal-sop-control");

    await request(app.getHttpServer())
      .put("/api/v1/processes/proc-gis-fees/guidance")
      .set("Authorization", "Bearer demo:user-hospital-admin")
      .send({ links: [{ packId }] })
      .expect(404);
    await app.close();
  });

  it("P14-A-15: update organisation profile", async () => {
    const app = await createApp();
    await request(app.getHttpServer())
      .put("/api/v1/tenants/me/organisation-profile")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .send({
        organisationType: "school",
        countries: ["Ghana"],
        certificationTargets: ["ISO 9001"],
      })
      .expect(200);

    const profile = await request(app.getHttpServer())
      .get("/api/v1/tenants/me/organisation-profile")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(200);

    assert.equal(profile.body.data.organisationType, "school");
    assert.deepEqual(profile.body.data.countries, ["Ghana"]);
    await app.close();
  });

  it("P14-A-16: audit event on selection change", async () => {
    const app = await createApp();
    const packId = await packIdBySlug(app, "universal-sop-control");

    await request(app.getHttpServer())
      .put("/api/v1/tenants/me/guidance-selections")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .send({ selections: [{ packId, selectionStatus: "align" }] })
      .expect(200);

    const { items: events } = auditDemoStore.list("tenant-gis", { limit: 20 });
    assert.ok(
      events.some((event) => event.eventType === "standard.selected"),
    );
    await app.close();
  });

  it("P14-A-17: pack requirements include audit_checks", async () => {
    const app = await createApp();
    const response = await request(app.getHttpServer())
      .get("/api/v1/guidance/packs/universal-sop-control")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(200);

    for (const requirement of response.body.data.requirements) {
      assert.ok(requirement.auditChecks.length > 0);
    }
    await app.close();
  });

  it("P14-A-18: inactive pack hidden unless selected", async () => {
    const app = await createApp();
    const packId = await packIdBySlug(app, "iso-45001-hse");
    guidanceDemoStore.setPackActive(packId, false);

    const beforeSelect = await request(app.getHttpServer())
      .get("/api/v1/guidance/packs")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(200);

    assert.equal(
      beforeSelect.body.data.some((row: { id: string }) => row.id === packId),
      false,
    );

    await request(app.getHttpServer())
      .put("/api/v1/tenants/me/guidance-selections")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .send({ selections: [{ packId, selectionStatus: "deferred" }] })
      .expect(200);

    const afterSelect = await request(app.getHttpServer())
      .get("/api/v1/guidance/packs")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(200);

    assert.ok(
      afterSelect.body.data.some((row: { id: string }) => row.id === packId),
    );
    await app.close();
  });
});
