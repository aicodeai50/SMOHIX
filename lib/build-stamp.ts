/**
 * Short git ref when the host injects it (Railway / Vercel). Lets you confirm the live
 * deploy from the UI without opening logs.
 */
export function getPublicDeployRef(): string | null {
  const sha =
    process.env.RAILWAY_GIT_COMMIT_SHA?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.NEXT_PUBLIC_DEPLOY_REF?.trim();
  if (sha && sha.length >= 7) return sha.slice(0, 7);
  if (sha && sha.length > 0) return sha;
  return null;
}
