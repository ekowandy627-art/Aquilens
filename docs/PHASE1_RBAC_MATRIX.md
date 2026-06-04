# Phase 1 RBAC matrix (Product Spec Sprint 1)

Scoped enforcement uses `role_permissions.scope` (`global` | `function` | `own`) plus `user_roles.function_scope_id` for function assignments.

## Permission guard

- `PermissionGuard` checks flat grants and scoped `permissionGrants` on `AuthUser`.
- `function` scope: request `functionId` (param, query, or body) must be in `assignedFunctionIds` when present.
- `own` scope: `createdBy` / `resourceOwnerId` must match the current user when present.
- List/detail filtering for processes uses `resolveProcessAccess()` with `functionId`.

## Demo users (GIS + manufacturing)

| Demo user | Tenant | Scoped grants |
|-----------|--------|----------------|
| `demo:user-gis-admin` | `tenant-gis` | `*` (global) |
| `demo:user-gis-compliance` | `tenant-gis` | `processes:read` global |
| `demo:user-gis-head` | `tenant-gis` | `processes:read`, `processes:approve` → **function** (`fn-school-academics`, `fn-school-admissions`) |
| `demo:user-gis-owner` | `tenant-gis` | Global process create/edit/publish |
| `demo:user-gis-staff` | `tenant-gis` | `processes:read` → **own** (viewer assignment or creator) |
| `demo:user-mfg-admin` | `tenant-mfg` | `*` |
| `demo:user-mfg-owner` | `tenant-mfg` | Global process owner |
| `demo:user-mfg-compliance` | `tenant-mfg` | Global read (audit/compliance) |
| `demo:user-mfg-staff` | `tenant-mfg` | `processes:read` → **own** |

## Process access (unchanged roles, tighter scope)

| Capability | Super Admin | Compliance | Dept Head (function) | Process Owner | Staff (own) |
|------------|:-----------:|:----------:|:--------------------:|:-------------:|:-----------:|
| List all processes | Yes | Yes | Assigned functions only | Yes (edit grants) | Own/assigned only |
| Create process | Yes | No | No* | Yes | No |
| Default process owner | — | — | — | **Creator** (not function owner) | — |

\* Dept Head approves within assigned functions; creation remains Process Owner / Admin.
