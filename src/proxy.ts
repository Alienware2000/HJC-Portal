import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  AUTH_ROUTES,
  PROTECTED_ROUTE_PREFIXES,
  ROLE_DASHBOARDS,
  type Role,
} from "@/lib/constants";

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Auth routes are always publicly accessible
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  // Authenticated users on auth routes → redirect to their dashboard
  if (user && isAuthRoute) {
    const role = (user.user_metadata?.role as Role) || "board_member";
    const url = request.nextUrl.clone();
    url.pathname = ROLE_DASHBOARDS[role];
    return NextResponse.redirect(url);
  }

  if (isAuthRoute) {
    return supabaseResponse;
  }

  // Check if this is a protected route
  const matchedPrefix = Object.keys(PROTECTED_ROUTE_PREFIXES).find(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (matchedPrefix) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    const role = (user.user_metadata?.role as Role) || "board_member";
    const requiredRole = PROTECTED_ROUTE_PREFIXES[matchedPrefix];

    if (role !== requiredRole) {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_DASHBOARDS[role];
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
