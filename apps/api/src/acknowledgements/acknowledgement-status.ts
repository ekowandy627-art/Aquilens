export type AssignmentStatus = "pending" | "completed" | "overdue";

export function computeAssignmentStatus(
  status: AssignmentStatus | "pending" | "completed",
  dueDate: string | null | undefined,
  now = new Date(),
): AssignmentStatus {
  if (status === "completed") {
    return "completed";
  }

  if (dueDate) {
    const due = new Date(`${dueDate}T23:59:59.999Z`);
    if (!Number.isNaN(due.getTime()) && due < now) {
      return "overdue";
    }
  }

  return "pending";
}

/** Percent of assignments with status `completed` (overdue/pending count as incomplete). */
export function completionRate(
  assignments: Array<{ status: AssignmentStatus | "pending" | "completed" }>,
) {
  if (assignments.length === 0) {
    return 0;
  }
  const completed = assignments.filter((row) => row.status === "completed").length;
  return Math.round((completed / assignments.length) * 100);
}
