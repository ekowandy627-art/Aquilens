import { Injectable } from "@nestjs/common";
import type { OrganisationProfile } from "./guidance.types";

export type RecommendationInput = {
  organisationType?: string;
  country?: string;
  certificationTargets?: string[];
};

const BASE_SLUGS = ["universal-sop-control"];

const RULES: Array<{
  match: (input: RecommendationInput) => boolean;
  slugs: string[];
}> = [
  {
    match: (input) => input.organisationType === "school",
    slugs: ["school-operations", "iso-45001-hse", "iso-27001-security"],
  },
  {
    match: (input) => input.organisationType === "hospital" || input.organisationType === "healthcare",
    slugs: ["health-and-care", "iso-27001-security", "iso-45001-hse"],
  },
  {
    match: (input) =>
      input.organisationType === "manufacturing" ||
      input.organisationType === "corporate",
    slugs: ["iso-9001-quality", "iso-45001-hse", "iso-27001-security"],
  },
  {
    match: (input) => input.organisationType === "financial_services",
    slugs: ["iso-27001-security", "iso-9001-quality"],
  },
  {
    match: (input) =>
      (input.country ?? "").toLowerCase() === "ghana" &&
      input.organisationType === "school",
    slugs: ["school-operations"],
  },
  {
    match: (input) =>
      (input.certificationTargets ?? []).some((target) =>
        target.toLowerCase().includes("iso 9001"),
      ),
    slugs: ["iso-9001-quality"],
  },
  {
    match: (input) =>
      (input.certificationTargets ?? []).some((target) =>
        target.toLowerCase().includes("27001"),
      ),
    slugs: ["iso-27001-security"],
  },
];

@Injectable()
export class StandardsRecommendationService {
  recommendPackSlugs(input: RecommendationInput) {
    const slugs = new Set<string>(BASE_SLUGS);

    for (const rule of RULES) {
      if (rule.match(input)) {
        for (const slug of rule.slugs) {
          slugs.add(slug);
        }
      }
    }

    return [...slugs];
  }

  recommendFromProfile(profile: OrganisationProfile, institutionType?: string) {
    return this.recommendPackSlugs({
      organisationType: profile.organisationType ?? institutionType,
      country: profile.countries?.[0],
      certificationTargets: profile.certificationTargets,
    });
  }
}
