import { normalizeAlertIngestPayload } from "../lib/integrations/alert-ingest";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const splunk = normalizeAlertIngestPayload(
  {
    search_name: "Failed logins",
    sid: "scheduler_123",
    result: { severity: "critical", host: "auth-01", _raw: "multiple failures" },
  },
  "splunk",
);
assert(splunk.title === "Failed logins", "splunk title");
assert(splunk.severity === "critical", "splunk severity");
assert(splunk.dedupe_key === "splunk:scheduler_123", "splunk dedupe");

const sentinel = normalizeAlertIngestPayload(
  {
    properties: {
      displayName: "Impossible travel",
      severity: "High",
      description: "User sign-in anomaly",
      alertId: "abc-123",
    },
  },
  "sentinel",
);
assert(sentinel.title === "Impossible travel", "sentinel title");
assert(sentinel.severity === "high", "sentinel maps High to high");
assert(sentinel.dedupe_key === "sentinel:abc-123", "sentinel dedupe");

const cs = normalizeAlertIngestPayload(
  {
    event: {
      DetectName: "Suspicious script",
      DetectId: "det-99",
      Severity: 4,
      ComputerName: "ws-44",
    },
  },
  "crowdstrike",
);
assert(cs.title === "Suspicious script", "crowdstrike title");
assert(cs.severity === "critical", "crowdstrike severity 4");
assert(cs.dedupe_key === "crowdstrike:det-99", "crowdstrike dedupe");
assert(cs.service_name === "ws-44", "crowdstrike hostname as service");

console.log("test-alert-ingest: all checks passed");
