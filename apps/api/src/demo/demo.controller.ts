import {
  Controller,
  ForbiddenException,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthUser } from "../auth/auth.types";
import { isDemoSeedUser } from "./demo-data-mode";
import { resetGisDemoStores } from "./reset-gis-demo";

@Controller("api/v1/demo")
@UseGuards(AuthGuard)
export class DemoController {
  @Post("reset-gis")
  resetGis(@Req() request: { user: AuthUser }) {
    if (process.env.ALLOW_DEMO_BEARER !== "true") {
      throw new ForbiddenException({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "GIS demo reset is disabled.",
          status: 403,
        },
      });
    }

    if (!isDemoSeedUser(request.user)) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "GIS demo reset requires a demo session.",
          status: 403,
        },
      });
    }

    return { success: true, data: resetGisDemoStores() };
  }
}
