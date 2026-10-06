import hashlib
import hmac
import importlib.util
import json
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import threading
import unittest

spec = importlib.util.spec_from_file_location("smohix", Path(__file__).parents[1] / "public/sdk/smohix.py")
sdk = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sdk)

class Handler(BaseHTTPRequestHandler):
    calls = []
    def log_message(self, *args):
        pass
    def do_GET(self):
        self.calls.append((self.path, self.headers.get("Authorization"), b"", None))
        if self.path == "/api/reasoning/health":
            self.send_response(302)
            self.send_header("Location", "/credential-target")
            self.end_headers()
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"ok":true}')
    def do_POST(self):
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        self.calls.append((self.path, self.headers.get("Authorization"), body, self.headers.get("X-Smohix-Signature")))
        self.send_response(201)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"incident_id":"test"}')

class SdkTests(unittest.TestCase):
    def test_credentials_bodies_signatures_and_redirects(self):
        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            client = sdk.SmohixClient(f"http://127.0.0.1:{server.server_port}", api_key="smohix_sk_test", ingest_token="smohix_ingest_test", signing_secret="test-secret")
            self.assertTrue(client.health()["ok"])
            self.assertIsNone(Handler.calls[-1][1])
            client.product_status()
            self.assertIsNone(Handler.calls[-1][1])
            self.assertEqual(client.ingest_alert({"title":"Test"})["incident_id"], "test")
            path, auth, body, signature = Handler.calls[-1]
            self.assertEqual(path, "/api/integrations/alerts")
            self.assertEqual(auth, "Bearer smohix_ingest_test")
            self.assertEqual(json.loads(body), {"title":"Test"})
            self.assertEqual(signature, "sha256="+hmac.new(b"test-secret", body, hashlib.sha256).hexdigest())
            with self.assertRaises(sdk.SmohixHttpError) as error:
                client.reasoning_health()
            self.assertEqual(error.exception.status, 302)
            self.assertEqual(len(Handler.calls), 4)
            self.assertNotIn("/credential-target", [c[0] for c in Handler.calls])
            with self.assertRaises(ValueError):
                sdk.SmohixClient("http://example.com")
            with self.assertRaises(ValueError):
                sdk.SmohixClient(ingest_token="smohix_sk_wrong").ingest_alert({"title":"x"})
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

if __name__ == "__main__":
    unittest.main()
