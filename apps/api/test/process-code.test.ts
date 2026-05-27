import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { areaCodePart, functionCodePart, generateProcessCode } from "../src/processes/process-code";

describe("process code generation", () => {
  it("builds ACAD-STUD-001 style codes", () => {
    assert.equal(functionCodePart("Academics"), "ACAD");
    assert.equal(areaCodePart("Student Records"), "STUD");
    assert.equal(generateProcessCode("Academics", "Student Records", 1), "ACAD-STUD-001");
  });

  it("increments the sequence suffix", () => {
    assert.equal(generateProcessCode("Admissions", "Enrolment", 12), "ADMI-ENRO-012");
  });
});
