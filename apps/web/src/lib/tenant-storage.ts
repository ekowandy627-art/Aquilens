"use client";

import {
  defaultTenantProfile,
  type FunctionNode,
  type InstitutionType,
  type TenantProfile,
} from "@/lib/scaffolds";

const STORAGE_KEY = "aquilens.tenant-profile.v1";

export function loadTenantProfile(): TenantProfile {
  if (typeof window === "undefined") {
    return defaultTenantProfile;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return defaultTenantProfile;
  }

  try {
    return JSON.parse(stored) as TenantProfile;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return defaultTenantProfile;
  }
}

export function saveTenantProfile(profile: TenantProfile) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function createTenantProfile(input: {
  name: string;
  institutionType: InstitutionType;
  country: string;
  functions: FunctionNode[];
}): TenantProfile {
  return {
    ...input,
    onboardingComplete: true,
  };
}
