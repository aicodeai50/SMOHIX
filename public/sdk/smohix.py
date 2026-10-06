"""Smohix source SDK preview. Python 3.10+, standard library only. No retries."""
import hashlib
import hmac
import json
import math
import urllib.error
import urllib.parse
import urllib.request


class SmohixHttpError(Exception):
    def __init__(self, status, data):
        super().__init__(f"Smohix request failed (HTTP {status})")
        self.status = status
        self.data = data


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class SmohixClient:
    def __init__(self, base_url="https://smohix.run", api_key=None, ingest_token=None, timeout=10, signing_secret=None):
        url = urllib.parse.urlsplit(base_url)
        local = url.hostname in ("localhost", "127.0.0.1", "::1")
        if (url.scheme != "https" and not (url.scheme == "http" and local)) or not url.hostname or url.username or url.password or url.query or url.fragment or url.path not in ("", "/"):
            raise ValueError("base_url must be an HTTPS origin (HTTP only for loopback development).")
        if not math.isfinite(timeout) or timeout <= 0:
            raise ValueError("timeout must be finite and positive")
        self._base = base_url.rstrip("/")
        self._api_key = api_key
        self._ingest_token = ingest_token
        self._signing_secret = signing_secret
        self._timeout = timeout
        self._opener = urllib.request.build_opener(_NoRedirect())

    @staticmethod
    def _credential(token, kind):
        prefixes = ("smohix_sk_", "zentro_sk_") if kind == "api" else ("smohix_ingest_", "zentro_ingest_")
        if not isinstance(token, str) or not token.startswith(prefixes) or any(c.isspace() for c in token):
            raise ValueError("Provide the correct Smohix API key or workspace ingest token for this request.")
        return token

    def _request(self, path, method="GET", token=None, body=None):
        headers = {"Accept": "application/json"}
        if token:
            headers["Authorization"] = "Bearer " + token
        data = None
        if body is not None:
            headers["Content-Type"] = "application/json"
            data = json.dumps(body).encode("utf-8")
        if path == "/api/integrations/alerts" and self._signing_secret:
            headers["X-Smohix-Signature"] = "sha256=" + hmac.new(self._signing_secret.encode("utf-8"), data, hashlib.sha256).hexdigest()
        request = urllib.request.Request(self._base + path, data=data, headers=headers, method=method)
        try:
            with self._opener.open(request, timeout=self._timeout) as response:
                text = response.read().decode("utf-8")
                return json.loads(text) if text and "application/json" in response.headers.get("Content-Type", "") else text
        except urllib.error.HTTPError as error:
            text = error.read().decode("utf-8", errors="replace")
            try:
                payload = json.loads(text)
            except ValueError:
                payload = text
            raise SmohixHttpError(error.code, payload) from None

    def health(self):
        return self._request("/api/health")

    def product_status(self):
        return self._request("/api/status/products")

    def reasoning_health(self):
        return self._request("/api/reasoning/health", token=self._credential(self._api_key, "api"))

    def ingest_alert(self, alert):
        if not isinstance(alert, dict):
            raise ValueError("alert must be a JSON object")
        return self._request("/api/integrations/alerts", method="POST", token=self._credential(self._ingest_token, "ingest"), body=alert)

