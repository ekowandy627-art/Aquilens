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
import { assertScopedPermission } from "./permission-scopes";

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

    const request = context.switchToHttp().getRequest<{
      user?: AuthUser;
      params?: Record<string, string>;
      query?: Record<string, string>;
      body?: Record<string, unknown>;
    }>();

    const user = request.user;
    if (!user) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Authentication required.",
          status: 403,
        },
      });
    }

    const scopeContext = {
      functionId:
        (request.params?.functionId as string | undefined) ??
        (request.query?.functionId as string | undefined) ??
        (request.body?.functionId as string | undefined),
      createdBy: request.body?.createdBy as string | undefined,
      resourceOwnerId: request.body?.ownerId as string | undefined,
    };

    if (assertScopedPermission(user, required, scopeContext)) {
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
