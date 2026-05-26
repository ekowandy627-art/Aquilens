"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { createId, type FunctionNode } from "@/lib/scaffolds";
import { loadTenantProfile, saveTenantProfile } from "@/lib/tenant-storage";

export function StructureEditor() {
  const [state, setState] = useState(() => {
    const loaded = loadTenantProfile();
    return {
      profile: loaded,
      selectedFunctionId: loaded.functions[0]?.id ?? null,
    };
  });

  const { profile, selectedFunctionId } = state;

  const selectedFunction = useMemo(
    () => profile.functions.find((fn) => fn.id === selectedFunctionId),
    [profile, selectedFunctionId],
  );

  function updateFunctions(updater: (functions: FunctionNode[]) => FunctionNode[]) {
    const nextFunctions = updater(profile.functions);
    const nextSelectedFunctionId = nextFunctions.some(
      (fn) => fn.id === selectedFunctionId,
    )
      ? selectedFunctionId
      : (nextFunctions[0]?.id ?? null);
    const nextProfile = { ...profile, functions: nextFunctions };

    setState({
      profile: nextProfile,
      selectedFunctionId: nextSelectedFunctionId,
    });
    saveTenantProfile(nextProfile);
  }

  function addFunction() {
    const nextFunction = {
      id: createId("fn"),
      name: "New Function",
      areas: [],
    };

    const nextProfile = {
      ...profile,
      functions: [...profile.functions, nextFunction],
    };

    setState({
      profile: nextProfile,
      selectedFunctionId: nextFunction.id,
    });
    saveTenantProfile(nextProfile);
  }

  return (
    <>
      <PageHeader
        title="Function Tree"
        description="Edit the tenant scaffold that organises functions, process areas, and future SOPs."
        action={
          <Button type="button" onClick={addFunction}>
            <Plus className="size-4" aria-hidden="true" />
            Add function
          </Button>
        }
      />

      <div className="grid min-h-[560px] gap-5 lg:grid-cols-[300px_1fr]">
        <aside className="rounded-md border border-border bg-white p-3">
          <p className="px-2 pb-2 text-xs font-semibold uppercase text-text-muted">
            Functions
          </p>
          <div className="space-y-1">
            {profile.functions.map((fn) => (
              <button
                key={fn.id}
                type="button"
                onClick={() =>
                  setState((current) => ({
                    ...current,
                    selectedFunctionId: fn.id,
                  }))
                }
                className={
                  selectedFunctionId === fn.id
                    ? "flex w-full items-center justify-between rounded-md bg-brand-navy px-3 py-2 text-left text-sm font-medium text-white"
                    : "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                }
              >
                <span className="truncate">{fn.name}</span>
                <span className="rounded bg-white/15 px-1.5 py-0.5 text-xs">
                  {fn.areas.length}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-md border border-border bg-white p-5">
          {selectedFunction ? (
            <>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <label className="block flex-1">
                  <span className="text-sm font-medium text-slate-700">
                    Function name
                  </span>
                  <input
                    value={selectedFunction.name}
                    onChange={(event) =>
                      updateFunctions((functions) =>
                        functions.map((fn) =>
                          fn.id === selectedFunction.id
                            ? { ...fn, name: event.target.value }
                            : fn,
                        ),
                      )
                    }
                    className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm font-medium"
                  />
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    updateFunctions((functions) =>
                      functions.filter((fn) => fn.id !== selectedFunction.id),
                    )
                  }
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Archive
                </Button>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">
                    Process areas
                  </h2>
                  <p className="mt-1 text-sm text-text-muted">
                    Processes will be created under these areas in Phase 3.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    updateFunctions((functions) =>
                      functions.map((fn) =>
                        fn.id === selectedFunction.id
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
                    )
                  }
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add area
                </Button>
              </div>

              <div className="mt-4 space-y-2">
                {selectedFunction.areas.map((area) => (
                  <div key={area.id} className="flex gap-2">
                    <input
                      value={area.name}
                      aria-label={`${area.name} process area`}
                      onChange={(event) =>
                        updateFunctions((functions) =>
                          functions.map((fn) =>
                            fn.id === selectedFunction.id
                              ? {
                                  ...fn,
                                  areas: fn.areas.map((currentArea) =>
                                    currentArea.id === area.id
                                      ? {
                                          ...currentArea,
                                          name: event.target.value,
                                        }
                                      : currentArea,
                                  ),
                                }
                              : fn,
                          ),
                        )
                      }
                      className="h-10 min-w-0 flex-1 rounded-md border border-border px-3 text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${area.name}`}
                      onClick={() =>
                        updateFunctions((functions) =>
                          functions.map((fn) =>
                            fn.id === selectedFunction.id
                              ? {
                                  ...fn,
                                  areas: fn.areas.filter(
                                    (currentArea) => currentArea.id !== area.id,
                                  ),
                                }
                              : fn,
                          ),
                        )
                      }
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="grid min-h-[360px] place-items-center text-center">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  No functions yet
                </h2>
                <p className="mt-2 text-sm text-text-muted">
                  Add a function to begin building the structure.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
