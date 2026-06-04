import {
  evidenceMapFromLegacy,
  isEvidenceMapComplete,
  normalizeEvidenceMap,
  type EvidenceMap,
} from "@aquilens/shared";

export function syncStepControlFields(input: {
  isControlPoint?: boolean;
  evidenceRequired?: boolean;
  evidenceMap?: EvidenceMap | Record<string, unknown>;
}) {
  const isControlPoint =
    input.isControlPoint ?? input.evidenceRequired ?? false;
  let evidenceMap = normalizeEvidenceMap(input.evidenceMap ?? {});

  if (isControlPoint && !evidenceMap.mode) {
    evidenceMap = evidenceMapFromLegacy(true);
  }
  if (!isControlPoint) {
    evidenceMap = {};
  }

  return {
    isControlPoint,
    evidenceRequired: isControlPoint,
    evidenceMap,
    evidenceMapComplete: isControlPoint
      ? isEvidenceMapComplete(evidenceMap)
      : true,
  };
}

export type LifecycleSpineStageId =
  | "draft"
  | "under_review"
  | "active"
  | "training_active"
  | "audit_ready";

export type LifecycleSpineStage = {
  id: LifecycleSpineStageId;
  label: string;
  status: "complete" | "current" | "upcoming";
};

export function buildLifecycleSpine(input: {
  processStatus: string;
  versionStatus: string;
  acknowledgementRequired?: boolean;
  controlPointsComplete: boolean;
  reviewOverdue?: boolean;
}) {
  const stages: Array<{ id: LifecycleSpineStageId; label: string }> = [
    { id: "draft", label: "Draft" },
    { id: "under_review", label: "Under review" },
    { id: "active", label: "Active" },
    { id: "training_active", label: "Training active" },
    { id: "audit_ready", label: "Audit-ready" },
  ];

  let currentIndex = 0;
  if (
    input.processStatus === "under_review" ||
    input.versionStatus === "under_review"
  ) {
    currentIndex = 1;
  } else if (
    input.versionStatus === "approved" ||
    input.versionStatus === "active" ||
    input.processStatus === "active"
  ) {
    currentIndex = 2;
    if (input.acknowledgementRequired) {
      currentIndex = 3;
    }
    if (
      input.controlPointsComplete &&
      !input.reviewOverdue &&
      input.processStatus === "active"
    ) {
      currentIndex = 4;
    }
  }

  return stages.map((stage, index) => ({
    ...stage,
    status:
      index < currentIndex
        ? ("complete" as const)
        : index === currentIndex
          ? ("current" as const)
          : ("upcoming" as const),
  }));
}
