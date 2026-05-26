import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuditModule } from "../audit/audit.module";
import { AdminController } from "./admin.controller";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [AdminController],
})
export class AdminModule {}
