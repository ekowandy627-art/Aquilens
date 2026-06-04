import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import {
  isEvidenceMapComplete,
  normalizeEvidenceMap,
} from "@aquilens/shared";
import { syncStepControlFields } from "../src/processes/control-points";
import {
  resetProcessDemoStore,
  processDemoStore,
} from "../src/processes/process-demo.store";

describe("Spec Sprint 2 — control points + flow", () => {
  beforeEach(() => {
    resetProcessDemoStore();
  });

  it("S2-CP-01: legacy evidence_required syncs to control point with gap flag", () => {
    const synced = syncStepControlFields({ evidenceRequired: true });
    assert.equal(synced.isControlPoint, true);
    assert.equal(synced.evidenceMap.mode, "acknowledgement");
    assert.equal(synced.evidenceMap.needsCompletion, true);
    assert.equal(synced.evidenceMapComplete, false);
  });

  it("S2-CP-02: external_system evidence map completeness", () => {
    const incomplete = normalizeEvidenceMap({
      mode: "external_system",
    });
    assert.equal(isEvidenceMapComplete(incomplete), false);

    const complete = normalizeEvidenceMap({
      mode: "external_system",
      systemName: "SIMS",
    });
    assert.equal(isEvidenceMapComplete(complete), true);
  });

  it("S2-CP-03: PATCH step sets control point and evidence map", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const owner = "demo:user-gis-owner";
    const created = await request(app.getHttpServer())
      .post("/api/v1/processes")
      .set("Authorization", `Bearer ${owner}`)
      .send({
        functionId: "fn-school-academics",
        processAreaId: "area-school-academics-student-records",
        name: "Control point test SOP",
      })
      .expect(201);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/processes/${created.body.data.id}`)
      .set("Authorization", `Bearer ${owner}`)
      .expect(200);

    const versionId = detail.body.data.currentVersion.id;
    const step = await request(app.getHttpServer())
      .post(
        `/api/v1/processes/${created.body.data.id}/versions/${versionId}/steps`,
      )
      .set("Authorization", `Bearer ${owner}`)
      .send({
        title: "Verify records",
        stepNumber: 1,
        isControlPoint: true,
        evidenceMap: {
          mode: "physical",
          locationDescription: "Records office cabinet A",
        },
      })
      .expect(201);

    assert.equal(step.body.data.isControlPoint, true);
    assert.equal(step.body.data.evidenceMap.mode, "physical");
    assert.equal(step.body.data.evidenceMapComplete, true);

    await app.close();
  });

  it("S2-JUR-01: process jurisdiction override PATCH", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const owner = "demo:user-gis-owner";
    const created = await request(app.getHttpServer())
      .post("/api/v1/processes")
      .set("Authorization", `Bearer ${owner}`)
      .send({
        functionId: "fn-school-academics",
        processAreaId: "area-school-academics-student-records",
        name: "Jurisdiction override SOP",
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/processes/${created.body.data.id}`)
      .set("Authorization", `Bearer ${owner}`)
      .send({
        jurisdictionsInheritOrg: false,
        operatingJurisdictions: ["uk"],
        outputMarketJurisdictions: ["eu"],
      })
      .expect(200);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/processes/${created.body.data.id}`)
      .set("Authorization", `Bearer ${owner}`)
      .expect(200);

    assert.equal(detail.body.data.jurisdictionsInheritOrg, false);
    assert.deepEqual(detail.body.data.operatingJurisdictions, ["uk"]);
    assert.deepEqual(detail.body.data.outputMarketJurisdictions, ["eu"]);

    await app.close();
  });

  it("S2-FLOW-01: seeded HR process returns lifecycle spine and control steps", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer())
      .get("/api/v1/processes/proc-gis-hr-recruitment")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);

    const spine = response.body.data.lifecycle?.spine;
    assert.ok(Array.isArray(spine));
    assert.ok(spine.length >= 5);
    assert.ok(spine.some((stage: { id: string }) => stage.id === "draft"));

    const controlStep = response.body.data.steps.find(
      (step: { title: string; isControlPoint: boolean }) =>
        step.title === "Complete safeguarding checks",
    );
    assert.ok(controlStep);
    assert.equal(controlStep.isControlPoint, true);
    assert.equal(controlStep.evidenceMap.mode, "acknowledgement");

    await app.close();
  });

  it("S2-CP-04: demo store addStep syncs control fields", () => {
    const owner = "demo:user-gis-owner";
    const created = processDemoStore.createProcess(
      "tenant-gis",
      owner,
      {
        functionId: "fn-school-academics",
        processAreaId: "area-school-academics-student-records",
        name: "Demo sync",
      },
      { functionName: "Academics", areaName: "Records" },
    );
    const versionId = created.currentVersionId;
    const step = processDemoStore.addStep("tenant-gis", versionId, {
      stepNumber: 1,
      title: "Check",
      evidenceRequired: true,
    });
    assert.equal(step.isControlPoint, true);
    assert.equal(step.evidenceMap.needsCompletion, true);
  });
});
