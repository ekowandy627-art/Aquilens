import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthEventsController } from "./auth-events.controller";
import { AuthGuard } from "./auth.guard";
import { PermissionGuard } from "./permission.guard";

@Module({
  imports: [AuditModule],
  controllers: [AuthEventsController],
  providers: [AuthGuard, PermissionGuard],
  exports: [AuthGuard, PermissionGuard],
})
export class AuthModule {}
