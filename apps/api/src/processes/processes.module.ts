import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { ProcessesController } from "./processes.controller";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [ProcessesController],
})
export class ProcessesModule {}

