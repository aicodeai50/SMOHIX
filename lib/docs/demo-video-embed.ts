/**
 * Parses DEMO_VIDEO_URL (or legacy NEXT_PUBLIC_DEMO_VIDEO_URL) into an iframe or <video> source for /docs/demo.
 * Supports YouTube (watch, youtu.be, shorts, embed), Vimeo, Loom share, and direct .mp4/.webm/.ogg URLs.
 */

export type DemoVideoEmbed =
  | { kind: "iframe"; src: string }
  | { kind: "video"; src: string };

function youtubeEmbedSrc(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.replace(/^\//, "").split("/")[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (!host.endsWith("youtube.com")) return null;
  if (url.pathname.startsWith("/embed/")) {
    return url.toString();
  }
  if (url.pathname.startsWith("/shorts/")) {
    const id = url.pathname.split("/").filter(Boolean)[1];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  const v = url.searchParams.get("v");
  return v ? `https://www.youtube.com/embed/${v}` : null;
}

function vimeoEmbedSrc(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (!host.endsWith("vimeo.com")) return null;
  if (url.hostname.startsWith("player.")) {
    return url.toString();
  }
  const m = url.pathname.match(/^\/(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}` : null;
}

function loomEmbedSrc(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (!host.endsWith("loom.com")) return null;
  const m = url.pathname.match(/\/(?:share|embed)\/([^/?]+)/);
  return m ? `https://www.loom.com/embed/${m[1]}` : null;
}

function isDirectVideoUrl(url: URL): boolean {
  return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url.pathname) || /\.(mp4|webm|ogg)(\?|#|$)/i.test(url.href);
}

/**
 * Returns null when unset or invalid — page hides the video block.
 */
export function getDemoVideoEmbed(raw: string | undefined): DemoVideoEmbed | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (!/^https?:$/i.test(url.protocol)) {
    return null;
  }

  if (isDirectVideoUrl(url)) {
    return { kind: "video", src: url.toString() };
  }

  const yt = youtubeEmbedSrc(url);
  if (yt) return { kind: "iframe", src: yt };

  const vm = vimeoEmbedSrc(url);
  if (vm) return { kind: "iframe", src: vm };

  const loom = loomEmbedSrc(url);
  if (loom) return { kind: "iframe", src: loom };

  return null;
}
