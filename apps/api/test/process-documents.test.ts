import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import { resetProcessDemoStore } from "../src/processes/process-demo.store";

describe("process documents API (Phase 13)", () => {
  beforeEach(() => {
    resetProcessDemoStore();
  });

  it("P13-A-08: list documents empty for new fees process", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer())
      .get("/api/v1/processes/proc-gis-fees/documents")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);

    assert.deepEqual(response.body.data, []);
    await app.close();
  });

  it("P13-A-09: upload document metadata", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-fees/documents")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .attach("file", Buffer.from("%PDF-1.4 test"), {
        filename: "fee-sop.pdf",
        contentType: "application/pdf",
      })
      .expect(201);

    const list = await request(app.getHttpServer())
      .get("/api/v1/processes/proc-gis-fees/documents")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(200);

    assert.equal(list.body.data.length, 1);
    assert.equal(list.body.data[0].filename, "fee-sop.pdf");
    await app.close();
  });

  it("P13-A-11: archive active attendance process", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/processes/proc-gis-attendance/archive")
      .set("Authorization", "Bearer demo:user-gis-owner")
      .expect(201)
      .expect((response) => {
        assert.equal(response.body.data.status, "archived");
      });

    await app.close();
  });
});
