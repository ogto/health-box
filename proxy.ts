import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, getAdminSessionToken } from "./app/_lib/admin-auth";

const DEFAULT_ADMIN_HOSTNAME = "admin.everybuy.co.kr";
const LOCAL_ADMIN_HOSTNAME = "admin.localhost";
const PUBLIC_FILE_PATTERN = /\.[^/]+$/;

function getAdminHostname() {
  return process.env.ADMIN_HOSTNAME?.trim() || DEFAULT_ADMIN_HOSTNAME;
}

function normalizeHostname(rawHost: string | null) {
  return rawHost?.split(",")[0]?.trim().replace(/:\d+$/, "").toLowerCase() || "";
}

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost");
}

function isBypassPath(pathname: string) {
  return pathname.startsWith("/_next") || pathname.startsWith("/api") || PUBLIC_FILE_PATTERN.test(pathname);
}

function stripAdminPrefix(pathname: string) {
  return pathname.replace(/^\/admin/, "") || "/dashboard";
}

export function proxy(request: NextRequest) {
  const { pathname, search, hostname: urlHostname } = request.nextUrl;
  const hostname = normalizeHostname(request.headers.get("x-forwarded-host") || request.headers.get("host")) || urlHostname;
  const expectedToken = getAdminSessionToken();
  const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
  const authenticated = Boolean(expectedToken && cookieToken === expectedToken);
  const adminHostname = getAdminHostname();
  const isAdminHost = hostname === adminHostname || hostname === LOCAL_ADMIN_HOSTNAME;

  if (isAdminHost && isBypassPath(pathname)) {
    return NextResponse.next();
  }

  if (isAdminHost && pathname === "/") {
    const rootTarget = authenticated ? "/dashboard" : "/login";
    return NextResponse.redirect(new URL(rootTarget, request.url));
  }

  if (isAdminHost && pathname === "/admin") {
    const rootTarget = authenticated ? "/dashboard" : "/login";
    return NextResponse.redirect(new URL(rootTarget, request.url));
  }

  if (isAdminHost && pathname.startsWith("/admin/")) {
    const prettyUrl = request.nextUrl.clone();
    prettyUrl.pathname = stripAdminPrefix(pathname);
    return NextResponse.redirect(prettyUrl);
  }

  if (adminHostname && pathname.startsWith("/admin") && !isAdminHost && !isLocalHostname(hostname)) {
    const adminUrl = new URL(request.url);
    adminUrl.hostname = adminHostname || DEFAULT_ADMIN_HOSTNAME;
    return NextResponse.redirect(adminUrl);
  }

  const internalPathname = isAdminHost && !pathname.startsWith("/admin") ? `/admin${pathname}` : pathname;

  if (!internalPathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const isLoginPage = internalPathname === "/admin/login";

  if (isLoginPage && authenticated) {
    return NextResponse.redirect(new URL(isAdminHost ? "/dashboard" : "/admin/dashboard", request.url));
  }

  if (!isLoginPage && !authenticated) {
    const loginUrl = new URL(isAdminHost ? "/login" : "/admin/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminHost && !pathname.startsWith("/admin")) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = internalPathname;
    return NextResponse.rewrite(rewriteUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
