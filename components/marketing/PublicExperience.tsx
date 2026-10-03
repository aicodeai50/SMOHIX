import type { ReactNode } from 'react';
import '@/app/public-experience.css';
/** Explicit public-page scope. Authenticated workspaces retain their existing styling. */
export function PublicExperience({ children }: { children: ReactNode }) {
  return <div className="smohix-public flex min-h-screen flex-1 flex-col">{children}</div>;
}
