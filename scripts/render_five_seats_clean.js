// Clean, simple font renderer for the 5 centered fund seats
// Removes the heavy bottom text and makes all fonts simple (non-bold, clean, crisp)

import { execSync } from 'child_process';
import fs from 'fs';

const W = 1920;
const H = 1080;
const finalJpgPath = 'src/assets/images/tmf_authentic_seat_portraits_1791587827673.jpg';

console.log('1. Generating subtle grid background (1920x1080)...');
const buf = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) {
  const isGridY = (y % 40 === 0);
  for (let x = 0; x < W; x++) {
    const isGridX = (x % 40 === 0);
    const idx = (y * W + x) * 3;
    if (isGridX || isGridY) {
      buf[idx] = 16;
      buf[idx + 1] = 16;
      buf[idx + 2] = 22;
    } else {
      buf[idx] = 6;
      buf[idx + 1] = 6;
      buf[idx + 2] = 9;
    }
  }
}
const headerPpm = Buffer.from(`P6\n${W} ${H}\n255\n`);
fs.writeFileSync('/tmp/bg_clean_grid.ppm', Buffer.concat([headerPpm, buf]));

// Convert PPM to PNG with simple, clean headers (NO BOLD)
console.log('2. Adding top headers with simple fonts...');
execSync(`convert /tmp/bg_clean_grid.ppm \
  -font "Liberation-Mono" -pointsize 13 -fill "#f59e0b" -gravity North -annotate +0+85 "STAGE 01 · SOVEREIGN GENESIS" \
  -font "Liberation-Sans" -pointsize 38 -fill "#ffffff" -gravity North -annotate +0+115 "THE 5 FUND SEATS" \
  -font "Liberation-Mono" -pointsize 12 -fill "#808090" -gravity North -annotate +0+170 "ARGON  ·  BOGLE  ·  MIDAS  ·  SMAUG  ·  VLADD  —  5 ON-CHAIN PIXEL PORTRAITS" \
  /tmp/bg_clean_header.png`);

console.log('3. Rendering the 5 cards with simple, non-bold fonts and no bottom clutter...');

// Card Dimensions: Sleek & compact (height 430px instead of 760px)
const cw = 296;
const ch = 430;
const cg = 24;
const totalW = 5 * cw + 4 * cg; // 1576
const startX = Math.floor((W - totalW) / 2); // 172
const cy = 250; // Perfectly centered vertically with headers!

const funds = [
  {
    seat: 'SEAT #01',
    name: 'ARGON',
    borderColor: '#3b82f6',
    textColor: '#60a5fa',
    image: 'src/assets/images/argon-01.png',
  },
  {
    seat: 'SEAT #02',
    name: 'BOGLE',
    borderColor: '#10b981',
    textColor: '#34d399',
    image: 'src/assets/images/bogle-01.png',
  },
  {
    seat: 'SEAT #03 · PORTAL',
    name: 'MIDAS',
    borderColor: '#fbbf24',
    textColor: '#fbbf24',
    image: 'src/assets/images/midas-01.png',
    isPortal: true,
  },
  {
    seat: 'SEAT #04',
    name: 'SMAUG',
    borderColor: '#ef4444',
    textColor: '#f87171',
    image: 'src/assets/images/smaug-01.png',
  },
  {
    seat: 'SEAT #05',
    name: 'VLADD',
    borderColor: '#8b5cf6',
    textColor: '#a78bfa',
    image: 'src/assets/images/vladd-01.png',
  },
];

funds.forEach((f, idx) => {
  const cardPath = `/tmp/card_clean_${idx}.png`;
  const borderWidth = f.isPortal ? 2.5 : 1.5;

  if (f.isPortal) {
    // Midas card with simple font and clean subtle White Bow reticle
    execSync(`convert -size ${cw}x${ch} xc:"#0d0c07" \
      -stroke "${f.borderColor}" -strokewidth ${borderWidth} -fill none -draw "roundrectangle 1,1 ${cw - 2},${ch - 2} 6,6" \
      -font "Liberation-Mono" -pointsize 11 -fill "${f.textColor}" -gravity North -annotate +0+18 "${f.seat}" \
      -draw "image over 24,46 248,248 '${f.image}'" \
      -stroke "#fbbf24" -strokewidth 1 -fill "#1a1408" -draw "roundrectangle 82,62 214,82 2,2" \
      -stroke none -font "Liberation-Mono" -pointsize 9 -fill "#fbbf24" -gravity North -annotate +0+68 "MIDAS' WHITE BOW" \
      -stroke "#fbbf24" -strokewidth 1.5 -fill none -draw "circle 148,170 172,170" \
      -stroke "#ffffff" -strokewidth 1 -fill none -draw "circle 148,170 162,170" \
      -stroke "#fbbf24" -strokewidth 1 -draw "line 112,170 128,170 line 168,170 184,170 line 148,134 148,150 line 148,190 148,206" \
      -font "Liberation-Sans" -pointsize 23 -fill "${f.textColor}" -gravity North -annotate +0+314 "${f.name}" \
      -font "Liberation-Mono" -pointsize 11 -fill "#fbbf24" -gravity North -annotate +0+352 "WHITE BOW ZOOM PORTAL" \
      ${cardPath}`);
  } else {
    // Other cards with simple, clean non-bold font
    execSync(`convert -size ${cw}x${ch} xc:"#09090f" \
      -stroke "${f.borderColor}" -strokewidth ${borderWidth} -fill none -draw "roundrectangle 1,1 ${cw - 2},${ch - 2} 6,6" \
      -font "Liberation-Mono" -pointsize 11 -fill "${f.textColor}" -gravity North -annotate +0+18 "${f.seat}" \
      -draw "image over 24,46 248,248 '${f.image}'" \
      -font "Liberation-Sans" -pointsize 23 -fill "${f.textColor}" -gravity North -annotate +0+314 "${f.name}" \
      ${cardPath}`);
  }
});

console.log('4. Compositing the 5 cards onto background...');
execSync(`convert /tmp/bg_clean_header.png \
  /tmp/card_clean_0.png -geometry +${startX + 0 * (cw + cg)}+${cy} -composite \
  /tmp/card_clean_1.png -geometry +${startX + 1 * (cw + cg)}+${cy} -composite \
  /tmp/card_clean_2.png -geometry +${startX + 2 * (cw + cg)}+${cy} -composite \
  /tmp/card_clean_3.png -geometry +${startX + 3 * (cw + cg)}+${cy} -composite \
  /tmp/card_clean_4.png -geometry +${startX + 4 * (cw + cg)}+${cy} -composite \
  -quality 95 ${finalJpgPath}`);

console.log(`✓ SUCCESS: Updated ${finalJpgPath} with simple, non-bold fonts and removed bottom clutter!`);
