import type { ReactNode } from 'react';
import '@/app/public-experience.css';
/** Public-page layout using the shared, readable platform palette. */
export function PublicExperience({ children }: { children: ReactNode }) {
  return <div className="smohix-public flex min-h-screen flex-1 flex-col">{children}</div>;
}
