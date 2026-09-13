const http = require("http");
const fs = require("fs");
const url = require("url");

// --- In-memory cache ---
const resourceCache = {};
const pageCache = {};

// --- Resource discovery (mirrors the Python os.listdir loops) ---
const validResources = {
    "/style.css": "text/css",
    "/script.js": "application/javascript",
};
const validAPIs = {};

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
function registerAPI(path, responseType, action, method = "GET") {
    validAPIs[path] = { "action": action, "responseType": responseType, "method": method };
}


// --- Static Resources ---
registerDir("dokumente", /\.pdf$/, "application/pdf");
registerDir("bilder", /\.webp$/, "image/webp");
registerDir("bilder/team", /\.webp$/, "image/webp");
registerDir("bilder/news", /\.webp$/, "image/webp");
registerDir("fonts", /\.woff2$/, "font/woff2");

// --- Dynamic Resources ---
const images = [];
const lastImages = [];
fs.readdirSync("bilder/galerie")
    .filter((name) => /^\d{4}$/.test(name))
    .map((year) => {
        const yearDir = `bilder/galerie/${year}`;
        fs.readdirSync(yearDir)
            .filter((name) => /\.webp$/.test(name))
            .map((name) => images.push(`/${yearDir}/${name}`));
    });

registerAPI("reel-image", "application/json", (args) => {
    let randomIndex = Math.floor(Math.random() * images.length);
    while (lastImages.includes(randomIndex)) {
        randomIndex = Math.floor(Math.random() * images.length);
    }
    lastImages.shift();
    lastImages.push(randomIndex);

    const imageName = images[randomIndex].replace(/^\//, "");
    if (!resourceCache[imageName]) {
        resourceCache[imageName] = fs.readFileSync(imageName);
    }
    return {
        "image": resourceCache[imageName].toString("base64"),
        "year": imageName.match(/\/(\d{4})\//)[1] || ""
    };
});

// --- Logging ---
const logStream = fs.createWriteStream("server.log", { flags: "a" });
function log(ip, message) {
    logStream.write(`${ip} - ${message}\n`);
}

// --- Handlers ---
function handlePage(res, filePath) {
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

function handleAPI(req, res) {
    const parsedUrl = new url.URL(req.url, `https://${req.headers.host}`);
    const apiPath = parsedUrl.pathname.replace("/api/", "");
    const args = parsedUrl.query;

    const api = validAPIs[apiPath];
    if (!api) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("404 Not Found");
        return;
    }

    if (req.method !== validAPIs[apiPath].method) {
        res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("405 Method Not Allowed");
        return;
    }

    const mime = api["responseType"];
    if (!mime) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("500 Internal Server Error");
        return;
    }

    const apiResult = api["action"](args);

    res.writeHead(200, {
        "Content-Type": mime,
        "Content-Length": JSON.stringify(apiResult).length
    });
    res.end(JSON.stringify(apiResult));
}

// --- Routes ---
const ROUTES = {
    "/": (_req, res) => handlePage(res, "index.html"),
    "/startseite": (_req, res) => handlePage(res, "index.html"),
    "/zeltlager": (_req, res) => handlePage(res, "zeltlager.html"),
    "/team": (_req, res) => handlePage(res, "team.html"),
    "/aktuelles": (_req, res) => handlePage(res, "aktuelles.html"),
    "/impressum": (_req, res) => handlePage(res, "impressum.html"),
    "/favicon.ico": (_req, res) => handleResource(res, "/bilder/seelenbohrer.webp"),
    "/api": handleAPI,
};

// --- Server ---
const server = http.createServer((req, res) => {
    const parsed = new url.URL(req.url, `https://${req.headers.host}`);
    const host = req.headers["host"] || "";

    // www redirect
    if (host.startsWith("www.")) {
        res.writeHead(301, { Location: `https://kjg-lautzkirchen.de${req.url}` });
        res.end();
        return;
    }

    log(req.socket.remoteAddress, `${req.method} ${req.url}`);

    const route = ROUTES["/" + parsed.pathname.split("/")[1]];
    if (route) {
        route(req, res);
    } else {
        handleResource(res, parsed.pathname);
    }
});

server.listen(8080, "0.0.0.0", () => {
    console.log("Serving HTTP on http://localhost:8080");
});
