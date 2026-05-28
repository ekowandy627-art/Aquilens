import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import {
  FunctionGuidanceController,
  GuidanceController,
  TenantGuidanceController,
} from "./guidance.controller";
import { ProcessGuidanceController } from "./process-guidance.controller";
import { StandardsRecommendationService } from "./standards-recommendation.service";
import { StandardsService } from "./standards.service";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [
    GuidanceController,
    TenantGuidanceController,
    FunctionGuidanceController,
    ProcessGuidanceController,
  ],
  providers: [StandardsService, StandardsRecommendationService],
  exports: [StandardsService],
})
export class StandardsModule {}
