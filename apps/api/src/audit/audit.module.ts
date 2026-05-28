import { Module } from "@nestjs/common";
import { AuditController } from "./audit.controller";
import { GuestAccessPublicController } from "./guest-access-public.controller";
import { AuditPacksService } from "./audit-packs.service";
import { AuditService } from "./audit.service";
import { GuestAccessService } from "./guest-access.service";

@Module({
  controllers: [AuditController, GuestAccessPublicController],
  providers: [AuditService, AuditPacksService, GuestAccessService],
  exports: [AuditService],
})
export class AuditModule {}
