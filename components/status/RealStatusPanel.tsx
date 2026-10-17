import { fetchProductStatuses } from "@/lib/status/adapters";
import { LiveStatusPanel } from "./LiveStatusPanel";

export async function RealStatusPanel() {
  return <LiveStatusPanel initialStatuses={await fetchProductStatuses()} />;
}
