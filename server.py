import http.server
import os
from urllib.parse import urlparse, parse_qs

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

print("const images = [")
for img in os.listdir("bilder/galerie"):
    if img.lower().endswith((".webp")):
        print(f'    "{img}",')
        valid_resources[f"/bilder/galerie/{img}"] = "image/webp"
print("]")

for img in os.listdir("bilder/news"):
    if img.lower().endswith((".webp")):
        valid_resources[f"/bilder/news/{img}"] = "image/webp"

for fonts in os.listdir("fonts"):
    if fonts.lower().endswith(".ttf"):
        valid_resources[f"/fonts/{fonts}"] = "font/ttf"


def handle_page(req, params, page):
    req.send_response(200)
    req.send_header("Content-Type", "text/html; charset=utf-8")
    req.end_headers()
    file = open(page, "r").read()
    req.wfile.write(file.encode())


def handle_resource(req, params, resource):
    if resource in valid_resources:
        mime = valid_resources[resource]
        content_type = mime + "; charset=utf-8" if mime in text_types else mime
        req.send_response(200)
        req.send_header("Content-Type", content_type)
        req.end_headers()
        with open(resource.lstrip("/"), "rb") as f:
            req.wfile.write(f.read())
    else:
        req.send_response(404)
        req.send_header("Content-Type", "text/plain; charset=utf-8")
        req.end_headers()
        req.wfile.write(b"404 Not Found")


ROUTES = {
    "/": lambda req, params: handle_page(req, params, "index.html"),
    "/startseite": lambda req, params: handle_page(req, params, "index.html"),
    "/zeltlager": lambda req, params: handle_page(req, params, "zeltlager.html"),
    "/aktuelles": lambda req, params: handle_page(req, params, "aktuelles.html"),
    "/impressum": lambda req, params: handle_page(req, params, "impressum.html"),
}

# --- Server ---


logfile = open("server.log", "a")


class Handler(http.server.BaseHTTPRequestHandler):
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
            handle_resource(self, params, parsed.path)

    def do_POST(self):
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        route = ROUTES.get(parsed.path)

        if route:
            route(self, {}, body)
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        logfile.write(f"{self.client_address[0]} - {format % args}\n")
        logfile.flush()


if __name__ == "__main__":
    server = http.server.HTTPServer(("0.0.0.0", 8080), Handler)
    print("Serving HTTP on http://localhost:8080")
    server.serve_forever()
