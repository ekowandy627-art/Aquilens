import type { AuthUser } from "../auth/auth.types";
import {
  hasPermissionGrant,
  resolveGrantScope,
} from "../auth/permission-scopes";
import type { ProcessPersonRole } from "./execution-schedule";

export type ProcessPersonAssignment = {
  userId?: string;
  role: ProcessPersonRole;
};

export type ProcessAccess = {
  processRole?: ProcessPersonRole;
  canView: boolean;
  canEdit: boolean;
  canManagePeople: boolean;
};

export function hasGlobalProcessRead(user: AuthUser) {
  if (user.permissions.includes("*")) {
    return true;
  }

  if (user.permissions.includes("audit:read")) {
    return true;
  }

  if (
    user.permissions.includes("processes:create") ||
    user.permissions.includes("processes:edit")
  ) {
    return true;
  }

  if (resolveGrantScope(user, "processes", "read") === "global") {
    return true;
  }

  return false;
}

export function canReadProcessViaFunctionScope(
  user: AuthUser,
  functionId: string,
) {
  if (resolveGrantScope(user, "processes", "read") !== "function") {
    return false;
  }
  return user.assignedFunctionIds.includes(functionId);
}

export function isStaffOnlyReader(user: AuthUser) {
  if (user.permissions.includes("*")) {
    return false;
  }

  return (
    hasPermissionGrant(user, "processes", "read") &&
    !user.permissions.includes("processes:create") &&
    !user.permissions.includes("processes:edit") &&
    !user.permissions.includes("audit:read") &&
    !hasPermissionGrant(user, "audit", "read")
  );
}

export function resolveProcessAccess(
  user: AuthUser,
  people: ProcessPersonAssignment[],
  createdBy?: string,
  functionId?: string,
): ProcessAccess {
  if (user.permissions.includes("*")) {
    return {
      processRole: "owner",
      canView: true,
      canEdit: true,
      canManagePeople: true,
    };
  }

  const assignment = people.find((person) => person.userId === user.id);
  const processRole = assignment?.role;

  const canView =
    hasGlobalProcessRead(user) ||
    Boolean(processRole) ||
    createdBy === user.id ||
    (functionId ? canReadProcessViaFunctionScope(user, functionId) : false);

  const canEdit =
    user.permissions.includes("processes:edit") &&
    (processRole === "owner" ||
      processRole === "editor" ||
      (!processRole && createdBy === user.id));

  const canManagePeople =
    user.permissions.includes("*") ||
    processRole === "owner" ||
    (user.permissions.includes("processes:edit") &&
      createdBy === user.id &&
      !people.some((person) => person.role === "owner"));

  return {
    processRole,
    canView,
    canEdit,
    canManagePeople,
  };
}

export function canAssignProcessPeople(user: AuthUser, access: ProcessAccess) {
  return user.permissions.includes("*") || access.canManagePeople;
}

export function assertProcessView(access: ProcessAccess) {
  if (!access.canView) {
    throw new ProcessAccessError("FORBIDDEN", "You do not have access to this process.");
  }
}

export function assertProcessEdit(access: ProcessAccess) {
  if (!access.canEdit) {
    throw new ProcessAccessError(
      "FORBIDDEN",
      "You do not have edit access to this process.",
    );
  }
}

export function assertProcessPeopleManagement(
  user: AuthUser,
  access: ProcessAccess,
) {
  if (!canAssignProcessPeople(user, access)) {
    throw new ProcessAccessError(
      "FORBIDDEN",
      "Only the process owner can assign editors and viewers.",
    );
  }
}

export function validatePeopleAssignments(
  entries: ProcessPersonAssignment[],
  actorUserId: string,
  isSuperAdmin = false,
) {
  const owners = entries.filter((entry) => entry.role === "owner");

  if (owners.length !== 1) {
    throw new ProcessAccessError(
      "INVALID_PEOPLE",
      "Exactly one process owner is required.",
    );
  }

  if (!isSuperAdmin && owners[0]?.userId !== actorUserId) {
    throw new ProcessAccessError(
      "FORBIDDEN",
      "You cannot reassign process ownership.",
    );
  }

  for (const entry of entries) {
    if (!entry.userId) {
      throw new ProcessAccessError(
        "INVALID_PEOPLE",
        "Every person assignment requires a user.",
      );
    }
  }
}

export class ProcessAccessError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
