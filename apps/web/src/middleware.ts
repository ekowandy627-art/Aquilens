import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/tenant-config", "/praise-export"];
const DEMO_SESSION_COOKIE = "aquilens-demo-session";

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function hasDemoSessionCookie(request: NextRequest) {
  const value = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  return Boolean(value && value.length > 2);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

  let isAuthenticated = false;

  if (supabaseConfigured) {
    const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const allowDemoSessionCookie =
      process.env.ALLOW_DEMO_SESSION === "true" ||
      process.env.NODE_ENV !== "production";

    isAuthenticated =
      Boolean(user) ||
      (allowDemoSessionCookie && hasDemoSessionCookie(request));
  } else {
    isAuthenticated = hasDemoSessionCookie(request);
  }

  if (!isAuthenticated && !isPublicPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && pathname === "/login") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  if (pathname === "/") {
    const target = request.nextUrl.clone();
    target.pathname = isAuthenticated ? "/dashboard" : "/login";
    target.search = "";
    return NextResponse.redirect(target);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
