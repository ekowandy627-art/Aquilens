import { Module } from "@nestjs/common";
import { AgentsModule } from "../agents/agents.module";
import { WorkflowsModule } from "../workflows/workflows.module";
import { InternalController } from "./internal.controller";
import { InternalCronService } from "./internal-cron.service";
import { InternalTenantsService } from "./internal-tenants.service";
import { InternalGuidanceService } from "./internal-guidance.service";
import { InternalGuard } from "./internal.guard";

@Module({
  imports: [AgentsModule, WorkflowsModule],
  controllers: [InternalController],
  providers: [
    InternalTenantsService,
    InternalGuidanceService,
    InternalCronService,
    InternalGuard,
  ],
  exports: [InternalCronService],
})
export class InternalModule {}
