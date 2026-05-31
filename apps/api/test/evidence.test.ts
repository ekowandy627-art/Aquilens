import { createHash } from "crypto";
import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import { resetEvidenceDemoStore } from "../src/evidence/evidence-demo.store";
import { resetProcessDemoStore } from "../src/processes/process-demo.store";
import { resetWorkflowDemoStore } from "../src/workflows/workflow-demo.store";
import { EvidenceService } from "../src/evidence/evidence.service";

describe("evidence API", () => {
  beforeEach(() => {
    resetProcessDemoStore();
    resetWorkflowDemoStore();
    resetEvidenceDemoStore();
  });

  it("computes SHA-256 checksum correctly", () => {
    const service = new EvidenceService();
    const buffer = Buffer.from("aquilens-evidence");
    const checksum = service.computeChecksum(buffer);
    assert.equal(
      checksum,
      createHash("sha256").update(buffer).digest("hex"),
    );
  });

  it("lists seeded evidence for completed task", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get(
        "/api/v1/workflows/workflow-gis-enrolment-t2/tasks/workflow-gis-enrolment-t2-task-2/evidence",
      )
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.success, true);
        assert.ok(
          response.body.data.some(
            (item: { filename?: string }) => item.filename === "application_pack.pdf",
          ),
        );
      });

    await app.close();
  });

  it("uploads evidence metadata with mock storage path", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const fileContents = Buffer.from("%PDF-1.4 demo evidence");

    await request(app.getHttpServer())
      .post(
        "/api/v1/workflows/workflow-gis-evidence-demo/tasks/workflow-gis-evidence-demo-task-1/evidence",
      )
      .set("Authorization", "Bearer demo:user-gis-owner")
      .field("notes", "Uploaded during interview scheduling")
      .attach("file", fileContents, {
        filename: "interview_notes.pdf",
        contentType: "application/pdf",
      })
      .expect(201)
      .expect((response) => {
        assert.equal(response.body.success, true);
        assert.equal(response.body.data.filename, "interview_notes.pdf");
        assert.match(
          response.body.data.checksum,
          /^[a-f0-9]{64}$/,
        );
      });

    await app.close();
  });

  it("blocks task completion when evidence is required but missing", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const blocked = await request(app.getHttpServer())
      .post(
        "/api/v1/workflows/workflow-gis-evidence-demo/tasks/workflow-gis-evidence-demo-task-1/complete",
      )
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({ notes: "Should fail" });

    assert.equal(blocked.status, 422);
    assert.equal(blocked.body.error?.code, "EVIDENCE_REQUIRED", blocked.body.error?.message);

    await app.close();
  });

  it("allows task completion after evidence upload", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post(
        "/api/v1/workflows/workflow-gis-evidence-demo/tasks/workflow-gis-evidence-demo-task-1/evidence",
      )
      .set("Authorization", "Bearer demo:user-gis-owner")
      .attach("file", Buffer.from("proof"), {
        filename: "proof.pdf",
        contentType: "application/pdf",
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(
        "/api/v1/workflows/workflow-gis-evidence-demo/tasks/workflow-gis-evidence-demo-task-1/complete",
      )
      .set("Authorization", "Bearer demo:user-gis-owner")
      .send({ notes: "Evidence attached" })
      .expect(201)
      .expect((response) => {
        assert.equal(response.body.data.status, "completed");
      });

    await app.close();
  });

  it("returns signed download URL without streaming file bytes", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/evidence/evidence-enrol-t2-task2-pack/download")
      .set("Authorization", "Bearer demo:user-gis-head")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.success, true);
        assert.ok(response.body.data.signedUrl);
        assert.ok(response.body.data.expiresAt);
        assert.match(response.body.data.signedUrl, /^https:\/\//);
      });

    await app.close();
  });

  it("rejects delete with 405", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .delete("/api/v1/evidence/evidence-enrol-t2-task2-pack")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(405)
      .expect((response) => {
        assert.equal(response.body.error.code, "METHOD_NOT_ALLOWED");
      });

    await app.close();
  });

  it("blocks cross-tenant evidence download", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/evidence/evidence-enrol-t2-task2-pack/download")
      .set("Authorization", "Bearer demo:user-hospital-staff")
      .expect(403);

    await app.close();
  });
});
