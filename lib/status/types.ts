export type OperationalStatus =
  | "operational"
  | "degraded"
  | "unavailable"
  | "unknown"
  | "prototype"
  | "planned";

export type ProductStatusResult = {
  productId: string;
  label: string;
  status: OperationalStatus;
  detail: string;
  lastChecked: string;
  href: string;
};
