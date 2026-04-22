export const ADMIN_COOKIE_NAME = "health_box_admin_auth";

export function isAdminSecureCookie() {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

export function getAdminSessionToken() {
  return process.env.ADMIN_SESSION_TOKEN?.trim() || "";
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || "";
}

