import { HttpException } from "@nestjs/common";
import type { PlatformErrorBody, WallErrorCode } from "./platform-ops.types";

export class PlatformBlockedException extends HttpException {
  constructor(code: WallErrorCode, message: string, status = 402) {
    const body: PlatformErrorBody = {
      success: false,
      error: { code, message, status, supportable: true },
    };
    super(body, status);
  }
}

export function isPlatformBlockedError(
  error: unknown,
): error is PlatformBlockedException {
  return error instanceof PlatformBlockedException;
}

export function wallMessage(code: WallErrorCode): string {
  switch (code) {
    case "AI_BUDGET_UNSET":
      return "AI usage is not configured for your organisation. Contact Aquilens support to continue.";
    case "AI_BUDGET_EXCEEDED":
      return "Your organisation has reached its AI usage limit. Contact Aquilens support to continue.";
    case "FEATURE_DISABLED":
      return "This feature is not enabled for your organisation. Contact Aquilens support for help.";
    case "TENANT_SUSPENDED":
      return "Your organisation account is suspended. Contact Aquilens support for help.";
    default:
      return "This action is blocked. Contact Aquilens support for help.";
  }
}
