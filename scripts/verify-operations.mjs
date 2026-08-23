import { readFile } from "node:fs/promises";

const PLACEHOLDER_PATTERN = /^(?:change-me|replace-|test_[a-z]+_replace|https:\/\/api\.example\.com)/i;
const failures = [];
const warnings = [];

async function loadLocalEnvironment() {
  try {
    const source = await readFile(new URL("../.env.local", import.meta.url), "utf8");
    for (const rawLine of source.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const separator = line.indexOf("=");
      if (separator <= 0) continue;
      const key = line.slice(0, separator).trim();
      let value = line.slice(separator + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

function report(kind, label, detail = "") {
  const suffix = detail ? ` — ${detail}` : "";
  console.log(`[${kind}] ${label}${suffix}`);
}

function requireEnvironment(name, minimumLength = 1) {
  const value = String(process.env[name] || "").trim();
  const valid = value.length >= minimumLength && !PLACEHOLDER_PATTERN.test(value);
  report(valid ? "PASS" : "FAIL", name, valid ? "configured" : `missing or unsafe placeholder (min ${minimumLength})`);
  if (!valid) failures.push(name);
  return valid ? value : "";
}

function unwrap(payload) {
  if (!payload || typeof payload !== "object") return payload;
  if ("data" in payload) return payload.data;
  if ("result" in payload) return payload.result;
  return payload;
}

async function request(baseUrl, path, options) {
  const internalApiKey = String(process.env.HEALTH_BOX_INTERNAL_API_KEY || "").trim();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(internalApiKey ? { "X-Health-Box-Internal-Key": internalApiKey } : {}),
      ...options?.headers,
    },
    signal: AbortSignal.timeout(10_000),
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }
  return { response, payload: unwrap(payload) };
}

function firstProductId(payload) {
  const records = Array.isArray(payload) ? payload : Array.isArray(payload?.content) ? payload.content : [];
  const id = Number(records[0]?.id || records[0]?.productId || 0);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

await loadLocalEnvironment();

const apiBaseUrl = requireEnvironment("HEALTH_BOX_API_BASE_URL").replace(/\/$/, "");
requireEnvironment("ADMIN_PASSWORD", 12);
requireEnvironment("ADMIN_SESSION_TOKEN", 32);
requireEnvironment("MEMBER_SESSION_SECRET", 32);
requireEnvironment("HEALTH_BOX_PAYMENT_PROOF_SECRET", 32);
requireEnvironment("HEALTH_BOX_INTERNAL_API_KEY", 32);

const tossMode = String(process.env.HEALTH_BOX_TOSS_PAYMENT_MODE || "").trim().toLowerCase();
const tossModeValid = tossMode === "live" || tossMode === "test";
report(tossModeValid ? "PASS" : "FAIL", "HEALTH_BOX_TOSS_PAYMENT_MODE", tossModeValid ? tossMode : "must be live or test");
if (!tossModeValid) failures.push("HEALTH_BOX_TOSS_PAYMENT_MODE");

const tossCredentialSource = String(process.env.HEALTH_BOX_TOSS_CREDENTIAL_SOURCE || "health-box")
  .trim()
  .toLowerCase();
const tossCredentialSourceValid = tossCredentialSource === "health-box" || tossCredentialSource === "notitle-temporary";
report(
  tossCredentialSourceValid ? "PASS" : "FAIL",
  "HEALTH_BOX_TOSS_CREDENTIAL_SOURCE",
  tossCredentialSourceValid ? tossCredentialSource : "must be health-box or notitle-temporary",
);
if (!tossCredentialSourceValid) failures.push("HEALTH_BOX_TOSS_CREDENTIAL_SOURCE");

if (tossCredentialSource === "notitle-temporary") {
  const expiresAt = String(process.env.HEALTH_BOX_TOSS_TEMPORARY_BRIDGE_EXPIRES_AT || "").trim();
  const expirationTime = /^\d{4}-\d{2}-\d{2}$/.test(expiresAt)
    ? Date.parse(`${expiresAt}T23:59:59+09:00`)
    : Number.NaN;
  const valid = Number.isFinite(expirationTime) && Date.now() <= expirationTime;
  report(valid ? "WARN" : "FAIL", "temporary NoTitle Toss bridge", valid ? `expires ${expiresAt}` : "missing, invalid, or expired");
  if (valid) warnings.push("temporary NoTitle Toss bridge");
  else failures.push("temporary NoTitle Toss bridge");
}

const tossClientKey = requireEnvironment("NEXT_PUBLIC_HEALTH_BOX_TOSS_CLIENT_KEY", 20);
const tossSecretEnvironmentName = tossMode === "test"
  ? "HEALTH_BOX_TOSS_TEST_SECRET_KEY"
  : "HEALTH_BOX_TOSS_LIVE_SECRET_KEY";
const tossSecretKey = requireEnvironment(tossSecretEnvironmentName, 20);
if (tossModeValid && tossClientKey) {
  const expectedClientPrefix = tossMode === "live" ? /^live_(?:g?ck)_/ : /^test_(?:g?ck)_/;
  const valid = expectedClientPrefix.test(tossClientKey);
  report(valid ? "PASS" : "FAIL", "Toss client key mode", valid ? `${tossMode} key` : `does not match ${tossMode}`);
  if (!valid) failures.push("Toss client key mode");
}
if (tossModeValid && tossSecretKey) {
  const expectedSecretPrefix = tossMode === "live" ? /^live_(?:g?sk)_/ : /^test_(?:g?sk)_/;
  const valid = expectedSecretPrefix.test(tossSecretKey);
  report(valid ? "PASS" : "FAIL", "Toss secret key mode", valid ? `${tossMode} key` : `does not match ${tossMode}`);
  if (!valid) failures.push("Toss secret key mode");
}

for (const legacyName of [
  "HEALTH_BOX_TOSS_SECRET_KEY",
  "TOSS_PAYMENTS_LIVE_SECRET_KEY",
  "TOSS_PAYMENTS_TEST_SECRET_KEY",
]) {
  if (String(process.env[legacyName] || "").trim()) {
    report("FAIL", legacyName, "shared or legacy payment key name must not be used by HealthBox");
    failures.push(legacyName);
  }
}

if (apiBaseUrl) {
  try {
    const apiUrl = new URL(apiBaseUrl);
    const sharedApiHost = apiUrl.hostname.toLowerCase() === "cloud.1472.ai";
    const versionedPath = /\/api\/v5\/?$/i.test(apiUrl.pathname);
    report(sharedApiHost ? "FAIL" : "PASS", "HealthBox API isolation", sharedApiHost ? "shared cloud-api host is forbidden" : apiUrl.hostname);
    report(versionedPath ? "PASS" : "FAIL", "HealthBox API base path", versionedPath ? apiUrl.pathname : "must end with /api/v5");
    if (sharedApiHost) failures.push("HealthBox API isolation");
    if (!versionedPath) failures.push("HealthBox API base path");
  } catch {
    report("FAIL", "HealthBox API URL", "invalid URL");
    failures.push("HealthBox API URL");
  }
}

if (process.env.ADMIN_SESSION_TOKEN && process.env.ADMIN_SESSION_TOKEN === process.env.MEMBER_SESSION_SECRET) {
  report("FAIL", "session secret separation", "admin and member secrets must differ");
  failures.push("session secret separation");
}

if (apiBaseUrl) {
  try {
    const configResult = await request(apiBaseUrl, "/health-box/public/public-site-config");
    const configOk = configResult.response.ok && configResult.payload && typeof configResult.payload === "object";
    report(configOk ? "PASS" : "FAIL", "public site config API", `HTTP ${configResult.response.status}`);
    if (!configOk) failures.push("public site config API");

    if (configOk) {
      let policy = null;
      try {
        policy = JSON.parse(String(configResult.payload.policyText || ""));
      } catch {
        policy = null;
      }
      const seller = policy?.seller || {};
      const requiredSellerFields = ["companyName", "representativeName", "businessRegistrationNumber", "businessAddress"];
      for (const field of requiredSellerFields) {
        const valid = Boolean(String(seller[field] || "").trim());
        report(valid ? "PASS" : "FAIL", `seller.${field}`, valid ? "configured" : "missing");
        if (!valid) failures.push(`seller.${field}`);
      }
      for (const field of ["mailOrderRegistrationNumber", "supportPhone", "supportEmail"]) {
        if (!String(seller[field] || "").trim()) {
          report("WARN", `seller.${field}`, "운영 전 실제 정보 입력 필요");
          warnings.push(`seller.${field}`);
        }
      }
    }

    const productsResult = await request(apiBaseUrl, "/health-box/admin/products?page=1&size=1");
    const productId = productsResult.response.ok ? firstProductId(productsResult.payload) : null;
    report(productId ? "PASS" : "FAIL", "product API", `HTTP ${productsResult.response.status}`);
    if (!productId) failures.push("product API");

    if (productId) {
      const inquiryResult = await request(apiBaseUrl, `/health-box/public/products/${productId}/inquiries`);
      report(inquiryResult.response.ok ? "PASS" : "FAIL", "product inquiry API", `HTTP ${inquiryResult.response.status}`);
      if (!inquiryResult.response.ok) failures.push("product inquiry API");
    }

    const quoteResult = await request(apiBaseUrl, "/health-box/public/orders/quote", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const quoteRouteExists = ![404, 405].includes(quoteResult.response.status);
    report(quoteRouteExists ? "PASS" : "FAIL", "order quote route", `HTTP ${quoteResult.response.status}`);
    if (!quoteRouteExists) failures.push("order quote route");
  } catch (error) {
    report("FAIL", "API connectivity", error instanceof Error ? error.message : String(error));
    failures.push("API connectivity");
  }
}

console.log(`\nPreflight: ${failures.length} failure(s), ${warnings.length} warning(s)`);
if (failures.length) process.exitCode = 1;
