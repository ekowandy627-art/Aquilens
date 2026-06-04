export type PlatformWallError = {
  code?: string;
  message?: string;
  status?: number;
  supportable?: boolean;
};

export function parsePlatformErrorBody(body: unknown): PlatformWallError | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const record = body as { error?: PlatformWallError; success?: boolean };
  return record.error ?? null;
}

export function isWallHitError(error: PlatformWallError | null) {
  if (!error?.code) {
    return false;
  }
  return [
    "AI_BUDGET_UNSET",
    "AI_BUDGET_EXCEEDED",
    "FEATURE_DISABLED",
    "TENANT_SUSPENDED",
  ].includes(error.code);
}

export function wallSupportMessage(error: PlatformWallError | null) {
  return (
    error?.message ??
    "This action is blocked. Contact Aquilens support to continue."
  );
}

export async function handleBlockedResponse(response: Response) {
  const body = (await response.json().catch(() => null)) as
    | { success?: boolean; error?: PlatformWallError }
    | null;
  const error = parsePlatformErrorBody(body);
  if (isWallHitError(error)) {
    return { blocked: true as const, error: error! };
  }
  return { blocked: false as const, error, body };
}
