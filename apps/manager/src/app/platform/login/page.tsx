"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function PlatformLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(
    process.env.NODE_ENV === "production" ? "" : "platform-admin@aquilens.test",
  );
  const [password, setPassword] = useState(
    process.env.NODE_ENV === "production" ? "" : "AquilensPlatform2024!",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/platform/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Login failed");
      setLoading(false);
      return;
    }

    router.push("/platform");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="w-full max-w-sm rounded-md border border-border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-brand-navy">Platform sign in</h1>
        <p className="mt-2 text-sm text-text-muted">
          Manage Aquilens tenants and standards packs. Separate from tenant user login.
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm">
            <span className="font-medium">Email</span>
            <input
              className="mt-1 w-full rounded-md border border-border px-3 py-2"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Password</span>
            <input
              type="password"
              className="mt-1 w-full rounded-md border border-border px-3 py-2"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
