import { Module } from "@nestjs/common";
import { AuthGuard } from "./auth.guard";
import { PermissionGuard } from "./permission.guard";

@Module({
  providers: [AuthGuard, PermissionGuard],
  exports: [AuthGuard, PermissionGuard],
})
export class AuthModule {}
