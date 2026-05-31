import { NextResponse, type NextRequest } from "next/server";
import { verifyPlatformAccessToken } from "./lib/auth/platform-jwt";

const PUBLIC_PLATFORM_PATHS = [
  "/platform/login",
  "/api/platform/auth/login",
  "/api/platform/auth/logout",
  "/api/internal/tenant-lookup",
];

function isPlatformPath(pathname: string) {
  return pathname.startsWith("/platform") || pathname.startsWith("/api/platform");
}

function isInternalPath(pathname: string) {
  return pathname.startsWith("/api/internal/");
}

function isPublicPath(pathname: string) {
  return PUBLIC_PLATFORM_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isInternalPath(pathname)) {
    const lookupSecret = process.env.MANAGER_LOOKUP_SECRET?.trim();
    const auth = req.headers.get("authorization");
    const token = auth?.startsWith("Bearer ")
      ? auth.slice("Bearer ".length).trim()
      : null;

    if (!lookupSecret || token !== lookupSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.next();
  }

  if (!isPlatformPath(pathname)) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const cookieToken = req.cookies.get("platform_access_token")?.value;
  if (!cookieToken) {
    if (pathname.startsWith("/api/platform")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/platform/login", req.url));
  }

  try {
    const payload = await verifyPlatformAccessToken(cookieToken);
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-platform-user-id", payload.userId);
    requestHeaders.set("x-platform-user-role", payload.role);
    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    if (pathname.startsWith("/api/platform")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/platform/login", req.url));
  }
}

export const config = {
  matcher: ["/platform/:path*", "/api/platform/:path*", "/api/internal/:path*"],
};
