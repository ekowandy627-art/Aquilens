export const PLATFORM_ROLES = [
  "super_admin",
  "support",
  "billing",
  "library_curator",
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/** Legacy JWT value migrated to `support` in DB. */
export const LEGACY_SUPPORT_ROLE = "support_staff" as const;

export function normalizePlatformRole(role: string): PlatformRole | null {
  if (role === LEGACY_SUPPORT_ROLE) return "support";
  return PLATFORM_ROLES.includes(role as PlatformRole)
    ? (role as PlatformRole)
    : null;
}

export function isPlatformRole(role: string): role is PlatformRole {
  return normalizePlatformRole(role) !== null;
}
