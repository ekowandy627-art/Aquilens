import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import type { AuthUser } from "../auth/auth.types";
import { AgentError, AgentsService } from "./agents.service";
import type { AttestationOutcome } from "./agent-demo.store";

type CreateAgentDto = {
  name: string;
  description?: string;
  purpose?: string;
  vendor?: string;
  modelName?: string;
  modelVersion?: string;
  ownerId?: string;
  owningFunctionId?: string;
  riskClassification?: "high" | "medium" | "low";
  riskRationale?: string;
  deploymentEnvironment?: string;
  version?: string;
  deploymentDate?: string;
};

type AttestDto = {
  outcome: AttestationOutcome;
  notes?: string;
};

type LinkAgentDto = {
  agentId: string;
};

@Controller("api/v1")
@UseGuards(AuthGuard, PermissionGuard)
export class AgentsController {
  constructor(
    @Inject(AgentsService) private readonly agents: AgentsService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get("agents/due-attestation")
  @RequirePermission("agents", "read")
  async dueAttestation(@CurrentUser() user: AuthUser) {
    try {
      const data = await this.agents.listDueAttestation(user);
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Get("search/agents")
  @RequirePermission("agents", "read")
  async search(@CurrentUser() user: AuthUser, @Query("q") query?: string) {
    try {
      const data = await this.agents.search(user, query ?? "");
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Get("agents")
  @RequirePermission("agents", "read")
  async list(
    @CurrentUser() user: AuthUser,
    @Query("status") status?: string,
    @Query("risk") risk?: string,
    @Query("vendor") vendor?: string,
    @Query("functionId") functionId?: string,
    @Query("attestationStatus") attestationStatus?: string,
  ) {
    try {
      const data = await this.agents.list(user, {
        status,
        risk,
        vendor,
        functionId,
        attestationStatus,
      });
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Post("agents")
  @RequirePermission("agents", "create")
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateAgentDto) {
    try {
      const data = await this.agents.create(user, dto);

      await this.audit.log(user, {
        eventType: "agent.created",
        entityType: "Agent",
        entityId: data.id,
        entityName: data.name,
        action: `Registered agent "${data.name}" (${data.agentCode})`,
        afterState: dto,
      });

      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Get("agents/:id")
  @RequirePermission("agents", "read")
  async get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    try {
      const data = await this.agents.get(user, id);
      if (!data) {
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Agent not found.", status: 404 },
        };
      }
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Patch("agents/:id")
  @RequirePermission("agents", "edit")
  async update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: Partial<CreateAgentDto>,
  ) {
    try {
      const data = await this.agents.update(user, id, dto);

      await this.audit.log(user, {
        eventType: "agent.updated",
        entityType: "Agent",
        entityId: data.id,
        entityName: data.name,
        action: `Updated agent "${data.name}"`,
        afterState: dto,
      });

      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Post("agents/:id/deprecate")
  @RequirePermission("agents", "edit")
  async deprecate(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    try {
      const data = await this.agents.deprecate(user, id);
      const deprecatedAgent = "agent" in data ? data.agent : data;

      await this.audit.log(user, {
        eventType: "agent.deprecated",
        entityType: "Agent",
        entityId: deprecatedAgent.id,
        entityName: deprecatedAgent.name,
        action: `Deprecated agent "${deprecatedAgent.name}"`,
      });

      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Post("agents/:id/retire")
  @RequirePermission("agents", "edit")
  async retire(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    try {
      const data = await this.agents.retire(user, id);
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Get("agents/:id/processes")
  @RequirePermission("agents", "read")
  async processes(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    try {
      const data = await this.agents.listProcesses(user, id);
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Get("agents/:id/attestations")
  @RequirePermission("agents", "read")
  async attestations(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    try {
      const data = await this.agents.listAttestations(user, id);
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Post("agents/:id/attest")
  @RequirePermission("agents", "edit")
  async attest(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: AttestDto,
  ) {
    try {
      const data = await this.agents.attest(user, id, dto);

      await this.audit.log(user, {
        eventType: "agent.attested",
        entityType: "Agent",
        entityId: data.agent.id,
        entityName: data.agent.name,
        action: `Attested agent "${data.agent.name}" (${dto.outcome})`,
        metadata: { outcome: dto.outcome, notes: dto.notes },
      });

      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Post("processes/:processId/versions/:versionId/steps/:stepId/agents")
  @RequirePermission("processes", "edit")
  async linkAgent(
    @CurrentUser() user: AuthUser,
    @Param("processId") processId: string,
    @Param("versionId") versionId: string,
    @Param("stepId") stepId: string,
    @Body() dto: LinkAgentDto,
  ) {
    try {
      const data = await this.agents.linkToStep(
        user,
        processId,
        versionId,
        stepId,
        dto.agentId,
      );

      await this.audit.log(user, {
        eventType: "agent.linked",
        entityType: "ProcessStep",
        entityId: stepId,
        action: `Linked agent to process step`,
        metadata: { processId, agentId: dto.agentId },
      });

      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Delete("processes/:processId/versions/:versionId/steps/:stepId/agents/:agentId")
  @RequirePermission("processes", "edit")
  async unlinkAgent(
    @CurrentUser() user: AuthUser,
    @Param("processId") processId: string,
    @Param("versionId") versionId: string,
    @Param("stepId") stepId: string,
    @Param("agentId") agentId: string,
  ) {
    try {
      const data = await this.agents.unlinkFromStep(
        user,
        processId,
        versionId,
        stepId,
        agentId,
      );
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  private mapError(error: unknown): never {
    if (error instanceof AgentError) {
      const status =
        error.code === "NOT_FOUND" ? 404 : error.code === "FORBIDDEN" ? 403 : 422;
      throw new HttpException(
        {
          success: false,
          error: { code: error.code, message: error.message, status },
        },
        status,
      );
    }

    const message = error instanceof Error ? error.message : "Request failed";
    throw new HttpException(
      {
        success: false,
        error: { code: "AGENT_REQUEST_FAILED", message, status: 422 },
      },
      422,
    );
  }
}
