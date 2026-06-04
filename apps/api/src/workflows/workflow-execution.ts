export type WorkflowTaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "skipped"
  | "approved"
  | "rejected";

export class WorkflowExecutionError extends Error {
  constructor(
    readonly code:
      | "NOT_FOUND"
      | "INVALID_STATE"
      | "SEQUENCE_VIOLATION"
      | "FORBIDDEN"
      | "INVALID_TASK_TYPE"
      | "PROCESS_NOT_ACTIVE"
      | "WORKFLOW_CANCELLED"
      | "NOT_IMPLEMENTED"
      | "MANUAL_START_DISABLED",
    message: string,
  ) {
    super(message);
    this.name = "WorkflowExecutionError";
  }
}

export function isTaskDone(status: WorkflowTaskStatus) {
  return (
    status === "completed" ||
    status === "skipped" ||
    status === "approved" ||
    status === "rejected"
  );
}

export function assertPreviousTaskComplete<
  T extends { stepNumber: number; status: WorkflowTaskStatus },
>(tasks: T[], taskIndex: number) {
  if (taskIndex <= 0) {
    return;
  }

  const previous = tasks[taskIndex - 1];
  if (!previous || !isTaskDone(previous.status)) {
    throw new WorkflowExecutionError(
      "SEQUENCE_VIOLATION",
      `Task ${previous?.stepNumber ?? taskIndex} is not complete.`,
    );
  }
}

export function assertCanActOnTask(
  assignedTo: string | undefined,
  userId: string,
  permissions: string[],
) {
  if (permissions.includes("*")) {
    return;
  }

  if (assignedTo && assignedTo === userId) {
    return;
  }

  throw new WorkflowExecutionError(
    "FORBIDDEN",
    "You are not assigned to this task.",
  );
}

export function countCompletedTasks<
  T extends { status: WorkflowTaskStatus },
>(tasks: T[]) {
  return tasks.filter((task) => isTaskDone(task.status)).length;
}

export function allTasksDone<T extends { status: WorkflowTaskStatus }>(
  tasks: T[],
) {
  return tasks.length > 0 && tasks.every((task) => isTaskDone(task.status));
}
