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

@Module({
  imports: [
    AuthModule,
    AuditModule,
    AdminModule,
    ProcessesModule,
    SopModule,
    ApprovalsModule,
    WorkflowsModule,
    EvidenceModule,
    NotificationsModule,
    AgentsModule,
  ],
  controllers: [AppController, TenantsController],
})
export class AppModule {}
