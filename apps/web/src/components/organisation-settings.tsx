"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  institutionTypeLabels,
  type InstitutionType,
  type TenantProfile,
} from "@/lib/scaffolds";
import {
  loadTenantProfile,
  loadTenantProfileFromApi,
  saveTenantProfileToApi,
} from "@/lib/tenant-storage";

export function OrganisationSettings() {
  const [profile, setProfile] = useState<TenantProfile>(() =>
    loadTenantProfile(),
  );
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    loadTenantProfileFromApi()
      .then((loaded) => {
        if (active) {
          setProfile(loaded);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function update(nextProfile: TenantProfile) {
    setProfile(nextProfile);
    setSaved(false);
  }

  async function save() {
    setLoading(true);
    const savedProfile = await saveTenantProfileToApi(profile);
    setProfile(savedProfile);
    setSaved(true);
    setLoading(false);
  }

  return (
    <>
      <PageHeader
        title="Organisation"
        description="Institution profile and tenant setup details used across the app shell."
        action={
          <Button type="button" onClick={() => void save()} disabled={loading}>
            <Save className="size-4" aria-hidden="true" />
            {loading ? "Saving..." : "Save changes"}
          </Button>
        }
      />

      <section className="rounded-md border border-border bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Institution name
            </span>
            <input
              value={profile.name}
              onChange={(event) =>
                update({ ...profile, name: event.target.value })
              }
              className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Institution type
            </span>
            <select
              value={profile.institutionType}
              onChange={(event) =>
                update({
                  ...profile,
                  institutionType: event.target.value as InstitutionType,
                })
              }
              className="mt-1 h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
            >
              {Object.entries(institutionTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Country</span>
            <input
              value={profile.country}
              onChange={(event) =>
                update({ ...profile, country: event.target.value })
              }
              className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
            />
          </label>
        </div>

        <p className="mt-5 text-sm text-text-muted">
          {saved
            ? "Changes saved to the tenant profile."
            : "Changes will update the live tenant profile and audit log."}
        </p>
      </section>
    </>
  );
}
