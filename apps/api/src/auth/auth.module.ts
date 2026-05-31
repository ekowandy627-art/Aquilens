import { Module } from "@nestjs/common";
import { AuthEventsController } from "./auth-events.controller";
import { AuthGuard } from "./auth.guard";
import { PermissionGuard } from "./permission.guard";

@Module({
  controllers: [AuthEventsController],
  providers: [AuthGuard, PermissionGuard],
  exports: [AuthGuard, PermissionGuard],
})
export class AuthModule {}
