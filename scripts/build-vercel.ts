import { readdirSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const dist = resolve(process.cwd(), "dist", "client");
if (!existsSync(dist)) process.exit(1);

// Find built assets
const assetsDir = resolve(dist, "assets");
const files = existsSync(assetsDir) ? readdirSync(assetsDir) : [];
const cssFile = files.find((f) => f.startsWith("styles-") && f.endsWith(".css"));
const jsFiles = files.filter((f) => f.endsWith(".js") && !f.includes("worker") && !f.includes("server"));

// Sort: router first, then smaller files, then the big ones
const critical = jsFiles.filter((f) => f.includes("router") || f.includes("start")).sort();
const rest = jsFiles.filter((f) => !f.includes("router") && !f.includes("start")).sort((a, b) => a.length - b.length);
const allJs = [...critical, ...rest];

const jsTags = allJs.map((f) => `<script type="module" crossorigin src="/assets/${f}"></script>`).join("\n");

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<meta name="theme-color" content="#00E5A0"/>
<meta name="description" content="Coach fitness & nutrition IA personnalisé"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
<meta name="apple-mobile-web-app-title" content="FitAI"/>
<link rel="manifest" href="/manifest.json"/>
<link rel="icon" type="image/svg+xml" href="/icon-192.svg"/>
<link rel="apple-touch-icon" href="/icon-192.svg"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@500;700&display=swap"/>
${cssFile ? `<link rel="stylesheet" href="/assets/${cssFile}"/>` : ""}
<title>FitAI Coach</title>
</head>
<body>
<div id="root"></div>
${jsTags}
<script>if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}</script>
</body>
</html>`;

writeFileSync(resolve(dist, "index.html"), html);
console.log("✓ dist/client/index.html generated (" + allJs.length + " JS + CSS)");
