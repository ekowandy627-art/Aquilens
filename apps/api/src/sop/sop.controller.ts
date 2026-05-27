import {
  Body,
  Controller,
  HttpException,
  Inject,
  Post,
  UnprocessableEntityException,
  UseGuards,
} from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import type { AuthUser } from "../auth/auth.types";
import { SopGenerationService } from "./sop-generation.service";
import { sopRateLimiter } from "./sop-rate-limit";

type GenerateSopDto = {
  description: string;
  functionId: string;
  processAreaId: string;
};

@Controller("api/v1/sop")
@UseGuards(AuthGuard, PermissionGuard)
export class SopController {
  constructor(
    @Inject(SopGenerationService) private readonly sop: SopGenerationService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Post("generate")
  @RequirePermission("processes", "create")
  async generate(@CurrentUser() user: AuthUser, @Body() dto: GenerateSopDto) {
    if (!dto.description?.trim() || !dto.functionId || !dto.processAreaId) {
      throw new UnprocessableEntityException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Description, function, and process area are required.",
          status: 422,
        },
      });
    }

    try {
      sopRateLimiter.assertWithinLimit(user.id);

      const result = await this.sop.generate({
        description: dto.description.trim(),
        functionId: dto.functionId,
        processAreaId: dto.processAreaId,
        tenantContext: user.email,
      });

      await this.audit.log(user, {
        eventType: "sop.ai_generated",
        entityType: "SopDraft",
        entityName: result.draft.name,
        action: `Generated AI SOP draft "${result.draft.name}"`,
        metadata: {
          descriptionLength: dto.description.trim().length,
          model: result.model,
          tokensUsed: result.tokensUsed,
          gapCount: result.gaps.length,
        },
      });

      return {
        success: true,
        data: {
          draft: result.draft,
          gaps: result.gaps,
          model: result.model,
          tokensUsed: result.tokensUsed,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Generation failed";
      const code =
        error instanceof Error && "code" in error && error.code === "RATE_LIMITED"
          ? "RATE_LIMITED"
          : "SOP_GENERATION_FAILED";
      const status = code === "RATE_LIMITED" ? 429 : 500;

      throw new HttpException(
        {
          success: false,
          error: { code, message, status },
        },
        status,
      );
    }
  }
}
