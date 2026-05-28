"use client";

import { loadSession } from "@/lib/demo-auth";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserEnv,
} from "@/lib/supabase/client";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

function demoSessionAllowed() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_ALLOW_DEMO_SESSION === "true"
  );
}

export async function resolveAuthToken() {
  const supabase = createSupabaseBrowserClient();

  if (supabase) {
    let { data } = await supabase.auth.getSession();

    if (!data.session?.access_token) {
      await supabase.auth.refreshSession();
      ({ data } = await supabase.auth.getSession());
    }

    if (data.session?.access_token) {
      return data.session.access_token;
    }
  }

  if (hasSupabaseBrowserEnv()) {
    return null;
  }

  const demoSession = loadSession();
  if (demoSession && demoSessionAllowed()) {
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

export async function apiUpload<T>(path: string, formData: FormData) {
  const token = await resolveAuthToken();

  if (!token) {
    throw new Error("Not signed in");
  }

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const body = (await response.json()) as {
    success: boolean;
    data?: T;
    error?: { message?: string; code?: string };
  };

  if (!response.ok || !body.success) {
    throw new Error(body.error?.message ?? body.error?.code ?? "Upload failed");
  }

  return body.data as T;
}
