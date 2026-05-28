import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { StandardsRecommendationService } from "../src/standards/standards-recommendation.service";
import { GUIDANCE_SELECTION_VALUES } from "@aquilens/shared";

describe("standards recommendation unit tests", () => {
  const service = new StandardsRecommendationService();

  it("P14-U-01: school in Ghana includes school-operations", () => {
    const slugs = service.recommendPackSlugs({
      organisationType: "school",
      country: "Ghana",
    });
    assert.ok(slugs.includes("school-operations"));
    assert.ok(slugs.includes("universal-sop-control"));
  });

  it("P14-U-02: manufacturing includes iso-9001-quality", () => {
    const slugs = service.recommendPackSlugs({
      organisationType: "manufacturing",
    });
    assert.ok(slugs.includes("iso-9001-quality"));
  });

  it("P14-U-03: recommendations return summaries not full standard text", () => {
    const slugs = service.recommendPackSlugs({
      organisationType: "school",
      certificationTargets: ["ISO 9001"],
    });
    assert.equal(
      slugs.some((slug) => slug.includes("full-text")),
      false,
    );
  });

  it("P14-U-04: selection status enum is stable", () => {
    assert.ok(GUIDANCE_SELECTION_VALUES.includes("align"));
    assert.ok(GUIDANCE_SELECTION_VALUES.includes("deferred"));
    assert.equal(GUIDANCE_SELECTION_VALUES.length, 5);
  });
});
