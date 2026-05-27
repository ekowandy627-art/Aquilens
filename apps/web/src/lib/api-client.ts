"use client";

import { loadSession } from "@/lib/demo-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

async function resolveAuthToken() {
  const supabase = createSupabaseBrowserClient();
  const { data } = supabase
    ? await supabase.auth.getSession()
    : { data: { session: null } };

  if (data.session?.access_token) {
    return data.session.access_token;
  }

  const demoSession = loadSession();
  if (demoSession) {
    return `demo:${demoSession.userId}`;
  }

  return null;
}

export async function apiFetchPublic<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
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

export async function apiFetch<T>(path: string, init: RequestInit = {}) {
  const token = await resolveAuthToken();

  if (!token) {
    throw new Error("Not signed in");
  }

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
