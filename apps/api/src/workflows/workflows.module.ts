import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { EvidenceModule } from "../evidence/evidence.module";
import { EvidenceService } from "../evidence/evidence.service";
import { WorkflowsController } from "./workflows.controller";
import { WorkflowsService } from "./workflows.service";
import { WorkflowEngineService } from "./workflow-engine.service";

@Module({
  imports: [AuditModule, EvidenceModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService, WorkflowEngineService, EvidenceService],
  exports: [WorkflowsService, WorkflowEngineService],
})
export class WorkflowsModule {}
