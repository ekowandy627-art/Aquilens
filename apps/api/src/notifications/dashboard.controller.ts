import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { DashboardService } from "./dashboard.service";

@Controller("api/v1/dashboard")
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(
    @Inject(DashboardService) private readonly dashboard: DashboardService,
  ) {}

  @Get()
  getSummary(@CurrentUser() user: AuthUser) {
    const data = this.dashboard.getSummary(user);
    return { success: true, data };
  }
}
