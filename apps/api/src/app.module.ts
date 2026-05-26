import { Module } from "@nestjs/common";
import { AdminModule } from "./admin/admin.module";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { TenantsController } from "./tenants/tenants.controller";

@Module({
  imports: [AuthModule, AdminModule],
  controllers: [AppController, TenantsController],
})
export class AppModule {}
