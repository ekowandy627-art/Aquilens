"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import {
  createGuestAccess,
  fetchGuestAccessGrants,
  revokeGuestAccess,
  type GuestAccessGrant,
} from "@/lib/audit";

const functionOptions = [
  { id: "fn-school-academics", label: "Academics" },
  { id: "fn-school-admissions", label: "Admissions" },
  { id: "fn-school-finance", label: "Finance" },
];

export default function GuestAccessSettingsPage() {
  const [grants, setGrants] = useState<GuestAccessGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [scopeId, setScopeId] = useState("fn-school-academics");
  const [auditorEmail, setAuditorEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const data = await fetchGuestAccessGrants();
    setGrants(data);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchGuestAccessGrants();
        if (!cancelled) {
          setGrants(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load guest access grants",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      const result = await createGuestAccess({
        scope: "function",
        scopeId,
        auditorEmail,
        expiresAt: expiresAt
          ? new Date(`${expiresAt}T23:59:59`).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setCreatedUrl(result.accessUrl);
      setModalOpen(false);
      await reload();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(id: string) {
    setBusy(true);
    setError(null);
    try {
      await revokeGuestAccess(id);
      await reload();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Revoke failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Guest Access"
        description="Time-limited read-only access links for external auditors."
        action={
          <div className="flex gap-2">
            <Link href="/settings">
              <button
                type="button"
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-bg"
              >
                Back to settings
              </button>
            </Link>
            <PrimaryButton onClick={() => setModalOpen(true)}>
              Create Guest Access
            </PrimaryButton>
          </div>
        }
      />

      {createdUrl ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Access URL created:{" "}
          <code className="rounded bg-white px-1 py-0.5">{createdUrl}</code>
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-text-muted">
          Loading…
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-surface-bg text-left text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3">Auditor</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {grants.map((grant) => (
                <tr key={grant.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{grant.auditorEmail}</td>
                  <td className="px-4 py-3">{grant.scopeLabel ?? grant.scopeId}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {new Date(grant.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 capitalize">{grant.status}</td>
                  <td className="px-4 py-3 text-right">
                    {grant.status === "active" ? (
                      <button
                        type="button"
                        disabled={busy}
                        className="rounded-md border border-border px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                        onClick={() => void handleRevoke(grant.id)}
                      >
                        Revoke
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold">Create Guest Access</h2>
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-text-muted">Scope (function)</span>
                <select
                  className="w-full rounded-md border border-border px-2 py-1.5"
                  value={scopeId}
                  onChange={(event) => setScopeId(event.target.value)}
                >
                  {functionOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-text-muted">Auditor email</span>
                <input
                  type="email"
                  className="w-full rounded-md border border-border px-2 py-1.5"
                  value={auditorEmail}
                  onChange={(event) => setAuditorEmail(event.target.value)}
                  placeholder="auditor@example.org"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-text-muted">Expiry date</span>
                <input
                  type="date"
                  className="w-full rounded-md border border-border px-2 py-1.5"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-border px-3 py-2 text-sm"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <PrimaryButton disabled={busy || !auditorEmail} onClick={() => void handleCreate()}>
                Create link
              </PrimaryButton>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
