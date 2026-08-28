import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  canAccessAdminPermission,
  verifyAdminSessionToken,
  type AdminSession,
} from "./app/_lib/admin-session";

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

const ADMIN_ROUTE_RULES: ReadonlyArray<{
  prefixes: readonly string[];
  permission: string;
  hqOnly?: boolean;
}> = [
  { prefixes: ["/dashboard"], permission: "DASHBOARD_VIEW" },
  { prefixes: ["/orders"], permission: "ORDER_VIEW" },
  { prefixes: ["/sales", "/settlements"], permission: "SALES_VIEW" },
  { prefixes: ["/products", "/product"], permission: "PRODUCT_VIEW", hqOnly: true },
  { prefixes: ["/categories"], permission: "CATEGORY_MANAGE", hqOnly: true },
  { prefixes: ["/members"], permission: "MEMBER_VIEW" },
  { prefixes: ["/dealers"], permission: "DEALER_VIEW", hqOnly: true },
  { prefixes: ["/staff"], permission: "STAFF_MANAGE" },
  { prefixes: ["/storefront"], permission: "STOREFRONT_MANAGE" },
  { prefixes: ["/settings", "/operation-settings"], permission: "STOREFRONT_MANAGE", hqOnly: true },
  { prefixes: ["/notices", "/notice"], permission: "NOTICE_MANAGE" },
  { prefixes: ["/logs"], permission: "AUDIT_LOG_VIEW" },
];

function isRulePrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function canAccessAdminPath(session: AdminSession, pathname: string) {
  const rule = ADMIN_ROUTE_RULES.find((candidate) =>
    candidate.prefixes.some((prefix) => isRulePrefix(pathname, prefix)),
  );
  if (!rule) return true;
  if (rule.hqOnly && session.scopeType === "DEALER") return false;
  return canAccessAdminPermission(session, rule.permission);
}

function firstAllowedAdminPath(session: AdminSession) {
  for (const rule of ADMIN_ROUTE_RULES) {
    if ((!rule.hqOnly || session.scopeType === "HQ") && canAccessAdminPermission(session, rule.permission)) {
      return rule.prefixes[0];
    }
  }
  return "/login";
}

export function proxy(request: NextRequest) {
  const { pathname, search, hostname: urlHostname } = request.nextUrl;
  const hostname = normalizeHostname(request.headers.get("x-forwarded-host") || request.headers.get("host")) || urlHostname;
  const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value ?? "";
  const session = verifyAdminSessionToken(cookieToken);
  const authenticated = Boolean(session);
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

  const prettyAdminPath = stripAdminPrefix(internalPathname);
  if (!isLoginPage && session && !canAccessAdminPath(session, prettyAdminPath)) {
    const fallbackPath = firstAllowedAdminPath(session);
    const fallbackUrl = new URL(isAdminHost ? fallbackPath : `/admin${fallbackPath}`, request.url);
    fallbackUrl.searchParams.set("forbidden", "1");
    return NextResponse.redirect(fallbackUrl);
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
