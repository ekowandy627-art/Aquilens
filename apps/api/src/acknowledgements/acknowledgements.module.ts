import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AcknowledgementsController } from "./acknowledgements.controller";
import { AcknowledgementsService } from "./acknowledgements.service";

@Module({
  imports: [AuditModule],
  controllers: [AcknowledgementsController],
  providers: [AcknowledgementsService],
  exports: [AcknowledgementsService],
})
export class AcknowledgementsModule {}
