import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, getAdminSessionToken } from "./app/_lib/admin-auth";

const DEFAULT_ADMIN_HOSTNAME = "admin.everybuy.co.kr";
const PUBLIC_FILE_PATTERN = /\.[^/]+$/;

function getAdminHostname() {
  return process.env.ADMIN_HOSTNAME?.trim() || DEFAULT_ADMIN_HOSTNAME;
}

function isBypassPath(pathname: string) {
  return pathname.startsWith("/_next") || pathname.startsWith("/api") || PUBLIC_FILE_PATTERN.test(pathname);
}

export function proxy(request: NextRequest) {
  const { pathname, search, hostname } = request.nextUrl;
  const expectedToken = getAdminSessionToken();
  const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
  const authenticated = Boolean(expectedToken && cookieToken === expectedToken);
  const isAdminHost = hostname === getAdminHostname();

  if (isAdminHost && pathname === "/") {
    const rootTarget = authenticated ? "/admin/dashboard" : "/admin/login";
    return NextResponse.redirect(new URL(rootTarget, request.url));
  }

  if (isAdminHost && !pathname.startsWith("/admin") && !isBypassPath(pathname)) {
    return NextResponse.redirect(new URL(`/admin${pathname}`, request.url));
  }

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage && authenticated) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  if (!isLoginPage && !authenticated) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
