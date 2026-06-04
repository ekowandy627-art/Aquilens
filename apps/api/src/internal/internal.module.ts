import { Module } from "@nestjs/common";
import { AgentsModule } from "../agents/agents.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PlatformOpsModule } from "../platform-ops/platform-ops.module";
import { WorkflowsModule } from "../workflows/workflows.module";
import { InternalController } from "./internal.controller";
import { InternalCronService } from "./internal-cron.service";
import { InternalMetricsService } from "./internal-metrics.service";
import { InternalPlatformAgentsService } from "./internal-platform-agents.service";
import { InternalPlatformAuditService } from "./internal-platform-audit.service";
import { InternalSupportService } from "./internal-support.service";
import { InternalTenantAgentsService } from "./internal-tenant-agents.service";
import { InternalTenantsService } from "./internal-tenants.service";
import { InternalGuidanceService } from "./internal-guidance.service";
import { InternalGuard } from "./internal.guard";

@Module({
  imports: [AgentsModule, WorkflowsModule, PlatformOpsModule, NotificationsModule],
  controllers: [InternalController],
  providers: [
    InternalTenantsService,
    InternalGuidanceService,
    InternalCronService,
    InternalMetricsService,
    InternalSupportService,
    InternalPlatformAuditService,
    InternalPlatformAgentsService,
    InternalTenantAgentsService,
    InternalGuard,
  ],
  exports: [
    InternalCronService,
    InternalMetricsService,
    InternalTenantsService,
    InternalGuidanceService,
  ],
})
export class InternalModule {}
