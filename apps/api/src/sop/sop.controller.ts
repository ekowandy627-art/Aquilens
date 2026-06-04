import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  Inject,
  Post,
  Query,
  Res,
  UnprocessableEntityException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { AuditService } from "../audit/audit.service";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import type { AuthUser } from "../auth/auth.types";
import { SopGenerationService } from "./sop-generation.service";
import { SopComposeService } from "./sop-compose.service";
import { SopResolutionsService } from "./sop-resolutions.service";
import { sopRateLimiter } from "./sop-rate-limit";
import type { ComposeSopInput, SaveResolutionInput } from "./sop-compose.types";

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
    @Inject(SopComposeService) private readonly compose: SopComposeService,
    @Inject(SopResolutionsService)
    private readonly resolutions: SopResolutionsService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get("compose/suggestions")
  @RequirePermission("processes", "create")
  composeSuggestions(
    @CurrentUser() user: AuthUser,
    @Query("functionId") functionId?: string,
  ) {
    if (!functionId) {
      throw new UnprocessableEntityException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "functionId is required.",
          status: 422,
        },
      });
    }

    return {
      success: true,
      data: this.compose.suggestStandards(user, functionId),
    };
  }

  @Post("transcribe")
  @RequirePermission("processes", "create")
  @UseInterceptors(FileInterceptor("audio"))
  async transcribe(
    @CurrentUser() user: AuthUser,
    @UploadedFile()
    file:
      | { buffer: Buffer; mimetype: string; originalname: string }
      | undefined,
  ) {
    if (!file?.buffer?.length) {
      throw new UnprocessableEntityException({
        success: false,
        error: {
          code: "AUDIO_REQUIRED",
          message: "Audio file is required.",
          status: 422,
        },
      });
    }

    try {
      const result = await this.compose.transcribe(file.buffer, file.mimetype);
      await this.audit.log(user, {
        eventType: "sop.transcribed",
        entityType: "SopArtifact",
        entityId: result.artifactId,
        action: "Transcribed voice recording for SOP composer",
        metadata: { bytes: file.buffer.length },
      });
      return { success: true, data: result };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Transcription failed";
      throw new HttpException(
        {
          success: false,
          error: { code: "TRANSCRIBE_FAILED", message, status: 500 },
        },
        500,
      );
    }
  }

  @Post("compose")
  @HttpCode(200)
  @RequirePermission("processes", "create")
  async composeStream(
    @CurrentUser() user: AuthUser,
    @Body() dto: ComposeSopInput,
    @Res() res: Response,
  ) {
    if (!dto.functionId || !dto.processAreaId) {
      throw new UnprocessableEntityException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "functionId and processAreaId are required.",
          status: 422,
        },
      });
    }

    if (!dto.confirmedPackIds?.length) {
      throw new UnprocessableEntityException({
        success: false,
        error: {
          code: "PACKS_REQUIRED",
          message: "Confirm standards packs before composing.",
          status: 422,
        },
      });
    }

    if (!dto.artifacts?.length) {
      throw new UnprocessableEntityException({
        success: false,
        error: {
          code: "ARTIFACTS_REQUIRED",
          message: "Add at least one source artifact before composing.",
          status: 422,
        },
      });
    }

    try {
      sopRateLimiter.assertWithinLimit(user.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Rate limited";
      throw new HttpException(
        {
          success: false,
          error: { code: "RATE_LIMITED", message, status: 429 },
        },
        429,
      );
    }

    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const stream =
        process.env.SOP_COMPOSE_MOCK_STREAM === "true"
          ? this.compose.streamComposeMock(dto)
          : this.compose.streamCompose(user, dto);

      for await (const event of stream) {
        res.write(`${JSON.stringify(event)}\n`);
      }

      await this.audit.log(user, {
        eventType: "sop.composed",
        entityType: "SopDraft",
        action: "Streamed SOP compose + align",
        metadata: {
          functionId: dto.functionId,
          packCount: dto.confirmedPackIds.length,
          artifactCount: dto.artifacts?.length ?? 0,
        },
      });

      res.end();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Compose failed";
      if (!res.headersSent) {
        throw new HttpException(
          {
            success: false,
            error: { code: "COMPOSE_FAILED", message, status: 500 },
          },
          500,
        );
      }
      res.write(
        `${JSON.stringify({ type: "error", message })}\n`,
      );
      res.end();
    }
  }

  @Post("resolutions")
  @RequirePermission("processes", "create")
  async saveResolution(
    @CurrentUser() user: AuthUser,
    @Body() dto: SaveResolutionInput,
  ) {
    if (!dto.sourceArtifactId || !dto.field || !dto.chosenValue) {
      throw new UnprocessableEntityException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "sourceArtifactId, field, and chosenValue are required.",
          status: 422,
        },
      });
    }

    const data = this.resolutions.save(user, dto);
    await this.audit.log(user, {
      eventType: "sop.resolution_saved",
      entityType: "SopSourceResolution",
      entityId: data.id,
      action: `Resolved ${dto.field} for composer`,
      metadata: {
        sourceArtifactId: dto.sourceArtifactId,
        chosenValue: dto.chosenValue,
      },
    });

    return { success: true, data };
  }

  @Get("resolutions")
  @RequirePermission("processes", "read")
  listResolutions(
    @CurrentUser() user: AuthUser,
    @Query("processId") processId?: string,
    @Query("draftHash") draftHash?: string,
  ) {
    return {
      success: true,
      data: this.resolutions.list(user, { processId, draftHash }),
    };
  }

  /** @deprecated Use POST /sop/compose — kept for regression tests */
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
