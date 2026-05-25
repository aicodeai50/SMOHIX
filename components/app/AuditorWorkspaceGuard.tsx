"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  AUDITOR_WORKSPACE_HOME,
  isAuditorWorkspaceRole,
  isPathAllowedForAuditor,
} from "@/lib/org/auditor-workspace";
import type { OrgRole } from "@/lib/org/roles";

export function AuditorWorkspaceGuard({
  orgRole,
  children,
}: {
  orgRole: OrgRole | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isAuditorWorkspaceRole(orgRole)) return;
    if (!isPathAllowedForAuditor(pathname)) {
      router.replace(AUDITOR_WORKSPACE_HOME);
    }
  }, [orgRole, pathname, router]);

  if (isAuditorWorkspaceRole(orgRole) && !isPathAllowedForAuditor(pathname)) {
    return null;
  }

  return <>{children}</>;
}
