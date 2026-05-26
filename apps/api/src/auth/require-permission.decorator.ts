import { SetMetadata } from "@nestjs/common";

export const REQUIRED_PERMISSION_KEY = "requiredPermission";

export type RequiredPermission = {
  resource: string;
  action: string;
  scope?: "global" | "function" | "own";
};

export function RequirePermission(
  resource: string,
  action: string,
  scope: RequiredPermission["scope"] = "global",
) {
  return SetMetadata(REQUIRED_PERMISSION_KEY, { resource, action, scope });
}
