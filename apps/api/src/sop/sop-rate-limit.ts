const buckets = new Map<string, number[]>();
const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 60 * 1000;

export class SopRateLimiter {
  assertWithinLimit(userId: string) {
    const now = Date.now();
    const recent = (buckets.get(userId) ?? []).filter(
      (timestamp) => now - timestamp < WINDOW_MS,
    );

    if (recent.length >= MAX_REQUESTS) {
      const error = new Error("SOP generation rate limit exceeded.");
      (error as Error & { code: string }).code = "RATE_LIMITED";
      throw error;
    }

    recent.push(now);
    buckets.set(userId, recent);
  }

  reset(userId?: string) {
    if (userId) {
      buckets.delete(userId);
      return;
    }
    buckets.clear();
  }
}

export const sopRateLimiter = new SopRateLimiter();
