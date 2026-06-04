import {
  Body,
  Controller,
  Get,
  HttpException,
  Inject,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import type { AuthUser } from "../auth/auth.types";
import { TrainingError, TrainingService } from "./training.service";

@Controller("api/v1/training")
@UseGuards(AuthGuard, PermissionGuard)
export class TrainingController {
  constructor(@Inject(TrainingService) private readonly training: TrainingService) {}

  @Get("my")
  @RequirePermission("training", "complete")
  listMy(@CurrentUser() user: AuthUser) {
    return { success: true, data: this.training.listMy(user) };
  }

  @Get("assignments/:id/quiz")
  @RequirePermission("training", "complete")
  getQuiz(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const data = this.training.getAssignmentQuiz(user, id);
    if (!data) {
      throw new HttpException(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Assignment not found.", status: 404 },
        },
        404,
      );
    }
    return { success: true, data };
  }

  @Post("assignments/:id/acknowledge")
  @RequirePermission("training", "complete")
  acknowledge(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    try {
      const data = this.training.acknowledge(user, id);
      if (!data) {
        throw new HttpException(
          {
            success: false,
            error: { code: "NOT_FOUND", message: "Assignment not found.", status: 404 },
          },
          404,
        );
      }
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Post("assignments/:id/submit")
  @RequirePermission("training", "complete")
  submit(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: { answers: Array<{ questionId: string; selectedIndex: number }> },
  ) {
    try {
      const data = this.training.submitAssessment(user, id, body.answers ?? []);
      if (!data) {
        throw new HttpException(
          {
            success: false,
            error: { code: "NOT_FOUND", message: "Assignment not found.", status: 404 },
          },
          404,
        );
      }
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  private mapError(error: unknown) {
    if (error instanceof TrainingError) {
      throw new HttpException(
        {
          success: false,
          error: { code: error.code, message: error.message, status: 422 },
        },
        422,
      );
    }
    throw error;
  }
}
