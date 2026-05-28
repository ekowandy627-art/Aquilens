import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { EvidenceModule } from "../evidence/evidence.module";
import { EvidenceService } from "../evidence/evidence.service";
import { WorkflowsController } from "./workflows.controller";
import { WorkflowsService } from "./workflows.service";

@Module({
  imports: [AuditModule, EvidenceModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService, EvidenceService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
