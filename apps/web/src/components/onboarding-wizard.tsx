"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createId,
  createScaffold,
  institutionTypeLabels,
  type FunctionNode,
  type InstitutionType,
} from "@/lib/scaffolds";
import { LegalDisclaimer } from "@/components/legal-disclaimer";
import {
  createTenantProfile,
  saveTenantProfile,
  saveTenantProfileToApi,
} from "@/lib/tenant-storage";
import { GuidanceSelectionPanel } from "@/components/guidance/guidance-selection-panel";
import {
  getGuidanceRecommendations,
  listGuidancePacks,
  saveGuidanceSelections,
  saveOrganisationProfile,
  type GuidanceRecommendation,
} from "@/lib/guidance";
import {
  JURISDICTION_LABELS,
  JURISDICTION_TAXONOMY,
  type GuidanceSelectionStatus,
  type JurisdictionCode,
} from "@aquilens/shared";

const steps = ["Institution", "Standards", "Review", "Edit", "Confirm", "Done"];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("Ghana International School");
  const [country, setCountry] = useState("Ghana");
  const [operatingJurisdictions, setOperatingJurisdictions] = useState<
    JurisdictionCode[]
  >(["ghana"]);
  const [outputMarketJurisdictions, setOutputMarketJurisdictions] = useState<
    JurisdictionCode[]
  >(["ghana", "uk"]);
  const [institutionType, setInstitutionType] =
    useState<InstitutionType>("school");
  const [functions, setFunctions] = useState<FunctionNode[]>(
    createScaffold("school"),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<GuidanceRecommendation[]>(
    [],
  );
  const [packIdsBySlug, setPackIdsBySlug] = useState<Record<string, string>>({});
  const [pendingGuidanceSelections, setPendingGuidanceSelections] = useState<
    Array<{ packId: string; selectionStatus: GuidanceSelectionStatus }>
  >([]);
  const [standardsReady, setStandardsReady] = useState(false);

  useEffect(() => {
    if (step !== 1 || recommendations.length > 0) {
      return;
    }

    void (async () => {
      try {
        const [packs, recs] = await Promise.all([
          listGuidancePacks(),
          getGuidanceRecommendations({
            organisationType: institutionType,
            country,
          }),
        ]);
        setPackIdsBySlug(Object.fromEntries(packs.map((pack) => [pack.slug, pack.id])));
        setRecommendations(recs);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load guidance recommendations",
        );
      }
    })();
  }, [step, recommendations.length, institutionType, country]);

  const totalAreas = useMemo(
    () => functions.reduce((total, fn) => total + fn.areas.length, 0),
    [functions],
  );

  function changeInstitutionType(nextType: InstitutionType) {
    setInstitutionType(nextType);
    setFunctions(createScaffold(nextType));
  }

  function toggleJurisdiction(
    list: JurisdictionCode[],
    setList: (next: JurisdictionCode[]) => void,
    code: JurisdictionCode,
  ) {
    if (list.includes(code)) {
      setList(list.filter((item) => item !== code));
      return;
    }
    setList([...list, code]);
  }

  function updateFunctionName(functionId: string, nextName: string) {
    setFunctions((current) =>
      current.map((fn) =>
        fn.id === functionId ? { ...fn, name: nextName } : fn,
      ),
    );
  }

  function updateFunctionDescription(functionId: string, nextDescription: string) {
    setFunctions((current) =>
      current.map((fn) =>
        fn.id === functionId
          ? { ...fn, description: nextDescription || undefined }
          : fn,
      ),
    );
  }

  function updateAreaName(
    functionId: string,
    areaId: string,
    nextName: string,
  ) {
    setFunctions((current) =>
      current.map((fn) =>
        fn.id === functionId
          ? {
              ...fn,
              areas: fn.areas.map((area) =>
                area.id === areaId ? { ...area, name: nextName } : area,
              ),
            }
          : fn,
      ),
    );
  }

  function addFunction() {
    setFunctions((current) => [
      ...current,
      {
        id: createId("fn"),
        name: "New Function",
        areas: [],
      },
    ]);
  }

  function removeFunction(functionId: string) {
    setFunctions((current) => current.filter((fn) => fn.id !== functionId));
  }

  function addArea(functionId: string) {
    setFunctions((current) =>
      current.map((fn) =>
        fn.id === functionId
          ? {
              ...fn,
              areas: [
                ...fn.areas,
                {
                  id: createId("area"),
                  name: "New Process Area",
                },
              ],
            }
          : fn,
      ),
    );
  }

  function removeArea(functionId: string, areaId: string) {
    setFunctions((current) =>
      current.map((fn) =>
        fn.id === functionId
          ? {
              ...fn,
              areas: fn.areas.filter((area) => area.id !== areaId),
            }
          : fn,
      ),
    );
  }

  async function continueFromStep() {
    if (step === 1) {
      setSaving(true);
      setError(null);
      try {
        await saveOrganisationProfile({
          organisationType: institutionType,
          countries: [country],
          operatingJurisdictions,
          outputMarketJurisdictions,
        });
        await saveGuidanceSelections(pendingGuidanceSelections);
        setStep(2);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save guidance");
      } finally {
        setSaving(false);
      }
      return;
    }

    setStep((current) => current + 1);
  }

  async function finish() {
    setSaving(true);
    setError(null);

    const profile = createTenantProfile({
      name,
      country,
      institutionType,
      operatingJurisdictions,
      outputMarketJurisdictions,
      functions,
    });

    try {
      saveTenantProfile(profile);
      await saveTenantProfileToApi(profile);
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save scaffold");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-2">
        {steps.map((label, index) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={
                index <= step
                  ? "grid size-8 place-items-center rounded-full bg-brand-teal text-xs font-semibold text-white"
                  : "grid size-8 place-items-center rounded-full border border-border bg-white text-xs font-semibold text-slate-500"
              }
            >
              {index < step ? <Check className="size-4" /> : index + 1}
            </div>
            <span className="hidden text-sm font-medium text-slate-700 md:inline">
              {label}
            </span>
            {index < steps.length - 1 && (
              <div className="h-px w-6 bg-border md:w-10" />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-md border border-border bg-white p-6">
        {step === 0 && (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div>
              <div className="grid size-11 place-items-center rounded-md bg-teal-50 text-brand-teal">
                <Building2 className="size-5" aria-hidden="true" />
              </div>
              <h1 className="mt-5 text-2xl font-semibold tracking-normal text-slate-950">
                Set up your institution
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
                Choose the institution type and Aquilens will prepare a default
                function tree you can edit before confirming.
              </p>

              <div className="mt-6 grid gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Institution name
                  </span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Institution type
                  </span>
                  <select
                    value={institutionType}
                    onChange={(event) =>
                      changeInstitutionType(
                        event.target.value as InstitutionType,
                      )
                    }
                    className="mt-1 h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                  >
                    {Object.entries(institutionTypeLabels).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Country
                  </span>
                  <input
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm"
                  />
                </label>

                <fieldset>
                  <legend className="text-sm font-medium text-slate-700">
                    Operating jurisdictions
                  </legend>
                  <p className="mt-1 text-xs text-text-muted">
                    Where your organisation operates and is regulated.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {JURISDICTION_TAXONOMY.map((code) => (
                      <button
                        key={`op-${code}`}
                        type="button"
                        data-testid={`jurisdiction-operating-${code}`}
                        onClick={() =>
                          toggleJurisdiction(
                            operatingJurisdictions,
                            setOperatingJurisdictions,
                            code,
                          )
                        }
                        className={`rounded-full px-3 py-1 text-xs ${
                          operatingJurisdictions.includes(code)
                            ? "bg-brand-teal text-white"
                            : "border border-border bg-white text-slate-700"
                        }`}
                      >
                        {JURISDICTION_LABELS[code]}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-sm font-medium text-slate-700">
                    Output-market jurisdictions
                  </legend>
                  <p className="mt-1 text-xs text-text-muted">
                    Where products or services are sold or delivered.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {JURISDICTION_TAXONOMY.map((code) => (
                      <button
                        key={`out-${code}`}
                        type="button"
                        data-testid={`jurisdiction-output-${code}`}
                        onClick={() =>
                          toggleJurisdiction(
                            outputMarketJurisdictions,
                            setOutputMarketJurisdictions,
                            code,
                          )
                        }
                        className={`rounded-full px-3 py-1 text-xs ${
                          outputMarketJurisdictions.includes(code)
                            ? "bg-brand-teal text-white"
                            : "border border-border bg-white text-slate-700"
                        }`}
                      >
                        {JURISDICTION_LABELS[code]}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
            </div>

            <aside className="rounded-md border border-border bg-surface-bg p-4">
              <p className="text-sm font-semibold text-slate-950">
                Scaffold preview
              </p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">Functions</dt>
                  <dd className="font-semibold text-slate-950">
                    {functions.length}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">Process areas</dt>
                  <dd className="font-semibold text-slate-950">{totalAreas}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">Template</dt>
                  <dd className="font-semibold text-slate-950">
                    {institutionTypeLabels[institutionType]}
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        )}

        {step === 1 && (
          <GuidanceSelectionPanel
            relevanceOnly
            recommendations={recommendations}
            packIdsBySlug={packIdsBySlug}
            onChange={(rows) => {
              setPendingGuidanceSelections(
                rows
                  .filter((row) => row.selectionStatus && row.packId)
                  .map((row) => ({
                    packId: row.packId,
                    selectionStatus: row.selectionStatus as GuidanceSelectionStatus,
                  })),
              );
            }}
            onReadyChange={setStandardsReady}
          />
        )}

        {step === 2 && (
          <ScaffoldSummary
            title={`${institutionTypeLabels[institutionType]} scaffold`}
            description="Review the default structure before editing. Everything can be changed now or later from Settings."
            functions={functions}
          />
        )}

        {step === 3 && (
          <ScaffoldEditor
            functions={functions}
            onAddFunction={addFunction}
            onRemoveFunction={removeFunction}
            onUpdateFunctionName={updateFunctionName}
            onUpdateFunctionDescription={updateFunctionDescription}
            onAddArea={addArea}
            onRemoveArea={removeArea}
            onUpdateAreaName={updateAreaName}
          />
        )}

        {step === 4 && (
          <>
            <ScaffoldSummary
              title="Confirm setup"
              description={`${name} will start with ${functions.length} functions and ${totalAreas} process areas. You can refine this structure after onboarding.`}
              functions={functions}
            />
            <LegalDisclaimer className="mt-6" compact />
          </>
        )}

        {step === 5 && (
          <div className="py-10 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-teal-50 text-brand-teal">
              <Check className="size-5" aria-hidden="true" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-normal text-slate-950">
              Institution scaffold created
            </h1>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-muted">
              Your function tree is ready. Next you can review it in Settings
              or begin adding processes under each process area.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/settings/structure")}
              >
                Review structure
              </Button>
              <Button type="button" onClick={() => router.push("/dashboard")}>
                Go to dashboard
              </Button>
            </div>
          </div>
        )}

        {error && <p className="mt-5 text-sm text-red-600">{error}</p>}

        {step < 5 && (
          <div className="mt-8 flex justify-between border-t border-border pt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              disabled={step === 0}
            >
              Back
            </Button>
            {step === 4 ? (
              <Button type="button" onClick={() => void finish()} disabled={saving}>
                {saving ? "Saving..." : "Confirm scaffold"}
              </Button>
            ) : (
              <Button
                type="button"
                data-testid="onboarding-continue"
                onClick={() => void continueFromStep()}
                disabled={
                  step === 0
                    ? !name.trim() || !country.trim()
                    : step === 1
                      ? !standardsReady || pendingGuidanceSelections.length < 3
                      : false
                }
              >
                Continue
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ScaffoldSummary({
  title,
  description,
  functions,
}: {
  title: string;
  description: string;
  functions: FunctionNode[];
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
        {description}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {functions.map((fn) => (
          <article key={fn.id} className="rounded-md border border-border p-4">
            <h2 className="text-sm font-semibold text-slate-950">{fn.name}</h2>
            {fn.description ? (
              <p className="mt-2 text-sm leading-6 text-text-muted">
                {fn.description}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {fn.areas.map((area) => (
                <span
                  key={area.id}
                  className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                >
                  {area.name}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ScaffoldEditor({
  functions,
  onAddFunction,
  onRemoveFunction,
  onUpdateFunctionName,
  onUpdateFunctionDescription,
  onAddArea,
  onRemoveArea,
  onUpdateAreaName,
}: {
  functions: FunctionNode[];
  onAddFunction: () => void;
  onRemoveFunction: (functionId: string) => void;
  onUpdateFunctionName: (functionId: string, nextName: string) => void;
  onUpdateFunctionDescription: (functionId: string, nextDescription: string) => void;
  onAddArea: (functionId: string) => void;
  onRemoveArea: (functionId: string, areaId: string) => void;
  onUpdateAreaName: (
    functionId: string,
    areaId: string,
    nextName: string,
  ) => void;
}) {
  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
            Edit scaffold
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            Rename, add, or remove functions and process areas before
            confirming the setup.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={onAddFunction}>
          <Plus className="size-4" aria-hidden="true" />
          Add function
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {functions.map((fn) => (
          <article key={fn.id} className="rounded-md border border-border p-4">
            <div className="flex gap-3">
              <div className="min-w-0 flex-1 space-y-3">
                <input
                  value={fn.name}
                  aria-label={`${fn.name} function name`}
                  onChange={(event) =>
                    onUpdateFunctionName(fn.id, event.target.value)
                  }
                  className="h-10 w-full rounded-md border border-border px-3 text-sm font-medium text-slate-950"
                />
                <textarea
                  value={fn.description ?? ""}
                  aria-label={`${fn.name} function description`}
                  onChange={(event) =>
                    onUpdateFunctionDescription(fn.id, event.target.value)
                  }
                  rows={2}
                  placeholder="Brief description of what this function does"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm leading-6"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${fn.name}`}
                onClick={() => onRemoveFunction(fn.id)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="mt-3 space-y-2">
              {fn.areas.map((area) => (
                <div key={area.id} className="flex gap-2 pl-4">
                  <input
                    value={area.name}
                    aria-label={`${area.name} process area name`}
                    onChange={(event) =>
                      onUpdateAreaName(fn.id, area.id, event.target.value)
                    }
                    className="h-9 min-w-0 flex-1 rounded-md border border-border px-3 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${area.name}`}
                    onClick={() => onRemoveArea(fn.id, area.id)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                onClick={() => onAddArea(fn.id)}
              >
                <Plus className="size-4" aria-hidden="true" />
                Add process area
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
