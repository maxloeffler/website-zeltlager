import http from 'http';
import fs from 'fs';
import url from 'url';
import crypto from 'crypto';
import Mailer from "./mailer.js";


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
registerDir("bilder/galerie/2022", /\.webp$/, "image/webp");
registerDir("bilder/galerie/2024", /\.webp$/, "image/webp");
registerDir("bilder/galerie/2025", /\.webp$/, "image/webp");
registerDir("bilder/galerie/2026", /\.webp$/, "image/webp");
registerDir("bilder/team", /\.webp$/, "image/webp");
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
function handlePage(res, filePath, headers = {}) {
    if (!pageCache[filePath]) {
        pageCache[filePath] = fs.readFileSync(filePath.replace(/^\//, ""), "utf8");
    }
    const data = Buffer.from(pageCache[filePath], "utf8");
    res.writeHead(200, {
        ...headers,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Length": data.length,
    });
    res.end(data);
}

function handleResource(res, resourcePath) {
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

const sessionTokens = {};

function handleLogin(req, res, resourcePath, successPath) {
    if (req.method !== "POST") {
        handlePage(res, resourcePath);
    } else {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const params = new URLSearchParams(body);
            const user = params.get('name');
            const password = params.get('password');

            if (mailer.validate(user, password)) {
                const token = crypto.randomBytes(16).toString('hex');
                sessionTokens[token] = { user, expiresAt: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
                handlePage(res, successPath, { "Set-Cookie": `session=${token}; HttpOnly; Secure; SameSite=Strict` });
            }
        });
    }
}

function handleMail(req, res, resourecePath, fallbackPath) {
    const cookies = Object.fromEntries(req.headers.cookie?.split('; ').map(c => c.split('=')) || []);
    const session = sessionTokens[cookies.session || ""];

    if (!session || session.expiresAt < Date.now()) {
        sessionTokens[cookies.session] = null;
        handlePage(res, fallbackPath, { "Set-Cookie": `session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });
    } else {
        handlePage(res, resourecePath, { "Set-Cookie": `session=${cookies.session}; HttpOnly; Secure; SameSite=Strict` });
    }
}


// --- Routes ---
const ROUTES = {
    "/": (_req, res) => handlePage(res, "index.html"),
    "/startseite": (_req, res) => handlePage(res, "index.html"),
    "/zeltlager": (_req, res) => handlePage(res, "zeltlager.html"),
    "/team": (_req, res) => handlePage(res, "team.html"),
    "/aktuelles": (_req, res) => handlePage(res, "aktuelles.html"),
    "/impressum": (_req, res) => handlePage(res, "impressum.html"),
    "/login": async (req, res) => { handleLogin(req, res, "login.html", "mail.html") },
    "/mail": async (req, res) => { handleMail(req, res, "mail.html", "login.html") },
    "/favicon.ico": (_req, res) => handleResource(res, "/bilder/seelenbohrer.webp")
};

// --- Start Server ---
const mailer = new Mailer();
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
        handleResource(res, parsed.pathname);
    }
});

server.listen(8080, "0.0.0.0", () => {
    console.log("Serving HTTP on http://localhost:8080");
});
