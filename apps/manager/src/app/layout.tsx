import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aquilens Manager",
  description: "Platform console for tenants and standards packs",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
