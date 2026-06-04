import type { AuthUser, PermissionGrant } from "./auth.types";
import type { RequiredPermission } from "./require-permission.decorator";

export type ScopeRequestContext = {
  functionId?: string;
  createdBy?: string;
  resourceOwnerId?: string;
};

function grantsFor(
  user: AuthUser,
  resource: string,
  action: string,
) {
  return user.permissionGrants.filter(
    (grant) => grant.resource === resource && grant.action === action,
  );
}

export function hasPermissionGrant(
  user: AuthUser,
  resource: string,
  action: string,
) {
  if (user.permissions.includes("*")) {
    return true;
  }
  if (grantsFor(user, resource, action).length > 0) {
    return true;
  }
  return user.permissions.includes(`${resource}:${action}`);
}

export function resolveGrantScope(
  user: AuthUser,
  resource: string,
  action: string,
): PermissionGrant["scope"] | null {
  if (user.permissions.includes("*")) {
    return "global";
  }

  const grants = grantsFor(user, resource, action);

  if (grants.length > 0) {
    if (grants.some((grant) => grant.scope === "global")) {
      return "global";
    }
    if (grants.some((grant) => grant.scope === "function")) {
      return "function";
    }
    if (grants.some((grant) => grant.scope === "own")) {
      return "own";
    }
  }

  if (user.permissions.includes(`${resource}:${action}`)) {
    return "global";
  }

  return null;
}

export function assertScopedPermission(
  user: AuthUser,
  required: RequiredPermission,
  context: ScopeRequestContext = {},
) {
  if (!hasPermissionGrant(user, required.resource, required.action)) {
    return false;
  }

  const effectiveScope = required.scope ?? resolveGrantScope(
    user,
    required.resource,
    required.action,
  );

  if (!effectiveScope || effectiveScope === "global") {
    return true;
  }

  if (effectiveScope === "function") {
    const functionId = context.functionId;
    if (!functionId) {
      return true;
    }
    return user.assignedFunctionIds.includes(functionId);
  }

  if (effectiveScope === "own") {
    const ownerId =
      context.resourceOwnerId ?? context.createdBy ?? context.resourceOwnerId;
    if (!ownerId) {
      return true;
    }
    return ownerId === user.id;
  }

  return true;
}
