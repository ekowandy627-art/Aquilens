export type ProcessStatus = "draft" | "under_review" | "active" | "retired";
export type VersionStatus =
  | "draft"
  | "under_review"
  | "active"
  | "superseded"
  | "rejected";

export class ProcessLifecycleError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function assertCanSubmit(processStatus: ProcessStatus, versionStatus: VersionStatus) {
  if (processStatus !== "draft" || versionStatus !== "draft") {
    throw new ProcessLifecycleError(
      "INVALID_TRANSITION",
      "Only draft processes can be submitted for approval.",
    );
  }
}

export function assertCanApprove(processStatus: ProcessStatus, versionStatus: VersionStatus) {
  if (processStatus !== "under_review" || versionStatus !== "under_review") {
    throw new ProcessLifecycleError(
      "INVALID_TRANSITION",
      "Only processes under review can be approved.",
    );
  }
}

export function assertCanReject(processStatus: ProcessStatus, versionStatus: VersionStatus) {
  if (processStatus !== "under_review" || versionStatus !== "under_review") {
    throw new ProcessLifecycleError(
      "INVALID_TRANSITION",
      "Only processes under review can be rejected.",
    );
  }
}

export function assertCanCreateVersion(processStatus: ProcessStatus) {
  if (processStatus !== "active") {
    throw new ProcessLifecycleError(
      "INVALID_TRANSITION",
      "New versions can only be created from active processes.",
    );
  }
}

export function assertProcessEditable(processStatus: ProcessStatus, versionStatus: VersionStatus) {
  if (processStatus === "active" || processStatus === "retired") {
    throw new ProcessLifecycleError(
      "PROCESS_LOCKED",
      "Active processes cannot be edited directly. Create a new version instead.",
    );
  }
  if (processStatus === "under_review" || versionStatus === "under_review") {
    throw new ProcessLifecycleError(
      "PROCESS_LOCKED",
      "Processes under review cannot be edited.",
    );
  }
}

export function canEditProcess(processStatus: ProcessStatus, versionStatus: VersionStatus) {
  try {
    assertProcessEditable(processStatus, versionStatus);
    return true;
  } catch {
    return false;
  }
}
