export type PermissionGrant = {
  resource: string;
  action: string;
  scope: "global" | "function" | "own";
};

export type AuthUser = {
  id: string;
  tenantId: string;
  email: string;
  roles: string[];
  /** Flat permission keys for backward-compatible checks. */
  permissions: string[];
  /** Scoped grants from role_permissions (Sprint 1). */
  permissionGrants: PermissionGrant[];
  /** Function IDs from user_roles.function_scope_id assignments. */
  assignedFunctionIds: string[];
};
