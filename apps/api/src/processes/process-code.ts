export function functionCodePart(name: string) {
  return name
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 4)
    .padEnd(4, "X");
}

export function areaCodePart(name: string) {
  const firstWord = name.trim().split(/\s+/)[0] ?? name;
  return firstWord
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 4)
    .padEnd(3, "X")
    .slice(0, 4);
}

export function generateProcessCode(
  functionName: string,
  areaName: string,
  sequence: number,
) {
  return `${functionCodePart(functionName)}-${areaCodePart(areaName)}-${String(sequence).padStart(3, "0")}`;
}
