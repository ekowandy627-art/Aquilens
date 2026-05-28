import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AuthProvider } from "@/lib/auth-provider";

export default function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <AppShell>
        <AuthGuard>{children}</AuthGuard>
      </AppShell>
    </AuthProvider>
  );
}
