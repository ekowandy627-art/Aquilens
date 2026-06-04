import { Module } from "@nestjs/common";
import { AdminModule } from "./admin/admin.module";
import { AppController } from "./app.controller";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { AgentsModule } from "./agents/agents.module";
import { ApprovalsModule } from "./approvals/approvals.module";
import { EvidenceModule } from "./evidence/evidence.module";
import { WorkflowsModule } from "./workflows/workflows.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { ProcessesModule } from "./processes/processes.module";
import { SopModule } from "./sop/sop.module";
import { TenantsController } from "./tenants/tenants.controller";
import { DemoController } from "./demo/demo.controller";
import { StandardsModule } from "./standards/standards.module";
import { IncidentsModule } from "./incidents/incidents.module";
import { SiaiModule } from "./siai/siai.module";
import { TrainingModule } from "./training/training.module";
import { RecurringControlsModule } from "./recurring-controls/recurring-controls.module";
import { InternalModule } from "./internal/internal.module";

@Module({
  imports: [
    AuthModule,
    AuditModule,
    AdminModule,
    StandardsModule,
    ProcessesModule,
    SopModule,
    ApprovalsModule,
    WorkflowsModule,
    EvidenceModule,
    NotificationsModule,
    AgentsModule,
    IncidentsModule,
    SiaiModule,
    TrainingModule,
    RecurringControlsModule,
    InternalModule,
  ],
  controllers: [AppController, TenantsController, DemoController],
})
export class AppModule {}
