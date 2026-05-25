import {
  computeAttestationStatus,
  defaultAttestationDueAt,
  isKnownControlId,
} from "../lib/compliance/attestation/status";
import { validateControlIdForAttestation } from "../lib/compliance/attestation/data";
import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const known = new Set(COMPLIANCE_CONTROLS.map((c) => c.id));
assert(isKnownControlId("soc2:CC6.1", known), "known soc2 control");
assert(!isKnownControlId("soc2:FAKE", known), "unknown control rejected");
assert(validateControlIdForAttestation("iso:A.8.9"), "validator accepts iso control");

const futureDue = defaultAttestationDueAt(30);
assert(computeAttestationStatus({ dueAtIso: futureDue, attestedAtIso: null }) === "pending", "pending");
assert(
  computeAttestationStatus({
    dueAtIso: "2020-01-01T00:00:00.000Z",
    attestedAtIso: null,
    now: new Date("2026-01-01"),
  }) === "overdue",
  "overdue",
);
assert(
  computeAttestationStatus({
    dueAtIso: "2020-01-01T00:00:00.000Z",
    attestedAtIso: "2026-01-02T00:00:00.000Z",
    now: new Date("2026-01-01"),
  }) === "attested",
  "attested",
);

console.log("test-control-attestation: all checks passed");
