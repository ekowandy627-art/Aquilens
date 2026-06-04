import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import {
  assertScopedPermission,
  hasPermissionGrant,
  resolveGrantScope,
} from "../src/auth/permission-scopes";
import type { AuthUser } from "../src/auth/auth.types";
import { resolveDemoUser } from "../src/auth/demo-users";
import { resolveProcessAccess } from "../src/processes/process-access";
import {
  resetProcessDemoStore,
  processDemoStore,
} from "../src/processes/process-demo.store";

describe("Spec Sprint 1 — foundation", () => {
  beforeEach(() => {
    resetProcessDemoStore();
  });

  it("S1-RBAC-01: function-scoped read limits process list for department head", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const head = resolveDemoUser("demo:user-gis-head");
    processDemoStore.createProcess(
      head.tenantId,
      "user-gis-owner",
      {
        functionId: "fn-school-academics",
        processAreaId: "area-school-academics-student-records",
        name: "Academics SOP",
      },
      { functionName: "Academics", areaName: "Student Records" },
    );
    processDemoStore.createProcess(
      head.tenantId,
      "user-gis-owner",
      {
        functionId: "fn-school-operations",
        processAreaId: "area-school-operations-facilities",
        name: "Operations SOP",
      },
      { functionName: "Operations", areaName: "Facilities" },
    );

    const response = await request(app.getHttpServer())
      .get("/api/v1/processes")
      .set("Authorization", "Bearer demo:user-gis-head")
      .expect(200);

    const names = response.body.data.map((row: { name: string }) => row.name);
    assert.ok(names.includes("Academics SOP"));
    assert.ok(!names.includes("Operations SOP"));

    await app.close();
  });

  it("S1-RBAC-02: scoped guard denies function-scoped create outside assignment", () => {
    const head = resolveDemoUser("demo:user-gis-head");
    assert.equal(resolveGrantScope(head, "processes", "read"), "function");
    assert.equal(
      assertScopedPermission(
        head,
        { resource: "processes", action: "create", scope: "function" },
        { functionId: "fn-school-finance" },
      ),
      false,
    );
  });

  it("S1-OWNER-01: new process owner defaults to creator", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const owner = resolveDemoUser("demo:user-gis-owner");
    const created = await request(app.getHttpServer())
      .post("/api/v1/processes")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({
        functionId: "fn-school-academics",
        processAreaId: "area-school-academics-student-records",
        name: "Creator-owned draft",
      })
      .expect(201);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/processes/${created.body.data.id}`)
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);

    const processOwner = detail.body.data.people.find(
      (person: { role: string }) => person.role === "owner",
    );
    assert.equal(processOwner?.userId, owner.id);

    await app.close();
  });

  it("S1-MFG-01: manufacturing demo tenant profile resolves", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/tenants/profile")
      .set("Authorization", "Bearer demo:user-mfg-owner")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.data.slug, "mfg");
        assert.ok(response.body.data.functions.length >= 5);
        assert.ok(response.body.data.operatingJurisdictions?.includes("ghana"));
      });

    await app.close();
  });

  it("S1-RBAC-03: own-scoped staff sees assigned or created processes only", () => {
    const staff = resolveDemoUser("demo:user-gis-staff");
    assert.equal(resolveGrantScope(staff, "processes", "read"), "own");
    const assigned = resolveProcessAccess(
      staff,
      [{ userId: staff.id, role: "viewer" }],
      "user-gis-owner",
      "fn-school-academics",
    );
    assert.equal(assigned.canView, true);
    const other = resolveProcessAccess(
      staff,
      [],
      "user-gis-owner",
      "fn-school-academics",
    );
    assert.equal(other.canView, false);
  });

  it("S1-RBAC-04: global permission grant still passes", () => {
    const admin = resolveDemoUser("demo:user-gis-admin") as AuthUser;
    assert.ok(hasPermissionGrant(admin, "processes", "read"));
    assert.equal(resolveGrantScope(admin, "processes", "read"), "global");
  });
});
