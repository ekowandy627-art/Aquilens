/** Auth/session telemetry is stored separately from tenant operational audit trails. */
const AUTH_EVENT_PREFIX = "auth.";

export function isOperationalAuditEvent(eventType: string) {
  return !eventType.startsWith(AUTH_EVENT_PREFIX);
}
