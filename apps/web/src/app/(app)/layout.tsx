import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell>
      <AuthGuard>{children}</AuthGuard>
    </AppShell>
  );
}
