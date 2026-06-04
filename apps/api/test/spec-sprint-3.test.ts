import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import { sopRateLimiter } from "../src/sop/sop-rate-limit";
import { resetSopResolutionsStore } from "../src/sop/sop-resolutions.store";

describe("Spec Sprint 3 — SOP composer", () => {
  beforeEach(() => {
    resetSopResolutionsStore();
    sopRateLimiter.reset("user-gis-owner");
    process.env.SOP_COMPOSE_MOCK_STREAM = "true";
  });

  it("S3-SUG-01: compose suggestions require functionId", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/sop/compose/suggestions")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(422);

    const response = await request(app.getHttpServer())
      .get(
        "/api/v1/sop/compose/suggestions?functionId=fn-school-academics",
      )
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);

    assert.ok(Array.isArray(response.body.data.recommended));
    assert.equal(response.body.data.requireConfirmation, true);

    await app.close();
  });

  it("S3-TRAN-01: transcribe returns transcript artifact", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer())
      .post("/api/v1/sop/transcribe")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .attach("audio", Buffer.from("fake-audio"), {
        filename: "recording.webm",
        contentType: "audio/webm",
      })
      .expect(201);

    assert.ok(response.body.data.transcript.length > 10);
    assert.ok(response.body.data.artifactId);

    await app.close();
  });

  it("S3-COMP-01: compose streams ndjson ending with complete", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const suggestions = await request(app.getHttpServer())
      .get(
        "/api/v1/sop/compose/suggestions?functionId=fn-school-academics",
      )
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);

    const packId =
      suggestions.body.data.recommended[0]?.packId ??
      suggestions.body.data.tenantSelections[0]?.packId;
    assert.ok(packId);

    const response = await request(app.getHttpServer())
      .post("/api/v1/sop/compose")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({
        functionId: "fn-school-academics",
        processAreaId: "area-school-academics-student-records",
        confirmedPackIds: [packId],
        artifacts: [
          {
            id: "text-1",
            kind: "text",
            content:
              "Staff log safeguarding concerns and escalate to the designated lead within 24 hours.",
          },
        ],
      })
      .expect(200);

    const lines = response.text
      .split("\n")
      .map((line: string) => line.trim())
      .filter(Boolean);
    assert.ok(lines.length >= 3);

    const events = lines.map((line: string) => JSON.parse(line));
    assert.ok(events.some((event: { type: string }) => event.type === "step"));
    assert.ok(events.some((event: { type: string }) => event.type === "gap"));
    const complete = events.find(
      (event: { type: string }) => event.type === "complete",
    );
    assert.ok(complete);
    assert.ok(complete.draft.name);

    await app.close();
  });

  it("S3-COMP-02: compose rejects missing confirmed packs", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/sop/compose")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({
        functionId: "fn-school-academics",
        processAreaId: "area-school-academics-student-records",
        confirmedPackIds: [],
        artifacts: [{ id: "a1", kind: "text", content: "Test" }],
      })
      .expect(422);

    await app.close();
  });

  it("S3-RES-01: save and list source resolution", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/sop/resolutions")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({
        sourceArtifactId: "text-1",
        field: "risk_rating",
        chosenValue: "high",
        draftHash: "abc123",
      })
      .expect(201);

    const listed = await request(app.getHttpServer())
      .get("/api/v1/sop/resolutions?draftHash=abc123")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);

    assert.equal(listed.body.data.length, 1);
    assert.equal(listed.body.data[0].chosenValue, "high");

    await app.close();
  });
});
