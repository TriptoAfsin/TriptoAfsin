// Draws the intro link buttons as SVGs, one file per link, into this folder.
// Same look as the stack chips: hairline outline, brand logo, grey label.
// Run: node assets/links/generate.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = dirname(fileURLToPath(import.meta.url));
const FONT = `-apple-system, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;
const ACCENT = "2F81F7"; // Portfolio and Resume icons

// Hand-drawn stroke icons for things without a brand logo (24x24 grid).
const GLOBE = (c) => `<g fill="none" stroke="#${c}" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/></g>`;
const DOC = (c) => `<g fill="none" stroke="#${c}" stroke-width="2" stroke-linejoin="round"><path d="M6 2.5h8l4.5 4.5v14.5H6z"/><path d="M14 2.5V7h4.5M9 13h6.5M9 17h6.5"/></g>`;

// [file, label, logo colour, simple-icons slug | custom drawer]
const LINKS = [
  ["portfolio", "Portfolio", ACCENT, GLOBE],
  ["resume", "Resume", ACCENT, DOC],
  ["linkedin", "LinkedIn", "0A66C2", "linkedin"],
  ["gmail", "Email", "EA4335", "gmail"],
  ["facebook", "Facebook", "0866FF", "facebook"],
  ["t21", "t21.dev", "8B949E", "github"],
];

const textW = (s, fs) => [...s].reduce((w, ch) => w + (/[A-Z]/.test(ch) ? 0.63 : /[il.\s-]/.test(ch) ? 0.28 : 0.52) * fs, 0);

async function logo(slug) {
  // LinkedIn left Simple Icons in v10; v9 still has it.
  const url = slug === "linkedin" ? "https://cdn.jsdelivr.net/npm/simple-icons@9.0.0/icons/linkedin.svg" : `https://cdn.simpleicons.org/${slug}`;
  const d = (await (await fetch(url)).text()).match(/ d="([^"]+)"/);
  if (!d) throw new Error("no logo for " + slug);
  return (c) => `<path fill="#${c}" d="${d[1]}"/>`;
}

const icon = (draw, c, x, y, size) => `<g transform="translate(${x},${y}) scale(${size / 24})">${draw(c)}</g>`;

for (const [file, label, color, src] of LINKS) {
  const draw = typeof src === "function" ? src : await logo(src);
  const h = 38, fs = 14, pad = 14, is = 16;

  let w = Math.round(pad + is + 8 + textW(label, fs) + pad + 2);
  writeFileSync(join(OUT, `${file}.svg`), svg(w, h, label,
    `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="10" fill="none" stroke="#8B949E" stroke-opacity=".45"/>` +
    icon(draw, color, pad, (h - is) / 2, is) +
    `<text x="${pad + is + 8}" y="${h / 2 + 5}" font-family="${FONT}" font-size="${fs}" font-weight="500" fill="#7D8590">${label}</text>`));
}

function svg(w, h, label, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}"><title>${label}</title>${body}</svg>`;
}
console.log("wrote", LINKS.length, "link buttons");
