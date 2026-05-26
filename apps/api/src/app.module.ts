import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { TenantsController } from "./tenants/tenants.controller";

@Module({
  imports: [AuthModule],
  controllers: [AppController, TenantsController],
})
export class AppModule {}
