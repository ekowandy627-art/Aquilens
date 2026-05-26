"use client";

import { useEffect, useState } from "react";
import {
  clearSession,
  getSessionContext,
  type DemoRole,
  type DemoTenant,
  type DemoUser,
} from "@/lib/demo-auth";
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

const emptyContext: AuthContext = {
  loading: true,
  source: "none",
  roles: [],
  memberships: [],
};

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

export function useAuthContext() {
  const [context, setContext] = useState<AuthContext>(emptyContext);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const supabase = createSupabaseBrowserClient();

      if (supabase) {
        const { data: userData } = await supabase.auth.getUser();

        if (userData.user) {
          const { data: profile } = await supabase
            .from("users")
            .select("id, tenant_id, full_name, email, status, last_login_at")
            .eq("id", userData.user.id)
            .maybeSingle<DbUser>();

          if (profile) {
            const [{ data: tenant }, { data: roles }, { data: userRoles }] =
              await Promise.all([
                supabase
                  .from("tenants")
                  .select("id, name, slug, institution_type, country")
                  .eq("id", profile.tenant_id)
                  .maybeSingle<DbTenant>(),
                supabase
                  .from("roles")
                  .select("id, tenant_id, name, description, is_system")
                  .eq("tenant_id", profile.tenant_id)
                  .returns<DbRole[]>(),
                supabase
                  .from("user_roles")
                  .select("role_id")
                  .eq("user_id", profile.id)
                  .returns<DbUserRole[]>(),
              ]);

            const assignedRoleIds = new Set(
              (userRoles ?? []).map((role) => role.role_id),
            );
            const mappedRoles = (roles ?? []).map(dbRoleToDemo);
            const mappedUser = {
              ...dbUserToDemo(profile),
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

      const demo = getSessionContext();
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

  return context;
}

export async function signOutEverywhere() {
  const supabase = createSupabaseBrowserClient();
  await supabase?.auth.signOut();
  clearSession();
}
