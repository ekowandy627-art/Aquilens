import {
  Controller,
  Get,
  HttpException,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { NotificationsService } from "./notifications.service";

@Controller("api/v1/notifications")
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(
    @Inject(NotificationsService)
    private readonly notifications: NotificationsService,
  ) {}

  @Get()
  async list(
    @CurrentUser() user: AuthUser,
    @Query("isRead") isRead?: string,
    @Query("type") type?: string,
  ) {
    const filters: { isRead?: boolean; type?: string } = {};
    if (isRead === "true") {
      filters.isRead = true;
    } else if (isRead === "false") {
      filters.isRead = false;
    }
    if (type) {
      filters.type = type;
    }

    const data = await this.notifications.list(user, filters);
    return { success: true, data };
  }

  @Get("unread-count")
  async unreadCount(@CurrentUser() user: AuthUser) {
    const count = await this.notifications.unreadCount(user);
    return { success: true, data: { count } };
  }

  @Patch(":id/read")
  async markRead(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const data = await this.notifications.markRead(user, id);
    if (!data) {
      throw new HttpException(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Notification not found.", status: 404 },
        },
        404,
      );
    }
    return { success: true, data };
  }

  @Post("read-all")
  async markAllRead(@CurrentUser() user: AuthUser) {
    const count = await this.notifications.markAllRead(user);
    return { success: true, data: { count } };
  }
}
