"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

export async function apiFetch<T>(path: string, init: RequestInit = {}) {
  const supabase = createSupabaseBrowserClient();
  const { data } = supabase
    ? await supabase.auth.getSession()
    : { data: { session: null } };
  const token = data.session?.access_token ?? "demo";

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  const body = (await response.json()) as {
    success: boolean;
    data?: T;
    error?: { message?: string; code?: string };
  };

  if (!response.ok || !body.success) {
    throw new Error(body.error?.message ?? body.error?.code ?? "API request failed");
  }

  return body.data as T;
}
