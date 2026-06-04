import { Controller, Get, HttpException, Inject, Param } from "@nestjs/common";
import { withDemoAuthDefaults } from "../auth/demo-users";
import { AuditService } from "./audit.service";
import { GuestAccessService } from "./guest-access.service";
import { processDemoStore } from "../processes/process-demo.store";

function guestAuditUser(tenantId: string, email: string) {
  return withDemoAuthDefaults({
    id: "guest",
    tenantId,
    email,
    roles: ["Guest Auditor"],
    permissions: ["audit:read"],
  });
}

@Controller("api/v1/guest-access")
export class GuestAccessPublicController {
  constructor(
    @Inject(GuestAccessService) private readonly guestAccess: GuestAccessService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get("validate/:token")
  validate(@Param("token") token: string) {
    const data = this.guestAccess.validateToken(token);
    if (!data.valid) {
      throw new HttpException(
        {
          success: false,
          error: { code: "FORBIDDEN", message: data.error, status: 403 },
        },
        403,
      );
    }
    return { success: true, data: data.grant };
  }

  @Get("audit/:token")
  async auditForGuest(@Param("token") token: string) {
    const validation = this.guestAccess.validateToken(token);
    if (!validation.valid || !validation.grant) {
      throw new HttpException(
        {
          success: false,
          error: { code: "FORBIDDEN", message: validation.error ?? "Access denied", status: 403 },
        },
        403,
      );
    }

    const grant = validation.grant;
    const tenantId = "tenant-gis";

    if (grant.scope === "function" && grant.scopeId) {
      const processIds = processDemoStore
        .listProcesses(tenantId)
        .filter((process) => process.functionId === grant.scopeId)
        .map((process) => process.id);
      const data = await this.audit.list(
        guestAuditUser(tenantId, grant.auditorEmail),
        { limit: 100 },
      );
      return {
        success: true,
        data: {
          ...data,
          items: data.items.filter(
            (item) => item.entityId && processIds.includes(item.entityId),
          ),
        },
      };
    }

    const data = await this.audit.list(
      guestAuditUser(tenantId, grant.auditorEmail),
      { entityId: grant.scopeId, limit: 100 },
    );
    return { success: true, data };
  }
}
