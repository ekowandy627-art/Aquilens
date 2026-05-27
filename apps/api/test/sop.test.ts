import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import { sopRateLimiter } from "../src/sop/sop-rate-limit";
import { mergeGaps, normalizeGeneratedDraft } from "../src/sop/sop.types";

describe("sop generation API", () => {
  it("returns structured draft from mock generator", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/sop/generate")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({
        description:
          "When a safeguarding concern is raised, staff must log it, notify the safeguarding lead, and record follow-up actions.",
        functionId: "fn-school-academics",
        processAreaId: "area-school-academics-student-records",
      })
      .expect(201)
      .expect((response) => {
        assert.equal(response.body.success, true);
        assert.ok(response.body.data.draft.name);
        assert.ok(Array.isArray(response.body.data.gaps));
        assert.ok(response.body.data.gaps.length >= 2);
      });

    await app.close();
  });

  it("validates function and area before generating", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/sop/generate")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({ description: "Missing selectors" })
      .expect(422);

    await app.close();
  });

  it("enforces rate limit after 10 requests", async () => {
    sopRateLimiter.reset("user-gis-owner");

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const body = {
      description: "Daily attendance process for teachers.",
      functionId: "fn-school-academics",
      processAreaId: "area-school-academics-student-records",
    };

    for (let index = 0; index < 10; index += 1) {
      await request(app.getHttpServer())
        .post("/api/v1/sop/generate")
        .set("Authorization", "Bearer demo:user-gis-owner")
        .send(body)
        .expect(201);
    }

    await request(app.getHttpServer())
      .post("/api/v1/sop/generate")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send(body)
      .expect(429)
      .expect((response) => {
        assert.equal(response.body.error.code, "RATE_LIMITED");
      });

    sopRateLimiter.reset("user-gis-owner");
    await app.close();
  });
});

describe("sop generation helpers", () => {
  it("normalizes invalid model output safely", () => {
    const draft = normalizeGeneratedDraft({
      name: "Test",
      steps: [{ title: "One" }],
      gaps: [{ field: "owner", severity: "required", message: "Assign owner" }],
    });

    assert.equal(draft.steps.length, 1);
    assert.equal(draft.steps[0]?.step_number, 1);
    assert.equal(draft.risk_rating, "medium");
  });

  it("adds recommended gaps for missing controls and outputs", () => {
    const gaps = mergeGaps(
      normalizeGeneratedDraft({
        name: "Test",
        governance_controls: [],
        steps: [{ step_number: 1, title: "Step", outputs: "" }],
        gaps: [],
      }),
    );

    assert.ok(gaps.some((gap) => gap.field === "governance_controls"));
    assert.ok(gaps.some((gap) => gap.field.includes("outputs")));
  });
});
