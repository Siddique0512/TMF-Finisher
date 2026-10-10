// Perfectly aligned, minimal Stage 01 renderer
// Removes "STAGE 01 · SOVEREIGN GENESIS" (Image 2)
// Removes "ARGON · BOGLE · MIDAS · SMAUG · VLADD — 5 ON-CHAIN PIXEL PORTRAITS" (Image 3)
// Removes "SEAT #01" through "SEAT #05" from above all cards
// Keeps only the clean title "THE 5 FUND SEATS" and 5 perfectly aligned cards

import { execSync } from 'child_process';
import fs from 'fs';

const W = 1920;
const H = 1080;
const finalJpgPath = 'src/assets/images/tmf_authentic_seat_portraits_1791587827673.jpg';

console.log('1. Rendering clean dark grid background (1920x1080)...');
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
fs.writeFileSync('/tmp/bg_aligned_grid.ppm', Buffer.concat([headerPpm, buf]));

// Convert PPM to PNG with ONLY the simple title: "THE 5 FUND SEATS"
// (Images 2 and 3 removed completely!)
console.log('2. Adding clean single title "THE 5 FUND SEATS"...');
execSync(`convert /tmp/bg_aligned_grid.ppm \
  -font "Liberation-Sans" -pointsize 42 -fill "#ffffff" -gravity North -annotate +0+230 "THE 5 FUND SEATS" \
  /tmp/bg_aligned_header.png`);

console.log('3. Rendering the 5 cards with NO "SEAT #01" text and perfectly uniform height...');

// Card Dimensions: Perfectly compact, aligned, and identical
const cw = 296;
const ch = 340;
const cg = 24;
const totalW = 5 * cw + 4 * cg; // 1576
const startX = Math.floor((W - totalW) / 2); // 172
const cy = 340; // Starts right below title (230 + 42 + ~70 gap)

const funds = [
  {
    name: 'ARGON',
    borderColor: '#3b82f6',
    textColor: '#60a5fa',
    image: 'src/assets/images/argon-01.png',
  },
  {
    name: 'BOGLE',
    borderColor: '#10b981',
    textColor: '#34d399',
    image: 'src/assets/images/bogle-01.png',
  },
  {
    name: 'MIDAS',
    borderColor: '#fbbf24',
    textColor: '#fbbf24',
    image: 'src/assets/images/midas-01.png',
    isPortal: true,
  },
  {
    name: 'SMAUG',
    borderColor: '#ef4444',
    textColor: '#f87171',
    image: 'src/assets/images/smaug-01.png',
  },
  {
    name: 'VLADD',
    borderColor: '#8b5cf6',
    textColor: '#a78bfa',
    image: 'src/assets/images/vladd-01.png',
  },
];

funds.forEach((f, idx) => {
  const cardPath = `/tmp/card_aligned_${idx}.png`;
  const borderWidth = f.isPortal ? 2.5 : 1.5;

  if (f.isPortal) {
    // Midas card: Portrait with subtle White Bow reticle, NO "SEAT #03" text, NO bottom text
    execSync(`convert -size ${cw}x${ch} xc:"#0d0c07" \
      -stroke "${f.borderColor}" -strokewidth ${borderWidth} -fill none -draw "roundrectangle 1,1 ${cw - 2},${ch - 2} 6,6" \
      -draw "image over 24,20 248,248 '${f.image}'" \
      -stroke "#fbbf24" -strokewidth 1.5 -fill none -draw "circle 148,144 170,144" \
      -stroke "#ffffff" -strokewidth 1 -fill none -draw "circle 148,144 160,144" \
      -stroke "#fbbf24" -strokewidth 1 -draw "line 114,144 130,144 line 166,144 182,144 line 148,110 148,126 line 148,162 148,178" \
      -font "Liberation-Sans" -pointsize 24 -fill "${f.textColor}" -gravity North -annotate +0+288 "${f.name}" \
      ${cardPath}`);
  } else {
    // Other cards: Clean portrait, NO "SEAT #01" text, NO bottom text
    execSync(`convert -size ${cw}x${ch} xc:"#09090f" \
      -stroke "${f.borderColor}" -strokewidth ${borderWidth} -fill none -draw "roundrectangle 1,1 ${cw - 2},${ch - 2} 6,6" \
      -draw "image over 24,20 248,248 '${f.image}'" \
      -font "Liberation-Sans" -pointsize 24 -fill "${f.textColor}" -gravity North -annotate +0+288 "${f.name}" \
      ${cardPath}`);
  }
});

console.log('4. Compositing all 5 cards onto the centered background...');
execSync(`convert /tmp/bg_aligned_header.png \
  /tmp/card_aligned_0.png -geometry +${startX + 0 * (cw + cg)}+${cy} -composite \
  /tmp/card_aligned_1.png -geometry +${startX + 1 * (cw + cg)}+${cy} -composite \
  /tmp/card_aligned_2.png -geometry +${startX + 2 * (cw + cg)}+${cy} -composite \
  /tmp/card_aligned_3.png -geometry +${startX + 3 * (cw + cg)}+${cy} -composite \
  /tmp/card_aligned_4.png -geometry +${startX + 4 * (cw + cg)}+${cy} -composite \
  -quality 95 ${finalJpgPath}`);

console.log(`✓ SUCCESS: Perfectly aligned image written to ${finalJpgPath}`);
