"use client";

import Link from "next/link";
import { wallSupportMessage, type PlatformWallError } from "@/lib/platform-wall";

export function WallNotice({
  error,
  onDismiss,
}: {
  error: PlatformWallError;
  onDismiss?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
    >
      <p className="font-medium">Action blocked</p>
      <p className="mt-1">{wallSupportMessage(error)}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Link href="/settings" className="font-medium text-brand-teal underline">
          Organisation settings
        </Link>
        {onDismiss ? (
          <button type="button" className="font-medium underline" onClick={onDismiss}>
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}
