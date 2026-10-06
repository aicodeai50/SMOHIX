/** Smohix source SDK preview. Node 20+ / browser public reads. No automatic retries. */
export class SmohixHttpError extends Error {
  constructor(status, data) {
    super(`Smohix request failed (HTTP ${status})`);
    this.name = 'SmohixHttpError';
    this.status = status;
    this.data = data;
  }
}

export class SmohixClient {
  #base; #apiKey; #ingestToken; #timeout; #fetch; #signingSecret;
  constructor({ baseUrl = 'https://smohix.run', apiKey, ingestToken, signingSecret, timeoutMs = 10000, fetch: transport = globalThis.fetch } = {}) {
    const url = new URL(baseUrl);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) ||
        url.username || url.password || url.search || url.hash || url.pathname !== '/') {
      throw new TypeError('baseUrl must be an HTTPS origin (HTTP is allowed only for loopback development).');
    }
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || typeof transport !== 'function') throw new TypeError('Invalid transport or timeout.');
    this.#base = url.origin; this.#apiKey = apiKey; this.#ingestToken = ingestToken;
    this.#signingSecret = signingSecret; this.#timeout = timeoutMs; this.#fetch = transport;
  }
  async #request(path, { method = 'GET', token, body } = {}) {
    const headers = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const rawBody = body !== undefined ? JSON.stringify(body) : undefined;
    if (path === '/api/integrations/alerts' && this.#signingSecret) {
      const encoder = new TextEncoder();
      const key = await globalThis.crypto.subtle.importKey('raw', encoder.encode(this.#signingSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const signature = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
      headers['X-Smohix-Signature'] = 'sha256=' + [...new Uint8Array(signature)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    }
    const response = await this.#fetch(this.#base + path, {
      method, headers, redirect: 'error', credentials: 'omit', cache: 'no-store',
      signal: AbortSignal.timeout(this.#timeout),
      ...(body !== undefined ? { body: rawBody } : {}),
    });
    const text = await response.text();
    let data = text;
    if (text && response.headers.get('content-type')?.includes('application/json')) {
      try { data = JSON.parse(text); } catch (error) { if (response.ok) throw error; }
    }
    if (!response.ok) throw new SmohixHttpError(response.status, data);
    return data;
  }
  #credential(token, kind) {
    const prefixes = kind === 'api' ? ['smohix_sk_', 'zentro_sk_'] : ['smohix_ingest_', 'zentro_ingest_'];
    if (typeof token !== 'string' || !prefixes.some(prefix => token.startsWith(prefix)) || /\s/.test(token)) {
      throw new TypeError(kind === 'api' ? 'Provide a Smohix API key for this proxy request.' : 'Provide a workspace ingest token for alert ingestion.');
    }
    return token;
  }
  health() { return this.#request('/api/health'); }
  productStatus() { return this.#request('/api/status/products'); }
  reasoningHealth() { return this.#request('/api/reasoning/health', { token: this.#credential(this.#apiKey, 'api') }); }
  ingestAlert(alert) {
    if (!alert || typeof alert !== 'object' || Array.isArray(alert)) throw new TypeError('alert must be a JSON object.');
    return this.#request('/api/integrations/alerts', { method: 'POST', token: this.#credential(this.#ingestToken, 'ingest'), body: alert });
  }
}

