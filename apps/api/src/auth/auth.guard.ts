import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { AuthUser } from "./auth.types";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: AuthUser;
    }>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing bearer token.",
          status: 401,
        },
      });
    }

    // Phase 1 local stub: real Supabase JWT verification is wired once
    // SUPABASE_JWT_SECRET is present in the deployment environment.
    request.user = {
      id: "user-gis-admin",
      tenantId: "tenant-gis",
      email: "gis-admin@aquilens.test",
      roles: ["Super Admin"],
      permissions: ["*"],
    };

    return true;
  }
}
