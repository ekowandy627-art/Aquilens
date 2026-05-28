export type ProcessParticipant = {
  role: string;
  userId?: string;
};

export function parseParticipants(value: unknown): ProcessParticipant[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const parsed: ProcessParticipant[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const role = "role" in item && typeof item.role === "string" ? item.role.trim() : "";
    if (!role) {
      continue;
    }

    const userId =
      "userId" in item && typeof item.userId === "string" && item.userId.trim()
        ? item.userId.trim()
        : undefined;

    parsed.push({ role, userId });
  }

  return parsed;
}

export function assertValidParticipants(value: unknown) {
  if (value === undefined || value === null) {
    return;
  }

  if (!Array.isArray(value)) {
    throw new Error("Participants must be an array.");
  }

  for (const item of value) {
    if (!item || typeof item !== "object") {
      throw new Error("Each participant must be an object with a role.");
    }
    const role = "role" in item && typeof item.role === "string" ? item.role.trim() : "";
    if (!role) {
      throw new Error("Each participant requires a role.");
    }
  }
}
