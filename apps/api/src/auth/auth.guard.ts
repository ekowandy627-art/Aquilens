import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { AuthUser } from "./auth.types";
import { getSupabaseAdminClient } from "../supabase/admin-client";

type UserProfile = {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  status: string;
};

type UserRoleRow = {
  role_id: string;
};

type RoleRow = {
  id: string;
  name: string;
};

type RolePermissionRow = {
  scope: string;
  permissions: {
    resource: string;
    action: string;
  } | null;
};

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    const token = authorization.slice("Bearer ".length);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      request.user = {
        id: "user-gis-admin",
        tenantId: "tenant-gis",
        email: "gis-admin@aquilens.test",
        roles: ["Super Admin"],
        permissions: ["*"],
      };

      return true;
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid bearer token.",
          status: 401,
        },
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, tenant_id, email, full_name, status")
      .eq("id", authData.user.id)
      .maybeSingle<UserProfile>();

    if (profileError || !profile || profile.status !== "active") {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "No active Aquilens user profile exists for this account.",
          status: 401,
        },
      });
    }

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role_id")
      .eq("user_id", profile.id)
      .eq("tenant_id", profile.tenant_id)
      .returns<UserRoleRow[]>();

    const roleIds = (userRoles ?? []).map((role) => role.role_id);

    const { data: roles } =
      roleIds.length > 0
        ? await supabase
            .from("roles")
            .select("id, name")
            .in("id", roleIds)
            .returns<RoleRow[]>()
        : { data: [] };

    const { data: rolePermissions } =
      roleIds.length > 0
        ? await supabase
            .from("role_permissions")
            .select("scope, permissions(resource, action)")
            .in("role_id", roleIds)
            .returns<RolePermissionRow[]>()
        : { data: [] };

    const permissions = new Set<string>();

    for (const role of roles ?? []) {
      if (role.name === "Super Admin") {
        permissions.add("*");
      }
    }

    for (const rolePermission of rolePermissions ?? []) {
      if (rolePermission.permissions) {
        permissions.add(
          `${rolePermission.permissions.resource}:${rolePermission.permissions.action}`,
        );
      }
    }

    request.user = {
      id: profile.id,
      tenantId: profile.tenant_id,
      email: profile.email,
      roles: (roles ?? []).map((role) => role.name),
      permissions: [...permissions],
    };

    return true;
  }
}
