const http = require("http");
const fs = require("fs");
const url = require("url");

// --- Resource discovery (mirrors the Python os.listdir loops) ---
const validResources = {
    "/style.css": "text/css",
    "/script.js": "application/javascript",
};

const textTypes = new Set([
    "text/css",
    "application/javascript",
    "text/html",
    "text/plain",
]);

function registerDir(dir, pattern, mime) {
    for (const file of fs.readdirSync(dir)) {
        if (pattern.test(file.toLowerCase())) {
            validResources[`/${dir}/${file}`] = mime;
        }
    }
}

registerDir("dokumente", /\.pdf$/, "application/pdf");
registerDir("bilder", /\.webp$/, "image/webp");
registerDir("bilder/galerie", /\.webp$/, "image/webp");
registerDir("bilder/news", /\.webp$/, "image/webp");
registerDir("fonts", /\.woff2$/, "font/woff2");

// --- In-memory cache ---
const resourceCache = {};
const pageCache = {};

// --- Logging ---
const logStream = fs.createWriteStream("server.log", { flags: "a" });
function log(ip, message) {
    logStream.write(`${ip} - ${message}\n`);
}

// --- Handlers ---
function handlePage(_req, res, filePath) {
    if (!pageCache[filePath]) {
        pageCache[filePath] = fs.readFileSync(filePath.replace(/^\//, ""), "utf8");
    }
    const data = Buffer.from(pageCache[filePath], "utf8");
    res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Length": data.length,
    });
    res.end(data);
}

function handleResource(_req, res, resourcePath) {
    const mime = validResources[resourcePath];
    if (!mime) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("404 Not Found");
        return;
    }

    if (!resourceCache[resourcePath]) {
        resourceCache[resourcePath] = fs.readFileSync(resourcePath.replace(/^\//, ""));
    }
    const data = resourceCache[resourcePath];
    const contentType = textTypes.has(mime) ? `${mime}; charset=utf-8` : mime;

    res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": data.length,
    });
    res.end(data);
}

// --- Routes ---
const ROUTES = {
    "/": (req, res) => handlePage(req, res, "index.html"),
    "/startseite": (req, res) => handlePage(req, res, "index.html"),
    "/zeltlager": (req, res) => handlePage(req, res, "zeltlager.html"),
    "/aktuelles": (req, res) => handlePage(req, res, "aktuelles.html"),
    "/impressum": (req, res) => handlePage(req, res, "impressum.html"),
};

// --- Server ---
const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true);
    const host = req.headers["host"] || "";

    // www redirect
    if (host.startsWith("www.")) {
        res.writeHead(301, { Location: `https://kjg-lautzkirchen.de${req.url}` });
        res.end();
        return;
    }

    log(req.socket.remoteAddress, `${req.method} ${req.url}`);

    const route = ROUTES[parsed.pathname];
    if (route) {
        route(req, res);
    } else {
        handleResource(req, res, parsed.pathname);
    }
});

server.listen(8080, "0.0.0.0", () => {
    console.log("Serving HTTP on http://localhost:8080");
});
