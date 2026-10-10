// Complete, robust renderer for the 5 centered fund seats
import { execSync } from 'child_process';
import fs from 'fs';

const W = 1920;
const H = 1080;
const finalJpgPath = 'src/assets/images/tmf_authentic_seat_portraits_1791587827673.jpg';

console.log('1. Rendering grid background (1920x1080)...');
// Generate grid background using Netpbm PPM
const buf = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) {
  const isGridY = (y % 40 === 0);
  for (let x = 0; x < W; x++) {
    const isGridX = (x % 40 === 0);
    const idx = (y * W + x) * 3;
    if (isGridX || isGridY) {
      buf[idx] = 18;
      buf[idx + 1] = 18;
      buf[idx + 2] = 26;
    } else {
      buf[idx] = 7;
      buf[idx + 1] = 7;
      buf[idx + 2] = 11;
    }
  }
}
const headerPpm = Buffer.from(`P6\n${W} ${H}\n255\n`);
fs.writeFileSync('/tmp/bg_grid.ppm', Buffer.concat([headerPpm, buf]));

// Convert PPM to PNG with header text
console.log('2. Adding top headers to background...');
execSync(`convert /tmp/bg_grid.ppm \
  -font "Liberation-Mono-Bold" -pointsize 15 -fill "#f59e0b" -gravity North -annotate +0+55 "STAGE 01 · SOVEREIGN GENESIS" \
  -font "Liberation-Sans-Bold" -pointsize 44 -fill "#ffffff" -gravity North -annotate +0+85 "THE 5 FUND SEATS" \
  -font "Liberation-Mono" -pointsize 14 -fill "#9ca3af" -gravity North -annotate +0+145 "ARGON  ·  BOGLE  ·  MIDAS  ·  SMAUG  ·  VLADD  —  5 ON-CHAIN PIXEL PORTRAITS" \
  /tmp/bg_with_header.png`);

console.log('3. Rendering the 5 individual cards...');

// Card 1: Argon
execSync(`convert -size 296x760 xc:"#0a0a12" \
  -stroke "#3b82f6" -strokewidth 2 -fill none -draw "roundrectangle 1,1 294,758 8,8" \
  -font "Liberation-Mono-Bold" -pointsize 13 -fill "#60a5fa" -gravity North -annotate +0+22 "SEAT #01" \
  -draw "image over 24,54 248,248 'src/assets/images/argon-01.png'" \
  -font "Liberation-Sans-Bold" -pointsize 26 -fill "#60a5fa" -gravity North -annotate +0+330 "ARGON" \
  -font "Liberation-Sans-Bold" -pointsize 12 -fill "#93c5fd" -gravity North -annotate +0+372 "ELECTRIC BLUE FUND" \
  -font "Liberation-Mono" -pointsize 12 -fill "#6b7280" -gravity North -annotate +0+404 "800 SEATS" \
  -font "Liberation-Sans" -pointsize 12 -fill "#9ca3af" -gravity North -annotate +0+434 "Conservative Anchor" \
  -stroke "#252538" -strokewidth 1 -fill "#0f0f18" -draw "roundrectangle 33,500 263,536 4,4" \
  -stroke none -font "Liberation-Mono" -pointsize 11 -fill "#6b7280" -gravity North -annotate +0+511 "ON-CHAIN VERIFIED" \
  /tmp/card_0.png`);

// Card 2: Bogle
execSync(`convert -size 296x760 xc:"#0a0a10" \
  -stroke "#10b981" -strokewidth 2 -fill none -draw "roundrectangle 1,1 294,758 8,8" \
  -font "Liberation-Mono-Bold" -pointsize 13 -fill "#34d399" -gravity North -annotate +0+22 "SEAT #02" \
  -draw "image over 24,54 248,248 'src/assets/images/bogle-01.png'" \
  -font "Liberation-Sans-Bold" -pointsize 26 -fill "#34d399" -gravity North -annotate +0+330 "BOGLE" \
  -font "Liberation-Sans-Bold" -pointsize 12 -fill "#a7f3d0" -gravity North -annotate +0+372 "EMERALD GREEN FUND" \
  -font "Liberation-Mono" -pointsize 12 -fill "#6b7280" -gravity North -annotate +0+404 "800 SEATS" \
  -font "Liberation-Sans" -pointsize 12 -fill "#9ca3af" -gravity North -annotate +0+434 "Low-Cost Index Discipline" \
  -stroke "#252538" -strokewidth 1 -fill "#0f0f18" -draw "roundrectangle 33,500 263,536 4,4" \
  -stroke none -font "Liberation-Mono" -pointsize 11 -fill "#6b7280" -gravity North -annotate +0+511 "ON-CHAIN VERIFIED" \
  /tmp/card_1.png`);

