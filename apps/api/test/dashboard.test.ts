import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import { resetEscalationDemoStore } from "../src/notifications/escalation-demo.store";
import { resetNotificationDemoStore } from "../src/notifications/notification-demo.store";
import { resetProcessDemoStore } from "../src/processes/process-demo.store";

describe("dashboard API", () => {
  beforeEach(() => {
    resetProcessDemoStore();
    resetNotificationDemoStore();
    resetEscalationDemoStore();
  });

  it("returns super admin summary for gis-admin", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/dashboard")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.success, true);
        assert.equal(response.body.data.roleView, "super_admin");
        assert.ok(response.body.data.openWorkflows >= 1);
        assert.ok(response.body.data.pendingApprovals >= 1);
        assert.ok(response.body.data.recentActivity.length >= 1);
      });

    await app.close();
  });

  it("returns staff task-only summary for gis-staff", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/dashboard")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.data.roleView, "staff");
        assert.equal(response.body.data.myTasks.length, 2);
        assert.equal(response.body.data.overdueTaskCount, 1);
        assert.ok(
          response.body.data.myTasks.some(
            (task: { stepTitle: string }) =>
              task.stepTitle === "Schedule admission interview",
          ),
        );
      });

    await app.close();
  });

  it("returns department head summary for gis-head", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/dashboard")
      .set("Authorization", "Bearer demo:user-gis-head")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.data.roleView, "department_head");
        assert.ok(response.body.data.pendingApprovals >= 1);
      });

    await app.close();
  });
});

describe("escalation rules API", () => {
  beforeEach(() => {
    resetProcessDemoStore();
    resetNotificationDemoStore();
    resetEscalationDemoStore();
  });

  it("lists seeded escalation rules for gis-admin", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/escalation-rules")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.data.length, 2);
        assert.ok(
          response.body.data.some(
            (rule: { name: string }) => rule.name === "Workflow Task SLA Breach",
          ),
        );
      });

    await app.close();
  });

  it("creates escalation rule with levels", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/escalation-rules")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .send({
        name: "Approval Overdue",
        triggerEvent: "approval_overdue",
        levels: [
          { levelNumber: 1, targetRole: "Department Head", delayHours: 0 },
          { levelNumber: 2, targetRole: "Super Admin", delayHours: 24 },
        ],
      })
      .expect(201)
      .expect((response) => {
        assert.equal(response.body.data.name, "Approval Overdue");
        assert.equal(response.body.data.levels.length, 2);
      });

    await app.close();
  });

  it("returns 403 for staff accessing escalation rules", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/escalation-rules")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(403);

    await app.close();
  });

  it("toggles escalation rule active state", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/escalation-rules/escalation-task-sla/toggle")
      .set("Authorization", "Bearer demo:user-gis-admin")
      .expect(201)
      .expect((response) => {
        assert.equal(response.body.data.isActive, false);
      });

    await app.close();
  });
});
