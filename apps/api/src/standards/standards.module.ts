import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PlatformOpsModule } from "../platform-ops/platform-ops.module";
import {
  FunctionGuidanceController,
  GuidanceController,
  TenantGuidanceController,
} from "./guidance.controller";
import { ProcessGuidanceController } from "./process-guidance.controller";
import { StandardsGapAnalysisService } from "./standards-gap-analysis.service";
import { StandardsRecommendationService } from "./standards-recommendation.service";
import { StandardsService } from "./standards.service";
import { StandardsUpdatesController } from "./standards-updates.controller";
import { TenantAiUsageController } from "../platform-ops/tenant-ai-usage.controller";

@Module({
  imports: [AuthModule, AuditModule, PlatformOpsModule],
  controllers: [
    GuidanceController,
    TenantGuidanceController,
    FunctionGuidanceController,
    ProcessGuidanceController,
    StandardsUpdatesController,
    TenantAiUsageController,
  ],
  providers: [
    StandardsService,
    StandardsRecommendationService,
    StandardsGapAnalysisService,
  ],
  exports: [StandardsService, StandardsGapAnalysisService],
})
export class StandardsModule {}
