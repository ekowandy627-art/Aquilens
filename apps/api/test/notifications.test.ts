import { Test } from "@nestjs/testing";
import request from "supertest";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AppModule } from "../src/app.module";
import { resetEscalationDemoStore } from "../src/notifications/escalation-demo.store";
import { resetNotificationDemoStore } from "../src/notifications/notification-demo.store";
import { NotificationsService } from "../src/notifications/notifications.service";
import { EscalationService } from "../src/notifications/escalation.service";
import { resetProcessDemoStore } from "../src/processes/process-demo.store";

describe("notifications API", () => {
  beforeEach(() => {
    resetProcessDemoStore();
    resetNotificationDemoStore();
    resetEscalationDemoStore();
  });

  it("lists seeded notifications for gis-staff with 1 unread", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get("/api/v1/notifications")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.success, true);
        assert.equal(response.body.data.length, 1);
        assert.ok(
          response.body.data.every((item: { isRead: boolean }) => !item.isRead),
        );
      });

    await request(app.getHttpServer())
      .get("/api/v1/notifications/unread-count")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.data.count, 1);
      });

    await app.close();
  });

  it("marks a notification as read", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .patch("/api/v1/notifications/notif-staff-ack-assigned/read")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.data.isRead, true);
        assert.ok(response.body.data.readAt);
      });

    await request(app.getHttpServer())
      .get("/api/v1/notifications/unread-count")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.data.count, 0);
      });

    await app.close();
  });

  it("marks all notifications as read", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/notifications/read-all")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(201)
      .expect((response) => {
        assert.equal(response.body.data.count, 1);
      });

    await request(app.getHttpServer())
      .get("/api/v1/notifications/unread-count")
      .set("Authorization", "Bearer demo:user-gis-staff")
      .expect(200)
      .expect((response) => {
        assert.equal(response.body.data.count, 0);
      });

    await app.close();
  });

  it("creates notifications for trigger types", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const notifications = moduleRef.get(NotificationsService);

    const created = await notifications.create({
      tenantId: "tenant-gis",
      userId: "user-gis-owner",
      type: "approval_requested",
      title: "Approval requested: Test SOP",
      entityType: "approval",
      entityId: "approval-test",
      entityName: "Test SOP",
    });

    assert.equal(created.type, "approval_requested");
    assert.equal(created.isRead, false);
    await moduleRef.close();
  });

  it("escalation chain resolves in order with delays", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const escalation = moduleRef.get(EscalationService);
    const rules = await escalation.list({
      id: "user-gis-admin",
      tenantId: "tenant-gis",
      email: "gis-admin@aquilens.test",
      roles: ["Super Admin"],
      permissions: ["*"],
    });

    const rule = rules.find((item) => item.id === "escalation-task-sla");
    assert.ok(rule);

    const immediate = escalation.resolveEscalationChain(rule!, 0);
    assert.deepEqual(immediate, [
      { levelNumber: 1, targetRole: "Staff" },
    ]);

    const afterDay = escalation.resolveEscalationChain(rule!, 24);
    assert.deepEqual(afterDay, [
      { levelNumber: 1, targetRole: "Staff" },
      { levelNumber: 2, targetRole: "Department Head" },
    ]);

    await moduleRef.close();
  });
});
