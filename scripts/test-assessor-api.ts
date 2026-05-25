import {
  ASSESSOR_API_KEY_PREFIX,
  displayAssessorKeyPrefix,
  generateAssessorApiKeyPlaintext,
  hashApiKeyPlaintext,
} from "../lib/api-keys/token";
import { extractAssessorApiKey } from "../lib/api-keys/resolve";
import {
  ASSESSOR_API_RESOURCES,
  isAssessorApiResource,
} from "../lib/compliance/assessor-api-serve";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const plain = generateAssessorApiKeyPlaintext();
assert(plain.startsWith(ASSESSOR_API_KEY_PREFIX), "assessor key prefix");
assert(displayAssessorKeyPrefix(plain).includes("zentro_ca_"), "display prefix");
assert(hashApiKeyPlaintext(plain).length === 64, "sha256 hash hex");

const headers = new Headers({ authorization: `Bearer ${plain}` });
assert(extractAssessorApiKey({ headers }) === plain, "extract bearer assessor key");

assert(ASSESSOR_API_RESOURCES.length >= 10, "at least ten export resources");
assert(isAssessorApiResource("evidence-export"), "evidence-export allowed");
assert(isAssessorApiResource("workbook"), "workbook allowed");
assert(isAssessorApiResource("risk-heatmap"), "risk-heatmap allowed");
assert(isAssessorApiResource("executive-summary"), "executive-summary allowed");
assert(isAssessorApiResource("obligation-ics"), "obligation-ics allowed");
assert(!isAssessorApiResource("admin-delete"), "unknown resource rejected");

assert(
  isPathAllowedForAuditor("/governance/compliance/assessor-api"),
  "auditor can open assessor API settings",
);

console.log("test-assessor-api: all checks passed");
