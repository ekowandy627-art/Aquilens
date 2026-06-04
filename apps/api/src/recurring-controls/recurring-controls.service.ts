import { Injectable } from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types";
import {
  recurringControlsDemoStore,
  type VerificationStatus,
} from "./recurring-controls-demo.store";

@Injectable()
export class RecurringControlsService {
  list(user: AuthUser) {
    return recurringControlsDemoStore.list(user.tenantId);
  }

  create(
    user: AuthUser,
    input: {
      title: string;
      recordLocation: string;
      ownerId: string;
      frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annual";
      controlPointStepId?: string;
      processId?: string;
    },
  ) {
    return recurringControlsDemoStore.create({
      tenantId: user.tenantId,
      title: input.title.trim(),
      recordLocation: input.recordLocation.trim(),
      ownerId: input.ownerId,
      frequency: input.frequency,
      controlPointStepId: input.controlPointStepId,
      processId: input.processId,
    });
  }

  verify(user: AuthUser, id: string, status: VerificationStatus) {
    return recurringControlsDemoStore.updateVerification(user.tenantId, id, status);
  }
}
