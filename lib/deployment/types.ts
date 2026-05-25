export type DeploymentTier = "standard" | "regulated" | "fedramp_ready";

export type DataBoundary = "shared" | "dedicated_project" | "gov_cloud";

export type DeploymentRegion = {
  id: string;
  label: string;
  provider: "aws" | "azure" | "gcp";
  fedrampEligible: boolean;
  govCloud: boolean;
};

export type OrgDeploymentProfile = {
  orgId: string;
  orgName: string;
  deploymentTier: DeploymentTier;
  dataRegion: string;
  dataBoundary: DataBoundary;
  boundaryNotes: string | null;
  residencyLabel: string;
  isolationLabel: string;
  complianceHints: string[];
};

export type DeploymentProfileUpdate = {
  deploymentTier: DeploymentTier;
  dataRegion: string;
  dataBoundary: DataBoundary;
  boundaryNotes?: string | null;
};
