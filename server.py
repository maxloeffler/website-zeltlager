from socketserver import ThreadingMixIn
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading
import os

# --- Define your routes here ---

valid_resources = {
    "/style.css": "text/css",
    "/script.js": "application/javascript",
}
text_types = {"text/css", "application/javascript", "text/html", "text/plain"}


for doc in os.listdir("dokumente"):
    if doc.lower().endswith(".pdf"):
        valid_resources[f"/dokumente/{doc}"] = "application/pdf"

for img in os.listdir("bilder"):
    if img.lower().endswith((".webp")):
        valid_resources[f"/bilder/{img}"] = "image/webp"

for img in os.listdir("bilder/galerie"):
    if img.lower().endswith((".webp")):
        valid_resources[f"/bilder/galerie/{img}"] = "image/webp"

for img in os.listdir("bilder/news"):
    if img.lower().endswith((".webp")):
        valid_resources[f"/bilder/news/{img}"] = "image/webp"

for fonts in os.listdir("fonts"):
    if fonts.lower().endswith(".woff2"):
        valid_resources[f"/fonts/{fonts}"] = "font/woff2"


logfile = open("server.log", "a")
cache_lock = threading.Lock()
resources = {}
pages = {}


def handle_page(req, page):
    with cache_lock:
        if page not in pages:
            with open(page.lstrip("/"), "r") as file:
                pages[page] = file.read().encode()
        data = pages[page]
    req.send_response(200)
    req.send_header("Content-Type", "text/html; charset=utf-8")
    req.send_header("Content-Length", str(len(data)))
    req.end_headers()
    req.wfile.write(data)


def handle_resource(req, resource):
    if resource in valid_resources:
        with cache_lock:
            if resource not in resources:
                with open(resource.lstrip("/"), "rb") as file:
                    resources[resource] = file.read()
            data = resources[resource]
        mime = valid_resources[resource]
        content_type = mime + "; charset=utf-8" if mime in text_types else mime
        req.send_response(200)
        req.send_header("Content-Type", content_type)
        req.send_header("Content-Length", str(len(data)))
        req.end_headers()
        req.wfile.write(data)
    else:
        req.send_response(404)
        req.send_header("Content-Type", "text/plain; charset=utf-8")
        req.end_headers()
        req.wfile.write(b"404 Not Found")


ROUTES = {
    "/": lambda req, _: handle_page(req, "index.html"),
    "/startseite": lambda req, _: handle_page(req, "index.html"),
    "/zeltlager": lambda req, _: handle_page(req, "zeltlager.html"),
    "/aktuelles": lambda req, _: handle_page(req, "aktuelles.html"),
    "/impressum": lambda req, _: handle_page(req, "impressum.html"),
}


# --- Server ---
class Handler(BaseHTTPRequestHandler):
    timeout = 10

    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        route = ROUTES.get(parsed.path)

        if self.headers.get("Host", "").startswith("www."):
            self.send_response(301)
            self.send_header("Location", f"https://kjg-lautzkirchen.de{self.path}")
            self.end_headers()
            return

        if route:
            route(self, params)
        else:
            handle_resource(self, parsed.path)

    def log_message(self, format, *args):
        logfile.write(f"{self.client_address[0]} - {format % args}\n")
        logfile.flush()


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    block_on_close = False
    max_children = 50


if __name__ == "__main__":
    server = ThreadedHTTPServer(("0.0.0.0", 8080), Handler)
    print("Serving HTTP on http://localhost:8080")
    server.serve_forever()
