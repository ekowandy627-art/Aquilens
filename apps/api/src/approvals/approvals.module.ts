import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { WorkflowsModule } from "../workflows/workflows.module";
import { ApprovalsController } from "./approvals.controller";
import { ApprovalsService } from "./approvals.service";

@Module({
  imports: [AuditModule, WorkflowsModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
