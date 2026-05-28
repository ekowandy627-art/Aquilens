export class EvidenceError extends Error {
  constructor(
    readonly code:
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "EVIDENCE_REQUIRED"
      | "INVALID_UPLOAD"
      | "METHOD_NOT_ALLOWED",
    message: string,
  ) {
    super(message);
    this.name = "EvidenceError";
  }
}
