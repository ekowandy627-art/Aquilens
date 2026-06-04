import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { PlatformOpsModule } from "../platform-ops/platform-ops.module";
import { StandardsModule } from "../standards/standards.module";
import { SopController } from "./sop.controller";
import { SopGenerationService } from "./sop-generation.service";
import { SopComposeService } from "./sop-compose.service";
import { SopResolutionsService } from "./sop-resolutions.service";

@Module({
  imports: [AuthModule, AuditModule, StandardsModule, PlatformOpsModule],
  controllers: [SopController],
  providers: [SopGenerationService, SopComposeService, SopResolutionsService],
})
export class SopModule {}
