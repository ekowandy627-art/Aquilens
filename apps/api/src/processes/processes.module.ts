import { Module } from "@nestjs/common";
import { AgentsModule } from "../agents/agents.module";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { ProcessesController } from "./processes.controller";
import { ProcessesService } from "./processes.service";

@Module({
  imports: [AuthModule, AuditModule, AgentsModule],
  controllers: [ProcessesController],
  providers: [ProcessesService],
})
export class ProcessesModule {}

