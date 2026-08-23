import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const sourceRoots = [path.join(projectRoot, "app"), path.join(projectRoot, "backend", "src", "main", "java")];
const failures = [];

const forbiddenPatterns = [
  [/noTitleCloud/, "NoTitle Java package reference"],
  [/cloud\.1472\.ai/i, "shared cloud-api host"],
  [/\bTOSS_PAYMENTS_(?:LIVE|TEST)_SECRET_KEY\b/, "shared Toss environment variable"],
  [/\bHEALTH_BOX_TOSS_SECRET_KEY\b/, "legacy HealthBox Toss environment variable"],
  [/\bFILE_(?:UPLOAD_API|CDN)_BASE_URL\b/, "shared upload environment variable"],
  [/\bPaymentService\b/, "generic shared payment service type"],
  [/jdbc:mariadb:\/\/[^\r\n]*(?:\/cloud|\/sotong)(?:[?\s]|$)/i, "shared database JDBC URL"],
];

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(target) : [target];
    }),
  );
  return nested.flat();
}

for (const sourceRoot of sourceRoots) {
  for (const file of await listFiles(sourceRoot)) {
    if (!/\.(?:java|ts|tsx)$/.test(file)) continue;
    const source = await readFile(file, "utf8");
    for (const [pattern, label] of forbiddenPatterns) {
      if (pattern.test(source)) {
        failures.push(`${path.relative(projectRoot, file)}: ${label}`);
      }
    }
  }
}

const backendPropertiesPath = path.join(projectRoot, "backend", "src", "main", "resources", "application.properties");
const backendProperties = await readFile(backendPropertiesPath, "utf8");
if (!/^spring\.datasource\.url=\$\{HEALTH_BOX_DB_URL\}$/m.test(backendProperties)) {
  failures.push("backend application.properties: dedicated HEALTH_BOX_DB_URL without fallback is required");
}

const backendMainPath = path.join(projectRoot, "backend", "src", "main", "java", "healthBoxApi", "HealthBoxApiApplication.java");
const backendMain = await readFile(backendMainPath, "utf8");
const guardPosition = backendMain.indexOf("HealthBoxDatabaseIsolationGuard.validate(");
const springPosition = backendMain.indexOf("SpringApplication.run(");
if (guardPosition < 0 || springPosition < 0 || guardPosition > springPosition) {
  failures.push("HealthBoxApiApplication: DB isolation guard must run before Spring starts");
}

const internalGuardPosition = backendMain.indexOf("HealthBoxInternalApiKeyGuard.validate(");
if (internalGuardPosition < 0 || springPosition < 0 || internalGuardPosition > springPosition) {
  failures.push("HealthBoxApiApplication: internal API key guard must run before Spring starts");
}

if (failures.length) {
  for (const failure of failures) console.error(`[FAIL] ${failure}`);
  console.error(`\nIsolation verification failed with ${failures.length} issue(s).`);
  process.exitCode = 1;
} else {
  console.log("[PASS] HealthBox source, payment, API, upload, and DB boundaries are isolated.");
}
