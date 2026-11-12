// Draws the README's stack rows as outlined chips (logo + label) into ./*.svg.
// Logos come from Simple Icons (CC0). A chip with no slug is text-only.
// Edit ROWS, then run:  node assets/stack/generate.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = dirname(fileURLToPath(import.meta.url));

// id: [label, simple-icons slug or null, logo colour that reads on white and on #0d1117]
const T = {
  ts: ["TypeScript", "typescript", "3178C6"], js: ["JavaScript", "javascript", "F7DF1E"], rust: ["Rust", "rust", "DEA584"],
  go: ["Go", "go", "00ADD8"], py: ["Python", "python", "3776AB"], java: ["Java", "openjdk", "ED8B00"], c: ["C", "c", "A8B9CC"],
  claude: ["Claude", "claude", "D97757"], mcp: ["MCP", "modelcontextprotocol", "8B949E"], hf: ["Hugging Face", "huggingface", "FFD21E"],
  torch: ["PyTorch", "pytorch", "EE4C2C"], rag: ["RAG", null], agents: ["AI Agents", null], prompt: ["Prompt Engineering", null],
  context: ["Context Engineering", null], ft: ["Fine-Tuning", null],
  next: ["Next.js", "nextdotjs", "8B949E"], react: ["React", "react", "61DAFB"], tanstack: ["TanStack Start", "tanstack", "FF4154"],
  vite: ["Vite", "vite", "646CFF"], tw: ["Tailwind CSS", "tailwindcss", "06B6D4"], html: ["HTML5", "html5", "E34F26"], css: ["CSS", "css", "663399"],
  tauri: ["Tauri 2", "tauri", "24C8D8"], gpui: ["GPUI", null], brew: ["Homebrew", "homebrew", "FBB040"], scoop: ["Scoop", null],
  winget: ["WinGet", null], flatpak: ["Flatpak", "flatpak", "4A90D9"], msstore: ["Microsoft Store", null],
  rn: ["React Native", "react", "61DAFB"], android: ["Android", "android", "3DDC84"],
  node: ["Node.js", "nodedotjs", "5FA04E"], bun: ["Bun", "bun", "C9A27E"], express: ["Express", "express", "8B949E"],
  nest: ["NestJS", "nestjs", "E0234E"], fastapi: ["FastAPI", "fastapi", "009688"], gin: ["Gin", "gin", "00ADD8"],
  pg: ["PostgreSQL", "postgresql", "4169E1"], mysql: ["MySQL", "mysql", "4479A1"], redis: ["Redis", "redis", "FF4438"],
  cf: ["Cloudflare", "cloudflare", "F38020"], workers: ["Workers", "cloudflareworkers", "F38020"], r2: ["R2", "cloudflare", "F38020"],
  railway: ["Railway", "railway", "8B949E"], render: ["Render", "render", "8B949E"], firebase: ["Firebase", "firebase", "DD2C00"],
  docker: ["Docker", "docker", "2496ED"], git: ["Git", "git", "F05032"], gha: ["GitHub Actions", "githubactions", "2088FF"],
};
const ROWS = {
  languages: ["ts", "js", "rust", "go", "py", "java", "c"],
  ai: ["claude", "mcp", "hf", "torch", "rag", "agents", "prompt", "context", "ft"],
  frontend: ["next", "react", "tanstack", "vite", "tw", "html", "css"],
  desktop: ["tauri", "gpui", "brew", "scoop", "winget", "flatpak", "msstore"],
  mobile: ["rn", "android"],
  backend: ["node", "bun", "express", "nest", "fastapi", "gin"],
  database: ["pg", "mysql", "redis"],
  cloud: ["cf", "workers", "r2", "railway", "render", "firebase", "docker", "git", "gha"],
};

const FONT = `-apple-system, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;
const ONE_LINE = {}; // rows allowed to run wider than maxW to stay on one line, e.g. { languages: 900 }
const S = { h: 36, gap: 8, fs: 13.5, pad: 12, icon: 16, r: 10, maxW: 820 };
const textW = (s) => [...s].reduce((w, ch) => w + (/[A-Z]/.test(ch) ? 0.63 : /[il.\s-]/.test(ch) ? 0.28 : 0.52) * S.fs, 0);
const chipW = (k) => Math.round(S.pad + (k[1] ? S.icon + 7 : 0) + textW(k[0]) + S.pad + 2);

function chip(x, y, w, k, path) {
  const tx = x + S.pad + (path ? S.icon + 7 : 0);
  return `<g><title>${k[0]}</title><rect x="${x + .5}" y="${y + .5}" width="${w - 1}" height="${S.h - 1}" rx="${S.r}" fill="none" stroke="#8B949E" stroke-opacity=".45"/>` +
    (path ? `<g transform="translate(${x + S.pad},${y + (S.h - S.icon) / 2}) scale(${S.icon / 24})"><path fill="#${k[2]}" d="${path}"/></g>` : "") +
    `<text x="${tx}" y="${y + S.h / 2 + 4.8}" font-family="${FONT}" font-size="${S.fs}" font-weight="500" fill="#7D8590">${k[0].replace(/&/g, "&amp;")}</text></g>`;
}

// Split into the fewest lines that fit maxW, then even the lines out so none is left nearly empty.
function layout(widths, maxW = S.maxW) {
  const total = widths.reduce((a, b) => a + b, 0) + S.gap * (widths.length - 1);
  const lines = Math.max(1, Math.ceil(total / maxW));
  for (let limit = Math.ceil(total / lines); limit <= maxW + 1; limit += 4) {
    const out = [[]]; let x = 0;
    widths.forEach((w, i) => { if (x && x + w > limit) { out.push([]); x = 0; } out.at(-1).push(i); x += w + S.gap; });
    if (out.length <= lines) return out;
  }
  return [widths.map((_, i) => i)];
}

const paths = {};
for (const k of new Set(Object.values(ROWS).flat())) {
  const slug = T[k][1];
  if (!slug) continue;
  const svg = await (await fetch(`https://cdn.simpleicons.org/${slug}`)).text();
  const d = svg.match(/ d="([^"]+)"/);
  if (d) paths[k] = d[1]; else { console.warn(`no logo for ${slug}, drawing text-only`); T[k][1] = null; }
}

for (const [name, ids] of Object.entries(ROWS)) {
  const widths = ids.map((id) => chipW(T[id]));
  let body = "", W = 0;
  layout(widths, ONE_LINE[name]).forEach((line, li) => {
    let x = 0;
    for (const i of line) { body += chip(x + 1, li * (S.h + S.gap) + 1, widths[i], T[ids[i]], paths[ids[i]]); x += widths[i] + S.gap; }
    W = Math.max(W, x - S.gap + 2);
  });
  const H = layout(widths, ONE_LINE[name]).length * (S.h + S.gap) - S.gap + 2;
  writeFileSync(join(OUT, `${name}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${ids.map((i) => T[i][0]).join(", ")}">${body}</svg>`);
}
console.log("wrote", Object.keys(ROWS).length, "rows");
