import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { EscalationController } from "./escalation.controller";
import { EscalationService } from "./escalation.service";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

@Module({
  controllers: [
    NotificationsController,
    EscalationController,
    DashboardController,
  ],
  providers: [NotificationsService, EscalationService, DashboardService],
  exports: [NotificationsService, EscalationService],
})
export class NotificationsModule {}
