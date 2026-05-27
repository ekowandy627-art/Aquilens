import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { SopController } from "./sop.controller";
import { SopGenerationService } from "./sop-generation.service";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [SopController],
  providers: [SopGenerationService],
})
export class SopModule {}
