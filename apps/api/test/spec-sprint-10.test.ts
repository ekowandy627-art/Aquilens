import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import { resolveDemoUser } from "../src/auth/demo-users";

describe("Spec Sprint 10 — Audit extensions + guest auditor", () => {
  it("S10-AUD-01: guest auditor role resolves with audit read", async () => {
    const user = resolveDemoUser("demo:user-gis-guest-auditor");
    assert.ok(user.roles.includes("Guest Auditor"));
    assert.ok(user.permissions.includes("audit:read"));
  });

  it("S10-AUD-02: audit log includes incident and training event types", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/incidents")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({
        title: "Audit trail test",
        description: "Logged for audit coverage.",
        incidentType: "test",
        severity: "low",
      })
      .expect(201);

    const audit = await request(app.getHttpServer())
      .get("/api/v1/audit?eventType=incident.logged")
      .set("Authorization", "Bearer demo:user-gis-compliance")
      .expect(200);

    assert.ok(
      audit.body.data.items.some(
        (row: { eventType?: string }) => row.eventType === "incident.logged",
      ),
    );

    await app.close();
  });

  it("S10-AUD-03: guest access grants include jurisdiction scope", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer())
      .get("/api/v1/guest-access")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(200);

    assert.ok(
      response.body.data.some(
        (grant: { jurisdictionIds?: string[] }) =>
          Array.isArray(grant.jurisdictionIds) && grant.jurisdictionIds.length > 0,
      ),
    );

    await app.close();
  });
});
