#!/usr/bin/env python3
"""Tiny static server for My Device Hub.

Serves the single-file app at every path, so the live preview lands directly on
the dashboard. Opened from a real browser origin, localStorage, the clipboard
API and (on supported browsers) Web Bluetooth all work normally.
"""
import http.server, socketserver, os

APP = os.path.join(os.path.dirname(os.path.abspath(__file__)), "my-device-hub.html")
PORT = int(os.environ.get("PORT", "8000"))

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            with open(APP, "rb") as fh:
                body = fh.read()
        except OSError:
            self.send_error(404, "app file missing")
            return
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Permissions-Policy", "bluetooth=(self), geolocation=(self), clipboard-write=(self)")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        pass

class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

if __name__ == "__main__":
    with Server(("0.0.0.0", PORT), Handler) as httpd:
        print(f"My Device Hub serving on http://0.0.0.0:{PORT}")
        httpd.serve_forever()
