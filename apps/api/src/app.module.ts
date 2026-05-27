import { Module } from "@nestjs/common";
import { AdminModule } from "./admin/admin.module";
import { AppController } from "./app.controller";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { ProcessesModule } from "./processes/processes.module";
import { TenantsController } from "./tenants/tenants.controller";

@Module({
  imports: [AuthModule, AuditModule, AdminModule, ProcessesModule],
  controllers: [AppController, TenantsController],
})
export class AppModule {}
