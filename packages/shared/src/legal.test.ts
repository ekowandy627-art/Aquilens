import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertSafeLabel,
  findForbiddenTermsInText,
  FORBIDDEN_UI_TERMS,
  LEGAL_DISCLAIMER,
} from "./legal.js";

describe("legal", () => {
  it("P12-U-01: LEGAL_DISCLAIMER is non-empty and substantive", () => {
    assert.ok(LEGAL_DISCLAIMER.length >= 200);
    assert.match(LEGAL_DISCLAIMER, /does not certify/i);
  });

  it("P12-U-02: assertSafeLabel rejects forbidden terms", () => {
    assert.throws(() => assertSafeLabel("You are certified"), /Forbidden/);
    assert.throws(() => assertSafeLabel("Fully compliant"), /Forbidden/);
    assert.doesNotThrow(() => assertSafeLabel("Ready for internal review"));
    assert.ok(FORBIDDEN_UI_TERMS.length >= 8);
  });

  it("findForbiddenTermsInText detects phrases", () => {
    const hits = findForbiddenTermsInText("This org is fully compliant today");
    assert.ok(hits.includes("compliant"));
  });
});
