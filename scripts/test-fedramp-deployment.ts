import { validateDeploymentProfileUpdate } from "../lib/deployment/profile";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const ok = validateDeploymentProfileUpdate({
  deploymentTier: "regulated",
  dataRegion: "us-east-1",
  dataBoundary: "dedicated_project",
});
assert(ok.ok === true, "regulated + dedicated + commercial region ok");

const fedrampOk = validateDeploymentProfileUpdate({
  deploymentTier: "fedramp_ready",
  dataRegion: "us-gov-east-1",
  dataBoundary: "gov_cloud",
});
assert(fedrampOk.ok === true, "fedramp_ready requires gov boundary + gov region");

const fedrampBad = validateDeploymentProfileUpdate({
  deploymentTier: "fedramp_ready",
  dataRegion: "us-east-1",
  dataBoundary: "shared",
});
assert(fedrampBad.ok === false, "fedramp_ready rejects commercial shared");

const govBad = validateDeploymentProfileUpdate({
  deploymentTier: "standard",
  dataRegion: "us-east-1",
  dataBoundary: "gov_cloud",
});
assert(govBad.ok === false, "gov boundary rejects commercial region");

console.log("test-fedramp-deployment: all checks passed");
