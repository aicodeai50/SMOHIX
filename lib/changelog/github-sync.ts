/**
 * GitHub release → changelog draft adapter (manual review required).
 *
 * Workflow:
 *   GitHub release → syncGithubReleasesToDrafts() → human review → publish to CHANGELOG_ENTRIES
 *
 * Do not auto-publish unreviewed GitHub content.
 */

import type { ChangelogCategory, ChangelogChangeType, ChangelogEntry } from "@/lib/changelog-data";

export type GithubRelease = {
  tagName: string;
  name: string;
  body: string;
  publishedAt: string;
};

export type ChangelogDraft = Omit<ChangelogEntry, "date"> & {
  sourceTag: string;
  publishedAt: string;
  reviewStatus: "draft";
};

export type GithubChangelogSyncOptions = {
  repo?: string;
  token?: string;
  since?: string;
};

/** Fetch releases from GitHub API — requires GITHUB_TOKEN server-side. */
export async function fetchGithubReleases(
  options: GithubChangelogSyncOptions = {},
): Promise<GithubRelease[]> {
  const repo = options.repo ?? process.env.GITHUB_CHANGELOG_REPO ?? "aicodeai50/ZENTRO";
  const token = options.token ?? process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN not configured");
  }

  const res = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=20`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }

  const json = (await res.json()) as Array<{
    tag_name: string;
    name: string;
    body: string;
    published_at: string;
  }>;

  return json.map((r) => ({
    tagName: r.tag_name,
    name: r.name,
    body: r.body ?? "",
    publishedAt: r.published_at,
  }));
}

/** Map release body bullets to draft entries — human must categorize before publish. */
export function mapReleaseToDraft(release: GithubRelease): ChangelogDraft {
  const bullets = release.body
    .split("\n")
    .map((l) => l.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);

  return {
    sourceTag: release.tagName,
    publishedAt: release.publishedAt,
    reviewStatus: "draft",
    title: release.name || release.tagName,
    categories: ["zentro-run"] as ChangelogCategory[],
    changeTypes: ["improved"] as ChangelogChangeType[],
    bullets: bullets.length > 0 ? bullets : [`Release ${release.tagName}`],
  };
}

export async function syncGithubReleasesToDrafts(
  options?: GithubChangelogSyncOptions,
): Promise<ChangelogDraft[]> {
  const releases = await fetchGithubReleases(options);
  return releases.map(mapReleaseToDraft);
}
