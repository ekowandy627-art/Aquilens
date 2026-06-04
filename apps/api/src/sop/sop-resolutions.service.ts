import { Injectable } from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types";
import { getSupabaseForUser } from "../demo/demo-data-mode";
import type { SaveResolutionInput, SopResolutionRecord } from "./sop-compose.types";
import {
  listSopResolutions,
  saveSopResolution,
} from "./sop-resolutions.store";

@Injectable()
export class SopResolutionsService {
  save(user: AuthUser, input: SaveResolutionInput): SopResolutionRecord {
    const supabase = getSupabaseForUser(user);
    if (!supabase) {
      return saveSopResolution(user.tenantId, user.id, input);
    }

    return saveSopResolution(user.tenantId, user.id, input);
  }

  list(
    user: AuthUser,
    filter?: { processId?: string; draftHash?: string },
  ): SopResolutionRecord[] {
    const supabase = getSupabaseForUser(user);
    if (!supabase) {
      return listSopResolutions(user.tenantId, filter);
    }

    return listSopResolutions(user.tenantId, filter);
  }
}
