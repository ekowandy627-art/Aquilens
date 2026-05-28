import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import {
  ATTESTATION_INTERVALS_DAYS,
  calculateNextAttestationDue,
} from "../src/agents/attestation-schedule";
import { generateAgentCode, nextAgentSequence } from "../src/agents/agent-code";
import { resetAgentDemoStore } from "../src/agents/agent-demo.store";

describe("agent utilities", () => {
  it("calculates next attestation due by risk", () => {
    const base = "2026-01-01T00:00:00.000Z";
    assert.equal(
      calculateNextAttestationDue(base, "high"),
      calculateNextAttestationDue(base, "high"),
    );
    const highDue = new Date(calculateNextAttestationDue(base, "high"));
    const mediumDue = new Date(calculateNextAttestationDue(base, "medium"));
    const lowDue = new Date(calculateNextAttestationDue(base, "low"));
    assert.equal(
      Math.round((highDue.getTime() - new Date(base).getTime()) / 86400000),
      ATTESTATION_INTERVALS_DAYS.high,
    );
    assert.ok(mediumDue > highDue);
    assert.ok(lowDue > mediumDue);
  });

  it("auto-increments agent codes", () => {
    assert.equal(generateAgentCode(1), "AI-001");
    assert.equal(generateAgentCode(12), "AI-012");
    assert.equal(nextAgentSequence(["AI-001", "AI-002"]), 3);
  });
});

describe("agents API", () => {
  beforeEach(() => {
    resetAgentDemoStore();
  });

  it("lists seeded GIS agents", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/agents")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.success, true);
        assert.equal(response.body.data.length, 2);
        const overdue = response.body.data.find(
          (item: { agentCode: string }) => item.agentCode === "AI-001",
        );
        assert.equal(overdue.attestationStatus, "overdue");
      });

    await app.close();
  });

  it("attests agent and recalculates next due date", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/agents/agent-gis-001/attest")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .send({ outcome: "confirmed", notes: "Re-attested in test" })
      .expect(201)
      .expect((response) => {
        assert.equal(response.body.data.agent.agentCode, "AI-001");
        assert.equal(response.body.data.attestation.outcome, "confirmed");
        assert.equal(response.body.data.agent.attestationStatus, "current");
      });

    await request(app.getHttpServer())
      .get("/api/v1/agents/agent-gis-001/attestations")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(200)
      .expect((response) => {
        assert.ok(response.body.data.length >= 2);
      });

    await app.close();
  });

  it("deprecate returns linked process impact", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/agents/agent-gis-001/deprecate")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(201)
      .expect((response) => {
        assert.equal(response.body.data.impact.linkedProcessCount, 1);
        assert.equal(response.body.data.agent.status, "deprecated");
      });

    await app.close();
  });

  it("links agent to process step", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post(
        "/api/v1/processes/proc-gis-fees/versions/proc-gis-fees-v1/steps/proc-gis-fees-v1-step-1/agents",
      )
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({ agentId: "agent-gis-002" })
      .expect(201)
      .expect((response) => {
        assert.equal(response.body.data.agent.agentCode, "AI-002");
      });

    await request(app.getHttpServer())
      .get("/api/v1/processes/proc-gis-fees")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200)
      .expect((response) => {
        const step = response.body.data.steps.find(
          (item: { id: string }) => item.id === "proc-gis-fees-v1-step-1",
        );
        assert.ok(step.agents.some((agent: { agentCode: string }) => agent.agentCode === "AI-002"));
      });

    await app.close();
  });

  it("semantic search returns student-data agents", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/search/agents")
      .query({ q: "student attendance" })
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(200)
      .expect((response) => {
        assert.ok(response.body.data.length >= 1);
        assert.ok(
          response.body.data.some(
            (item: { agentCode: string }) => item.agentCode === "AI-001",
          ),
        );
      });

    await app.close();
  });

  it("registers new agent with auto code", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/agents")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .send({
        name: "Admissions Chatbot",
        vendor: "Anthropic",
        modelName: "claude-sonnet-4-6",
        purpose: "Answer applicant FAQs",
        riskClassification: "medium",
      })
      .expect(201)
      .expect((response) => {
        assert.equal(response.body.data.agentCode, "AI-003");
      });

    await app.close();
  });
});
