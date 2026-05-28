import { Module } from "@nestjs/common";
import { AgentsModule } from "../agents/agents.module";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { AcknowledgementsModule } from "../acknowledgements/acknowledgements.module";
import { ProcessesController } from "./processes.controller";
import { ProcessesService } from "./processes.service";

@Module({
  imports: [AuthModule, AuditModule, AgentsModule, AcknowledgementsModule],
  controllers: [ProcessesController],
  providers: [ProcessesService],
})
export class ProcessesModule {}

