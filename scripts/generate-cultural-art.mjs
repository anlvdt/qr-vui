import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../public/art-library/", import.meta.url);

const collections = {
  "hoang-dao": [
    ["bach-duong", "🐏"], ["kim-nguu", "🐂"], ["song-tu", "👯"], ["cu-giai", "🦀"],
    ["su-tu", "🦁"], ["xu-nu", "🌾"], ["thien-binh", "⚖️"], ["bo-cap", "🦂"],
    ["nhan-ma", "🏹"], ["ma-ket", "🐐"], ["bao-binh", "🏺"], ["song-ngu", "🐟"],
  ],
  "con-giap": [
    ["ty-chuot", "🐭"], ["suu-trau", "🐃"], ["dan-ho", "🐯"], ["mao-meo", "🐈"],
    ["thin-rong", "🐉"], ["ty-ran", "🐍"], ["ngo-ngua", "🐎"], ["mui-de", "🐐"],
    ["than-khi", "🐒"], ["dau-ga", "🐓"], ["tuat-cho", "🐕"], ["hoi-heo", "🐖"],
  ],
  "van-hoa-viet": [
    ["hoa-sen", "🪷"], ["trong-dong", "🥁"], ["non-la", "👒"], ["ao-dai", "👗"],
    ["chim-lac", "🕊️"], ["tre-viet", "🎋"], ["ca-chep", "🐟"], ["den-long-hoi-an", "🏮"],
    ["banh-chung", "🍃"], ["mai-vang", "🌼"], ["hoa-dao", "🌸"], ["gom-bat-trang", "🏺"],
  ],
};

const themes = {
  "hoang-dao": { top: "#063d35", bottom: "#0a6a53", halo: "#f4bd43", accent: "#ffe59a", motif: "✦" },
  "con-giap": { top: "#741f25", bottom: "#bc3d2f", halo: "#f5c34d", accent: "#fff0b5", motif: "◆" },
  "van-hoa-viet": { top: "#075e54", bottom: "#159179", halo: "#f0bd4f", accent: "#f9e5a1", motif: "❋" },
};

function svg(category, symbol, index) {
  const theme = themes[category];
  const rotate = (index % 3 - 1) * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="496" height="496" viewBox="0 0 496 496">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${theme.top}"/><stop offset="1" stop-color="${theme.bottom}"/></linearGradient>
    <radialGradient id="halo"><stop stop-color="${theme.accent}" stop-opacity=".95"/><stop offset="1" stop-color="${theme.halo}" stop-opacity=".3"/></radialGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="4" dy="7" stdDeviation="5" flood-color="#17221f" flood-opacity=".28"/></filter>
  </defs>
  <rect width="496" height="496" fill="url(#bg)"/>
  <path d="M0 405C72 370 124 400 191 377C261 354 313 374 377 351C425 334 463 341 496 357V496H0Z" fill="#06372f" opacity=".55"/>
  <g fill="${theme.accent}" opacity=".9" font-family="Georgia,serif" font-size="22"><text x="32" y="54">${theme.motif}</text><text x="182" y="72">${theme.motif}</text><text x="428" y="46">${theme.motif}</text></g>
  <g transform="translate(126 204) rotate(${rotate})" filter="url(#shadow)">
    <circle r="104" fill="url(#halo)" stroke="#17221f" stroke-width="5"/>
    <circle r="88" fill="#fff7dc" fill-opacity=".18" stroke="${theme.accent}" stroke-width="3" stroke-dasharray="5 9"/>
    <text x="0" y="25" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif" font-size="104">${symbol}</text>
  </g>
  <g filter="url(#shadow)">
    <rect x="217" y="202" width="255" height="258" rx="24" fill="#fffdf5" stroke="#17221f" stroke-width="5"/>
    <path d="M240 221H449" stroke="${theme.halo}" stroke-width="5" stroke-linecap="round" opacity=".55"/>
  </g>
  <g fill="${theme.accent}" opacity=".75"><circle cx="45" cy="322" r="4"/><circle cx="72" cy="347" r="7"/><circle cx="187" cy="334" r="5"/></g>
</svg>`;
}

for (const [category, entries] of Object.entries(collections)) {
  const directory = join(root.pathname, category);
  await mkdir(directory, { recursive: true });
  await Promise.all(entries.map(([slug, symbol], index) => writeFile(join(directory, `${slug}.svg`), svg(category, symbol, index))));
}

console.log(`Generated ${Object.values(collections).flat().length} cultural illustrations.`);
