import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      name: "Aquilens API",
      status: "ok",
      health: "/health",
      api: "/api/v1",
    };
  }

  @Get("health")
  health() {
    return { status: "ok" };
  }
}
