export function isReviewOverdue(reviewDueDate: string | null | undefined, today = new Date()) {
  if (!reviewDueDate) {
    return false;
  }

  const due = new Date(`${reviewDueDate}T00:00:00.000Z`);
  if (Number.isNaN(due.getTime())) {
    return false;
  }

  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  return due.getTime() < todayUtc.getTime();
}
