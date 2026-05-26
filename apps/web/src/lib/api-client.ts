"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export async function apiFetch<T>(path: string, init: RequestInit = {}) {
  const supabase = createSupabaseBrowserClient();
  const { data } = supabase
    ? await supabase.auth.getSession()
    : { data: { session: null } };
  const token = data.session?.access_token ?? "demo";

  const response = await fetch(`http://localhost:3001/api/v1${path}`, {
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
