/**
 * Backend base URLs for Railway private networking.
 * Prefer REACT_APP_* / SMOHIX_* vars; ZENTRO_* and REACT_APP_ZENTRO_* remain temporary fallbacks.
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
    firstEnv("REACT_APP_SH_BACKEND_API", "SMOHIX_REASONING_API_URL", "ZENTRO_REASONING_API_URL"),
  );
}

/** Robot automation backend — e.g. http://robot_backend.railway.internal */
export function getRobotBackendUrl(): string | null {
  return normalizeBackendBase(
    firstEnv("REACT_APP_ROBOT_BACKEND", "SMOHIX_ROBOT_API_URL", "ZENTRO_ROBOT_API_URL"),
  );
}

/** Smohix hub service — e.g. http://smohix-hub.railway.internal */
export function getSmohixHubUrl(): string | null {
  return normalizeBackendBase(firstEnv("REACT_APP_SMOHIX_HUB", "REACT_APP_ZENTRO_HUB", "SMOHIX_HUB_URL", "ZENTRO_HUB_URL"));
}

/** Centralized own-API — e.g. http://smohix-own-api.railway.internal */
export function getSmohixOwnApiUrl(): string | null {
  return normalizeBackendBase(
    firstEnv("REACT_APP_SMOHIX_OWN_API", "REACT_APP_ZENTRO_OWN_API", "SMOHIX_OWN_API_URL", "ZENTRO_OWN_API_URL"),
  );
}

export function isShBackendConfigured(): boolean {
  return Boolean(getShBackendApiUrl());
}

export function isRobotBackendConfigured(): boolean {
  return Boolean(getRobotBackendUrl());
}
