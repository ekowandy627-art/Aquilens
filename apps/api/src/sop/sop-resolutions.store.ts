import { randomUUID } from "crypto";
import type { SaveResolutionInput, SopResolutionRecord } from "./sop-compose.types";

const store = new Map<string, SopResolutionRecord[]>();

export function resetSopResolutionsStore() {
  store.clear();
}

export function listSopResolutions(
  tenantId: string,
  filter?: { processId?: string; draftHash?: string },
) {
  const rows = store.get(tenantId) ?? [];
  return rows.filter((row) => {
    if (filter?.processId && row.processId !== filter.processId) {
      return false;
    }
    if (filter?.draftHash && row.draftHash !== filter.draftHash) {
      return false;
    }
    return true;
  });
}

export function saveSopResolution(
  tenantId: string,
  userId: string,
  input: SaveResolutionInput,
): SopResolutionRecord {
  const rows = store.get(tenantId) ?? [];
  const record: SopResolutionRecord = {
    id: randomUUID(),
    sourceArtifactId: input.sourceArtifactId,
    field: input.field,
    chosenValue: input.chosenValue,
    processId: input.processId,
    draftHash: input.draftHash,
    createdAt: new Date().toISOString(),
  };
  rows.push(record);
  store.set(tenantId, rows);
  return record;
}
