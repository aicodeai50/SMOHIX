/**
 * Backend base URLs for Railway private networking.
 * Prefer REACT_APP_* vars (set on the SHYNVO/Zentro service); ZENTRO_* names are legacy fallbacks.
 */

function firstEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = process.env[key]?.trim();
    if (v) return v;
  }
  return undefined;
}

export function normalizeBackendBase(url: string | undefined | null): string | null {
  const t = url?.trim();
  if (!t) return null;
  return t.replace(/\/+$/, "");
}

/** SH / reasoning API — e.g. http://sh-backend-api.railway.internal */
export function getShBackendApiUrl(): string | null {
  return normalizeBackendBase(
    firstEnv("REACT_APP_SH_BACKEND_API", "ZENTRO_REASONING_API_URL"),
  );
}

/** Robot automation backend — e.g. http://robot_backend.railway.internal */
export function getRobotBackendUrl(): string | null {
  return normalizeBackendBase(
    firstEnv("REACT_APP_ROBOT_BACKEND", "ZENTRO_ROBOT_API_URL"),
  );
}

/** Zentro hub service — e.g. http://zentro-hub.railway.internal */
export function getZentroHubUrl(): string | null {
  return normalizeBackendBase(firstEnv("REACT_APP_ZENTRO_HUB", "ZENTRO_HUB_URL"));
}

/** Centralized own-API — e.g. http://zentro-own-api.railway.internal */
export function getZentroOwnApiUrl(): string | null {
  return normalizeBackendBase(
    firstEnv("REACT_APP_ZENTRO_OWN_API", "ZENTRO_OWN_API_URL"),
  );
}

export function isShBackendConfigured(): boolean {
  return Boolean(getShBackendApiUrl());
}

export function isRobotBackendConfigured(): boolean {
  return Boolean(getRobotBackendUrl());
}
