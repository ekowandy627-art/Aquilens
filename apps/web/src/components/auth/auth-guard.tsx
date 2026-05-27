"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/use-auth-context";

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, user } = useAuthContext();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      const loginUrl = `/login?next=${encodeURIComponent(pathname)}`;
      router.replace(loginUrl);
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-text-muted">
        Checking session…
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
