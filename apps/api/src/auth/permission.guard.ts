import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  REQUIRED_PERMISSION_KEY,
  type RequiredPermission,
} from "./require-permission.decorator";
import type { AuthUser } from "./auth.types";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector = new Reflector()) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RequiredPermission>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const permissions = request.user?.permissions ?? [];
    const permissionKey = `${required.resource}:${required.action}`;

    if (permissions.includes("*") || permissions.includes(permissionKey)) {
      return true;
    }

    throw new ForbiddenException({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Insufficient permission.",
        status: 403,
      },
    });
  }
}
