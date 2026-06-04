import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { AiQuotaService } from "./ai-quota.service";
import { AiUsageService } from "./ai-usage.service";
import { PlatformAiAgentRegistryService } from "./platform-ai-agent-registry.service";
import { TenantPlatformConfigService } from "./tenant-platform-config.service";
import { WallNoticeService } from "./wall-notice.service";

@Module({
  imports: [NotificationsModule],
  providers: [
    TenantPlatformConfigService,
    AiUsageService,
    AiQuotaService,
    PlatformAiAgentRegistryService,
    WallNoticeService,
  ],
  exports: [
    TenantPlatformConfigService,
    AiUsageService,
    AiQuotaService,
    PlatformAiAgentRegistryService,
    WallNoticeService,
  ],
})
export class PlatformOpsModule {}
