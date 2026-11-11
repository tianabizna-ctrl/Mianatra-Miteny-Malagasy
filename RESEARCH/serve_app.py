#!/usr/bin/env python3
"""Serve APP/ with Cache-Control: no-store headers so browsers and service
workers never serve stale HTML/JS/CSS."""

import http.server
import os
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8788
ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "APP")
os.chdir(ROOT)


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    with ThreadingHTTPServer(("0.0.0.0", PORT), NoCacheHandler) as httpd:
        print(f"Serving {ROOT} on 0.0.0.0:{PORT} (no-store)", flush=True)
        httpd.serve_forever()
