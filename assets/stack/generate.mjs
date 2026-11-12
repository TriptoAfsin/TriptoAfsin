// Draws each Skillset item as an outlined chip (logo + label) into ./chips/<id>.svg
// and rewrites the matching <!-- stack:row --> blocks in README.MD.
// Logos come from Simple Icons (CC0). A chip with no slug is text-only.
// Edit ROWS, then run:  node assets/stack/generate.mjs
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
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
const S = { h: 36, fs: 13.5, pad: 12, icon: 16, r: 10 };
// Width estimate for the label. textLength pins the label to exactly this width, so a wider or
// narrower system font (iOS, Windows, Linux) never overflows or leaves a gap.
const textW = (s) => Math.round([...s].reduce((w, ch) => w + (/[mwMW]/.test(ch) ? 0.84 : /[A-Z]/.test(ch) ? 0.64 : /[il.\s-]/.test(ch) ? 0.3 : /[frtj]/.test(ch) ? 0.4 : 0.56) * S.fs, 0));

// One SVG per chip, so every chip keeps the same size and the page wraps them like words.
function chip(k, path) {
  const tw = textW(k[0]);
  const tx = S.pad + (path ? S.icon + 7 : 0);
  const w = tx + tw + S.pad + 1;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${S.h}" viewBox="0 0 ${w} ${S.h}" role="img" aria-label="${k[0]}"><title>${k[0]}</title>` +
    `<rect x=".5" y=".5" width="${w - 1}" height="${S.h - 1}" rx="${S.r}" fill="none" stroke="#8B949E" stroke-opacity=".45"/>` +
    (path ? `<g transform="translate(${S.pad},${(S.h - S.icon) / 2}) scale(${S.icon / 24})"><path fill="#${k[2]}" d="${path}"/></g>` : "") +
    `<text x="${tx}" y="${S.h / 2 + 4.8}" textLength="${tw}" lengthAdjust="spacingAndGlyphs" font-family="${FONT}" font-size="${S.fs}" font-weight="500" fill="#7D8590">${k[0].replace(/&/g, "&amp;")}</text></svg>`;
}

const paths = {};
for (const k of new Set(Object.values(ROWS).flat())) {
  const slug = T[k][1];
  if (!slug) continue;
  const svg = await (await fetch(`https://cdn.simpleicons.org/${slug}`)).text();
  const d = svg.match(/ d="([^"]+)"/);
  if (d) paths[k] = d[1]; else { console.warn(`no logo for ${slug}, drawing text-only`); T[k][1] = null; }
}

mkdirSync(join(OUT, "chips"), { recursive: true });
for (const id of new Set(Object.values(ROWS).flat())) writeFileSync(join(OUT, "chips", `${id}.svg`), chip(T[id], paths[id]));

// Rewrite each <!-- stack:row --> ... <!-- /stack:row --> block in the README.
const readme = join(OUT, "..", "..", "README.MD");
let md = readFileSync(readme, "utf8");
for (const [name, ids] of Object.entries(ROWS)) {
  const re = new RegExp(`<!-- stack:${name} -->[\\s\\S]*?<!-- /stack:${name} -->`);
  const html = ids.map((id) => `<img src="./assets/stack/chips/${id}.svg" alt="${T[id][0]}" />`).join("\n");
  if (re.test(md)) md = md.replace(re, `<!-- stack:${name} -->\n${html}\n<!-- /stack:${name} -->`);
  else console.warn(`README has no <!-- stack:${name} --> block`);
}
writeFileSync(readme, md);
console.log("wrote", new Set(Object.values(ROWS).flat()).size, "chips and updated README");
