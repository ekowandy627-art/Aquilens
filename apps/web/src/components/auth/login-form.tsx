"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { signInDemo } from "@/lib/demo-auth";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserEnv,
} from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("gis-admin@aquilens.test");
  const [password, setPassword] = useState("Aquilens2024!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabaseEnabled = hasSupabaseBrowserEnv();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (supabaseEnabled) {
      const supabase = createSupabaseBrowserClient();
      const result = await supabase?.auth.signInWithPassword({
        email,
        password,
      });

      if (result?.error) {
        await apiFetch("/auth/events/login-failed", {
          method: "POST",
          body: JSON.stringify({ email, reason: result.error.message }),
        }).catch(() => undefined);
        setError(result.error.message);
        setLoading(false);
        return;
      }

      await apiFetch("/auth/events/login", { method: "POST", body: "{}" }).catch(
        () => undefined,
      );

      const demoResult = signInDemo(email, password);
      if (demoResult.user) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      router.push("/dashboard");
      router.refresh();
      return;
    }

    const demoResult = signInDemo(email, password);

    if (demoResult.error) {
      await apiFetch("/auth/events/login-failed", {
        method: "POST",
        body: JSON.stringify({ email, reason: demoResult.error }),
      }).catch(() => undefined);
      setError(demoResult.error);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm text-slate-950 placeholder:text-slate-400"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm text-slate-950 placeholder:text-slate-400"
        />
      </label>

      {error && (
        <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      <Button type="submit" className="h-10 w-full" disabled={loading}>
        <LogIn className="size-4" aria-hidden="true" />
        {loading ? "Signing in..." : "Sign in"}
      </Button>

      <p className="text-xs leading-5 text-text-muted">
        {supabaseEnabled
          ? "Supabase auth is configured. Demo RBAC data remains available until Auth users are seeded."
          : "Demo mode: use any seeded email with password Aquilens2024!."}
      </p>
    </form>
  );
}
