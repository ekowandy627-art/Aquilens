#!/usr/bin/env node
/**
 * P12-W-02 — Fail CI if forbidden certification wording appears in user-facing web copy.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const WEB_SRC = join(process.cwd(), "apps/web/src");
const FORBIDDEN = [
  "compliant",
  "you are certified",
  "compliance dashboard",
  "guarantee compliance",
  "regulator-approved",
  "legally compliant",
  "iso-approved",
  "cqc-compliant",
  "fca-compliant",
];

const ALLOWLIST = [
  "demo-auth.ts",
  "dashboard.ts",
  "ComplianceDashboard",
  "compliance_officer",
  "role-gis-compliance",
  "gis-compliance@",
  "Compliance Officer",
  "Risk & Compliance",
  "Legal & Compliance",
];

const EXT = new Set([".tsx", ".ts"]);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules") continue;
      walk(full, files);
      continue;
    }
    if (EXT.has(entry.slice(entry.lastIndexOf(".")))) {
      files.push(full);
    }
  }
  return files;
}

function isAllowlisted(line) {
  return ALLOWLIST.some((token) => line.includes(token));
}

const violations = [];

for (const file of walk(WEB_SRC)) {
  const rel = relative(process.cwd(), file);
  const content = readFileSync(file, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, index) => {
    if (line.trim().startsWith("//") || line.includes("FORBIDDEN")) return;
    if (isAllowlisted(line)) return;
    const lower = line.toLowerCase();
    for (const term of FORBIDDEN) {
      if (lower.includes(term)) {
        violations.push({ file: rel, line: index + 1, term, snippet: line.trim().slice(0, 120) });
      }
    }
  });
}

if (violations.length > 0) {
  console.error("Forbidden product language found in apps/web/src:\n");
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} [${v.term}] ${v.snippet}`);
  }
  process.exit(1);
}

console.log("Product language check passed (apps/web/src).");
