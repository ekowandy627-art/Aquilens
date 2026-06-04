import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import { resetTrainingDemoStore } from "../src/training/training-demo.store";

describe("Spec Sprint 6 — Training", () => {
  beforeEach(() => {
    resetTrainingDemoStore();
  });

  it("S6-TR-01: staff lists My Training assignments", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer())
      .get("/api/v1/training/my")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(200);

    assert.ok(response.body.data.length >= 2);
    await app.close();
  });

  it("S6-TR-02: acknowledge_only completes without quiz", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/training/assignments/assign-gis-staff-ack/acknowledge")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(201);

    await app.close();
  });

  it("S6-TR-03: assessed module requires 80% pass", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const quiz = await request(app.getHttpServer())
      .get("/api/v1/training/assignments/assign-gis-staff-safeguarding/quiz")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(200);

    const answers = quiz.body.data.questions.map(
      (question: { id: string }) => ({
        questionId: question.id,
        selectedIndex: 0,
      }),
    );

    const result = await request(app.getHttpServer())
      .post("/api/v1/training/assignments/assign-gis-staff-safeguarding/submit")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .send({ answers })
      .expect(201);

    assert.equal(result.body.data.passed, true);
    assert.ok(result.body.data.score >= 0.8);

    await app.close();
  });
});
