import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class InternalGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const secret = process.env.MANAGER_PLATFORM_SECRET?.trim();
    if (!secret) {
      throw new UnauthorizedException("Internal API is not configured");
    }

    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const auth = request.headers.authorization;
    const token = auth?.startsWith("Bearer ")
      ? auth.slice("Bearer ".length).trim()
      : null;

    if (!token || token !== secret) {
      throw new UnauthorizedException("Invalid internal credentials");
    }

    return true;
  }
}
