import { Inject, Injectable } from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types";
import { NotificationsService } from "../notifications/notifications.service";
import type { WallErrorCode } from "./platform-ops.types";
import { wallMessage } from "./platform-error";

const DEDUPE_MS = 15 * 60 * 1000;
const recentWalls = new Map<string, number>();

@Injectable()
export class WallNoticeService {
  constructor(
    @Inject(NotificationsService)
    private readonly notifications: NotificationsService,
  ) {}

  async notifyWallHit(user: AuthUser, code: WallErrorCode) {
    const key = `${user.tenantId}:${user.id}:${code}`;
    const now = Date.now();
    const last = recentWalls.get(key);
    if (last != null && now - last < DEDUPE_MS) {
      return;
    }
    recentWalls.set(key, now);

    await this.notifications.create({
      tenantId: user.tenantId,
      userId: user.id,
      type: "access_blocked",
      title: this.titleForCode(code),
      body: wallMessage(code),
      entityType: "platform_wall",
      entityId: code,
      entityName: code,
    });
  }

  resetDedupeForTests() {
    recentWalls.clear();
  }

  private titleForCode(code: WallErrorCode) {
    switch (code) {
      case "AI_BUDGET_UNSET":
        return "AI usage not configured";
      case "AI_BUDGET_EXCEEDED":
        return "AI usage limit reached";
      case "FEATURE_DISABLED":
        return "Feature unavailable";
      case "TENANT_SUSPENDED":
        return "Account suspended";
      default:
        return "Action blocked";
    }
  }
}
