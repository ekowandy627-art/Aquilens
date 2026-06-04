import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { WorkflowsModule } from "../workflows/workflows.module";
import { IncidentsController } from "./incidents.controller";
import { IncidentsService } from "./incidents.service";

@Module({
  imports: [AuthModule, AuditModule, WorkflowsModule],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
