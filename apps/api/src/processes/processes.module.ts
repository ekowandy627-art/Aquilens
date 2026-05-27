import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { ProcessesController } from "./processes.controller";
import { ProcessesService } from "./processes.service";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [ProcessesController],
  providers: [ProcessesService],
})
export class ProcessesModule {}

