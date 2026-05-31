import { Module } from "@nestjs/common";
import { InternalController } from "./internal.controller";
import { InternalTenantsService } from "./internal-tenants.service";
import { InternalGuidanceService } from "./internal-guidance.service";
import { InternalGuard } from "./internal.guard";

@Module({
  controllers: [InternalController],
  providers: [InternalTenantsService, InternalGuidanceService, InternalGuard],
})
export class InternalModule {}
