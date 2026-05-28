export function generateAgentCode(sequence: number): string {
  return `AI-${String(sequence).padStart(3, "0")}`;
}

export function nextAgentSequence(existingCodes: string[]): number {
  const numbers = existingCodes
    .map((code) => /^AI-(\d+)$/i.exec(code)?.[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => Number.parseInt(value, 10));

  if (numbers.length === 0) {
    return 1;
  }

  return Math.max(...numbers) + 1;
}
