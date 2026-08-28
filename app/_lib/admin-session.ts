import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE_NAME = "health_box_admin_auth";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export type AdminSession = {
  staffId: number | null;
  loginId: string;
  name: string;
  scopeType: "HQ" | "DEALER";
  dealerMallId: number | null;
  scopeName: string;
  roleType: "OWNER" | "STAFF";
  permissionCodes: string[];
  expiresAt: number;
};

type CreateAdminSessionInput = Omit<AdminSession, "expiresAt"> & { expiresAt?: number };

function getSigningSecret() {
  return process.env.ADMIN_SESSION_TOKEN?.trim() || "";
}

function signature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createAdminSessionToken(input: CreateAdminSessionInput) {
  const secret = getSigningSecret();
  if (!secret) {
    throw new Error("ADMIN_SESSION_TOKEN is not configured");
  }
  const payload: AdminSession = {
    ...input,
    expiresAt: input.expiresAt || Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encodedPayload}.${signature(encodedPayload, secret)}`;
}

export function verifyAdminSessionToken(token: string | null | undefined): AdminSession | null {
  const secret = getSigningSecret();
  if (!secret || !token) return null;

  const [encodedPayload, suppliedSignature, extra] = token.split(".");
  if (!encodedPayload || !suppliedSignature || extra) return null;

  const expectedSignature = signature(encodedPayload, secret);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<AdminSession>;
    const scopeType = payload.scopeType === "DEALER" ? "DEALER" : payload.scopeType === "HQ" ? "HQ" : null;
    const dealerMallId = Number(payload.dealerMallId || 0);
    const staffId = Number(payload.staffId || 0);
    if (
      !scopeType ||
      !Number.isFinite(staffId) ||
      staffId <= 0 ||
      !Number.isFinite(payload.expiresAt) ||
      Number(payload.expiresAt) <= Date.now() ||
      (scopeType === "DEALER" && dealerMallId <= 0) ||
      !Array.isArray(payload.permissionCodes)
    ) {
      return null;
    }

    return {
      staffId,
      loginId: String(payload.loginId || ""),
      name: String(payload.name || "관리자"),
      scopeType,
      dealerMallId: scopeType === "DEALER" ? dealerMallId : null,
      scopeName: String(payload.scopeName || (scopeType === "DEALER" ? "딜러몰" : "본사몰")),
      roleType: payload.roleType === "OWNER" ? "OWNER" : "STAFF",
      permissionCodes: payload.permissionCodes.filter((code): code is string => typeof code === "string"),
      expiresAt: Number(payload.expiresAt),
    };
  } catch {
    return null;
  }
}

export function canAccessAdminPermission(session: AdminSession, permissionCode: string) {
  return session.permissionCodes.includes(permissionCode);
}
