"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import {
  clearSession,
  getSessionContext,
  loadSession,
  type DemoRole,
  type DemoTenant,
  type DemoUser,
} from "@/lib/demo-auth";
import { apiFetch } from "@/lib/api-client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type AuthContext = {
  loading: boolean;
  source: "supabase" | "demo" | "none";
  user?: DemoUser;
  tenant?: DemoTenant;
  roles: DemoRole[];
  memberships: DemoUser[];
};

type DbUser = {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  status: "active" | "invited" | "deactivated";
  last_login_at: string | null;
};

type DbTenant = {
  id: string;
  name: string;
  slug: string;
  institution_type: string;
  country: string;
};

type DbRole = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  is_system: boolean;
};

type DbUserRole = {
  role_id: string;
};

type DbRolePermission = {
  role_id: string;
  permissions: {
    resource: string;
    action: string;
  } | null;
};

const emptyContext: AuthContext = {
  loading: true,
  source: "none",
  roles: [],
  memberships: [],
};

const AuthReactContext = createContext<AuthContext>(emptyContext);

function demoContextFromStorage(): AuthContext | null {
  const demo = getSessionContext();
  if (!demo.user) {
    return null;
  }

  return {
    loading: false,
    source: "demo",
    user: demo.user,
    tenant: demo.tenant,
    roles: demo.roles,
    memberships: demo.memberships,
  };
}

function dbUserToDemo(user: DbUser): DemoUser {
  return {
    id: user.id,
    tenantId: user.tenant_id,
    fullName: user.full_name,
    email: user.email,
    status: user.status,
    roles: [],
    lastLoginAt: user.last_login_at ?? undefined,
  };
}

function dbTenantToDemo(tenant: DbTenant): DemoTenant {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    institutionType: tenant.institution_type,
    country: tenant.country,
  };
}

function dbRoleToDemo(role: DbRole): DemoRole {
  return {
    id: role.id,
    tenantId: role.tenant_id,
    name: role.name,
    description: role.description ?? "",
    isSystem: role.is_system,
    permissions: [],
  };
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), ms);
    }),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<AuthContext>(emptyContext);

  useLayoutEffect(() => {
    const demo = demoContextFromStorage();
    if (demo) {
      setContext(demo);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const demoFromStorage = getSessionContext(loadSession());
      if (demoFromStorage.user) {
        if (mounted) {
          setContext({
            loading: false,
            source: "demo",
            user: demoFromStorage.user,
            tenant: demoFromStorage.tenant,
            roles: demoFromStorage.roles,
            memberships: demoFromStorage.memberships,
          });
        }
        return;
      }

      const supabase = createSupabaseBrowserClient();

      if (supabase) {
        const authResult = await withTimeout(supabase.auth.getUser(), 4_000);
        const authUser = authResult?.data.user ?? null;

        if (authUser) {
          const profile = await withTimeout(
            (async () =>
              supabase
                .from("users")
                .select("id, tenant_id, full_name, email, status, last_login_at")
                .eq("id", authUser.id)
                .maybeSingle<DbUser>())(),
            5_000,
          );

          const profileRow = profile?.data;
          if (profileRow) {
            const bundle = await withTimeout(
              (async () =>
                Promise.all([
                  supabase
                    .from("tenants")
                    .select("id, name, slug, institution_type, country")
                    .eq("id", profileRow.tenant_id)
                    .maybeSingle<DbTenant>(),
                  supabase
                    .from("roles")
                    .select("id, tenant_id, name, description, is_system")
                    .eq("tenant_id", profileRow.tenant_id)
                    .returns<DbRole[]>(),
                  supabase
                    .from("user_roles")
                    .select("role_id")
                    .eq("user_id", profileRow.id)
                    .returns<DbUserRole[]>(),
                  supabase
                    .from("role_permissions")
                    .select("role_id, permissions(resource, action)")
                    .returns<DbRolePermission[]>(),
                ]))(),
              5_000,
            );

            if (bundle) {
              const [{ data: tenant }, { data: roles }, { data: userRoles }, { data: rolePermissions }] =
                bundle;

              const assignedRoleIds = new Set(
                (userRoles ?? []).map((role) => role.role_id),
              );
              const mappedRoles = (roles ?? []).map((role) => {
                const mapped = dbRoleToDemo(role);
                return {
                  ...mapped,
                  permissions:
                    role.name === "Super Admin"
                      ? ["*"]
                      : (rolePermissions ?? [])
                          .filter(
                            (rolePermission) =>
                              rolePermission.role_id === role.id &&
                              rolePermission.permissions,
                          )
                          .map(
                            (rolePermission) =>
                              `${rolePermission.permissions!.resource}:${rolePermission.permissions!.action}`,
                          ),
                };
              });
              const mappedUser = {
                ...dbUserToDemo(profileRow),
                roles: [...assignedRoleIds],
              };

              if (mounted) {
                setContext({
                  loading: false,
                  source: "supabase",
                  user: mappedUser,
                  tenant: tenant ? dbTenantToDemo(tenant) : undefined,
                  roles: mappedRoles.filter((role) => assignedRoleIds.has(role.id)),
                  memberships: [mappedUser],
                });
              }
              return;
            }
          }
        }
      }

      const demo = getSessionContext(loadSession());
      if (mounted) {
        setContext({
          loading: false,
          source: demo.user ? "demo" : "none",
          user: demo.user,
          tenant: demo.tenant,
          roles: demo.roles,
          memberships: demo.memberships,
        });
      }
    }

    function sync() {
      void load();
    }

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("aquilens-session-changed", sync);

    return () => {
      mounted = false;
      window.removeEventListener("storage", sync);
      window.removeEventListener("aquilens-session-changed", sync);
    };
  }, []);

  return (
    <AuthReactContext.Provider value={context}>{children}</AuthReactContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthReactContext);
}

export async function signOutEverywhere() {
  await apiFetch("/auth/events/logout", { method: "POST", body: "{}" }).catch(
    () => undefined,
  );
  const supabase = createSupabaseBrowserClient();
  await supabase?.auth.signOut();
  clearSession();
}