// Card 3: Midas (Center with White Bow Portal)
execSync(`convert -size 296x760 xc:"#0e0c06" \
  -stroke "#fbbf24" -strokewidth 3 -fill none -draw "roundrectangle 2,2 293,757 8,8" \
  -font "Liberation-Mono-Bold" -pointsize 13 -fill "#fbbf24" -gravity North -annotate +0+22 "SEAT #03 · PORTAL" \
  -draw "image over 24,54 248,248 'src/assets/images/midas-01.png'" \
  -stroke "#fbbf24" -strokewidth 1 -fill "#1a1408" -draw "roundrectangle 76,74 220,98 3,3" \
  -stroke none -font "Liberation-Mono-Bold" -pointsize 10 -fill "#fbbf24" -gravity North -annotate +0+81 "MIDAS' WHITE BOW" \
  -stroke "#fbbf24" -strokewidth 2 -fill none -draw "circle 148,178 174,178" \
  -stroke "#ffffff" -strokewidth 1 -fill none -draw "circle 148,178 164,178" \
  -stroke "#fbbf24" -strokewidth 1 -draw "line 106,178 126,178 line 170,178 190,178 line 148,136 148,156 line 148,200 148,220" \
  -font "Liberation-Sans-Bold" -pointsize 26 -fill "#fbbf24" -gravity North -annotate +0+330 "MIDAS" \
  -font "Liberation-Sans-Bold" -pointsize 12 -fill "#fef08a" -gravity North -annotate +0+372 "PURE GOLD FUND" \
  -font "Liberation-Mono" -pointsize 12 -fill "#fbbf24" -gravity North -annotate +0+404 "800 SEATS" \
  -font "Liberation-Sans" -pointsize 12 -fill "#f59e0b" -gravity North -annotate +0+434 "White Bow Zoom Portal" \
  -stroke "#fbbf24" -strokewidth 1.5 -fill "#1c1404" -draw "roundrectangle 33,500 263,536 4,4" \
  -stroke none -font "Liberation-Mono-Bold" -pointsize 11 -fill "#fbbf24" -gravity North -annotate +0+511 "✦ WHITE BOW ZOOM PORTAL ✦" \
  /tmp/card_2.png`);

// Card 4: Smaug
execSync(`convert -size 296x760 xc:"#0a0809" \
  -stroke "#ef4444" -strokewidth 2 -fill none -draw "roundrectangle 1,1 294,758 8,8" \
  -font "Liberation-Mono-Bold" -pointsize 13 -fill "#f87171" -gravity North -annotate +0+22 "SEAT #04" \
  -draw "image over 24,54 248,248 'src/assets/images/smaug-01.png'" \
  -font "Liberation-Sans-Bold" -pointsize 26 -fill "#f87171" -gravity North -annotate +0+330 "SMAUG" \
  -font "Liberation-Sans-Bold" -pointsize 12 -fill "#fca5a5" -gravity North -annotate +0+372 "CRIMSON RED FUND" \
  -font "Liberation-Mono" -pointsize 12 -fill "#6b7280" -gravity North -annotate +0+404 "800 SEATS" \
  -font "Liberation-Sans" -pointsize 12 -fill "#9ca3af" -gravity North -annotate +0+434 "Barney Risk Manager" \
  -stroke "#252538" -strokewidth 1 -fill "#0f0f18" -draw "roundrectangle 33,500 263,536 4,4" \
  -stroke none -font "Liberation-Mono" -pointsize 11 -fill "#6b7280" -gravity North -annotate +0+511 "ON-CHAIN VERIFIED" \
  /tmp/card_3.png`);

// Card 5: Vladd
execSync(`convert -size 296x760 xc:"#09070e" \
  -stroke "#8b5cf6" -strokewidth 2 -fill none -draw "roundrectangle 1,1 294,758 8,8" \
  -font "Liberation-Mono-Bold" -pointsize 13 -fill "#a78bfa" -gravity North -annotate +0+22 "SEAT #05" \
  -draw "image over 24,54 248,248 'src/assets/images/vladd-01.png'" \
  -font "Liberation-Sans-Bold" -pointsize 26 -fill "#a78bfa" -gravity North -annotate +0+330 "VLADD" \
  -font "Liberation-Sans-Bold" -pointsize 12 -fill "#ddd6fe" -gravity North -annotate +0+372 "VIOLET WAVE FUND" \
  -font "Liberation-Mono" -pointsize 12 -fill "#6b7280" -gravity North -annotate +0+404 "800 SEATS" \
  -font "Liberation-Sans" -pointsize 12 -fill "#9ca3af" -gravity North -annotate +0+434 "High-Frequency Maverick" \
  -stroke "#252538" -strokewidth 1 -fill "#0f0f18" -draw "roundrectangle 33,500 263,536 4,4" \
  -stroke none -font "Liberation-Mono" -pointsize 11 -fill "#6b7280" -gravity North -annotate +0+511 "ON-CHAIN VERIFIED" \
  /tmp/card_4.png`);

console.log('4. Compositing the 5 cards side by side in the center...');
// Composite all cards onto background
const cw = 296;
const cg = 24;
const totalW = 5 * cw + 4 * cg; // 1576
const startX = Math.floor((W - totalW) / 2); // 172
const cy = 200;

execSync(`convert /tmp/bg_with_header.png \
  /tmp/card_0.png -geometry +${startX + 0 * (cw + cg)}+${cy} -composite \
  /tmp/card_1.png -geometry +${startX + 1 * (cw + cg)}+${cy} -composite \
  /tmp/card_2.png -geometry +${startX + 2 * (cw + cg)}+${cy} -composite \
  /tmp/card_3.png -geometry +${startX + 3 * (cw + cg)}+${cy} -composite \
  /tmp/card_4.png -geometry +${startX + 4 * (cw + cg)}+${cy} -composite \
  -quality 95 ${finalJpgPath}`);

console.log(`✓ SUCCESS: Generated centered 5-seat layout at ${finalJpgPath}`);
