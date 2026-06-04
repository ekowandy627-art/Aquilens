import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { WorkflowsModule } from "../workflows/workflows.module";
import { SiaiController } from "./siai.controller";
import { SiaiService } from "./siai.service";

@Module({
  imports: [AuthModule, AuditModule, WorkflowsModule],
  controllers: [SiaiController],
  providers: [SiaiService],
  exports: [SiaiService],
})
export class SiaiModule {}
