import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export async function runPolicyReviewFlowChecks(root) {
  const [policyReviewUrlSource, actionsSource, policiesPageSource, notesFieldSource] =
    await Promise.all([
      readFile(path.join(root, "lib/approvals/policy-review-url.ts"), "utf8"),
      readFile(path.join(root, "app/(app)/governance/policies/actions.ts"), "utf8"),
      readFile(path.join(root, "app/(app)/governance/policies/page.tsx"), "utf8"),
      readFile(path.join(root, "app/(app)/governance/policies/PolicyReviewerNotesField.tsx"), "utf8"),
    ]);

  assert(
    policyReviewUrlSource.includes("export function cleanedPolicyReviewQueryString"),
    "missing cleanedPolicyReviewQueryString",
  );
  assert(
    policyReviewUrlSource.includes("export function invalidMaxBlastRedirectPath"),
    "missing invalidMaxBlastRedirectPath",
  );
  assert(
    policyReviewUrlSource.includes('error: "invalid_max_blast"'),
    "invalid-max-blast redirect helper must set error code",
  );
  assert(
    policyReviewUrlSource.includes("next.delete(\"error\")"),
    "policy review URL cleanup must clear error param",
  );
  assert(
    policyReviewUrlSource.includes("next.delete(\"sid\")"),
    "policy review URL cleanup must clear sid param",
  );
  assert(
    policyReviewUrlSource.includes("next.delete(\"notes\")"),
    "policy review URL cleanup must clear notes param",
  );
  assert(
    policyReviewUrlSource.includes("next.delete(\"seed_reason\")"),
    "policy review URL cleanup must clear seed_reason param",
  );
  assert(
    policyReviewUrlSource.includes("next.delete(\"seed_note\")"),
    "policy review URL cleanup must clear seed_note param",
  );
  assert(
    actionsSource.includes("invalidMaxBlastRedirectPath"),
    "server action must use shared invalid-max-blast redirect helper",
  );
  assert(
    policiesPageSource.includes("clearValidationParamsOnEdit"),
    "policies page must enable URL cleanup on edited failed form",
  );
  assert(
    policiesPageSource.includes("seed_reason"),
    "policies page should accept reason-seeded deep links",
  );
  assert(
    policiesPageSource.includes("seed_note"),
    "policies page should accept note-seeded deep links",
  );
  assert(
    notesFieldSource.includes('from "@/lib/approvals/policy-scope"'),
    "reviewer notes field must use shared blast scope parser",
  );
  assert(
    notesFieldSource.includes("hasMaxBlastToken"),
    "reviewer notes field should use shared max-blast token detection",
  );
  assert(
    notesFieldSource.includes("router.replace"),
    "notes field should clear stale validation params from URL",
  );
  assert(
    notesFieldSource.includes("cleanedPolicyReviewQueryString"),
    "notes field should use shared URL cleanup helper",
  );
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

if (process.argv[1] === __filename) {
  runPolicyReviewFlowChecks(root)
    .then(() => {
      console.log("test-policy-review-flow: all checks passed");
    })
    .catch((error) => {
      console.error(`test-policy-review-flow: FAILED\n${error.message}`);
      process.exitCode = 1;
    });
}
