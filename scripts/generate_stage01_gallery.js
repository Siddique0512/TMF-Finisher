// Generates edge-to-edge Grand Council Hall for Stage 01: "THE 4,001 SEAT PORTRAITS"
// Spans 100% of the canvas from far-left (x=0) to far-right (x=1024) across all 5 funds

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { execSync } from 'child_process';

function createPNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const crc = zlib.crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdr);

  const rowSize = width * 4;
  const rawData = Buffer.alloc(height * (rowSize + 1));
  for (let y = 0; y < height; y++) {
    rawData[y * (rowSize + 1)] = 0;
    rgbaBuffer.copy(rawData, y * (rowSize + 1) + 1, y * rowSize, (y + 1) * rowSize);
  }

  const idatData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function readPngPixels(pngPath) {
  const rawPpm = execSync(`convert ${pngPath} -depth 8 ppm:-`);
  let headerEnd = 0;
  let newlineCount = 0;
  for (let i = 0; i < rawPpm.length; i++) {
    if (rawPpm[i] === 0x0a) {
      newlineCount++;
      if (newlineCount === 3) {
        headerEnd = i + 1;
        break;
      }
    }
  }
  return rawPpm.subarray(headerEnd);
}

const W = 1024;
const H = 1024;
const buf = Buffer.alloc(W * H * 4);

function setPixel(x, y, r, g, b, a = 255) {
  if (x >= 0 && x < W && y >= 0 && y < H) {
    const idx = (y * W + x) * 4;
    buf[idx] = r;
    buf[idx + 1] = g;
    buf[idx + 2] = b;
    buf[idx + 3] = a;
  }
}

function fillRect(x, y, w, h, r, g, b) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setPixel(x + dx, y + dy, r, g, b);
    }
  }
}

console.log('Loading the 5 authentic 01 portrait PNGs...');
const argonRgb = readPngPixels('src/assets/images/argon-01.png');
const bogleRgb = readPngPixels('src/assets/images/bogle-01.png');
const midasRgb = readPngPixels('src/assets/images/midas-01.png');
const smaugRgb = readPngPixels('src/assets/images/smaug-01.png');
const vladdRgb = readPngPixels('src/assets/images/vladd-01.png');

const funds = [
  { name: 'ARGON', subtitle: 'DIV I · 800 SEATS', rgb: argonRgb, wallR: 110, wallG: 135, wallB: 180, carpetR: 85, carpetG: 105, carpetB: 145 },
  { name: 'BOGLE', subtitle: 'DIV II · 800 SEATS', rgb: bogleRgb, wallR: 130, wallG: 160, wallB: 140, carpetR: 100, carpetG: 130, carpetB: 110 },
  { name: 'MIDAS', subtitle: 'DIV IV · 800 SEATS', rgb: midasRgb, wallR: 205, wallG: 185, wallB: 145, carpetR: 175, carpetG: 155, carpetB: 120, isCenter: true },
  { name: 'SMAUG', subtitle: 'DIV III · 800 SEATS', rgb: smaugRgb, wallR: 190, wallG: 150, wallB: 155, carpetR: 160, carpetG: 120, carpetB: 125 },
  { name: 'VLADD', subtitle: 'DIV V · 800 SEATS', rgb: vladdRgb, wallR: 145, wallG: 125, wallB: 165, carpetR: 115, carpetG: 95, carpetB: 135 },
];

const colWidth = 1024 / 5; // Exactly 204.8 px per fund column

console.log('Rendering 5 edge-to-edge fund divisions from right to left...');

// 1. Render each fund's architectural bay completely across the full width
funds.forEach((fund, colIdx) => {
  const startX = Math.floor(colIdx * colWidth);
  const endX = Math.floor((colIdx + 1) * colWidth);
  const curW = endX - startX;

  // Background wall (y: 0 to 740)
  for (let y = 0; y < 740; y++) {
    const grad = y / 740;
    const stripe = (Math.floor(startX / 16) % 2 === 0);
    const r = Math.floor(fund.wallR * (0.65 + grad * 0.35));
    const g = Math.floor(fund.wallG * (0.65 + grad * 0.35));
    const b = Math.floor(fund.wallB * (0.65 + grad * 0.35));

    for (let x = startX; x < endX; x++) {
      const isAlt = ((x % 8) < 4);
      const mod = isAlt ? 8 : -8;
      setPixel(x, y, Math.max(0, Math.min(255, r + mod)), Math.max(0, Math.min(255, g + mod)), Math.max(0, Math.min(255, b + mod)));
    }
  }

  // Carpet / Floor (y: 740 to 1024)
  for (let y = 740; y < 1024; y++) {
    const fGrad = (y - 740) / 284;
    const r = Math.floor(fund.carpetR * (0.7 + fGrad * 0.3));
    const g = Math.floor(fund.carpetG * (0.7 + fGrad * 0.3));
    const b = Math.floor(fund.carpetB * (0.7 + fGrad * 0.3));
    for (let x = startX; x < endX; x++) {
      setPixel(x, y, r, g, b);
    }
  }

  // Top header moulding for this bay
  fillRect(startX, 0, curW, 12, 45, 32, 20);
  fillRect(startX, 12, curW, 6, 210, 170, 60); // Gold cornice
  fillRect(startX, 18, curW, 4, 80, 55, 25);

  // Fund Division Banner at top of bay
  fillRect(startX + 8, 30, curW - 16, 42, 25, 18, 14);
  fillRect(startX + 8, 30, curW - 16, 2, 200, 160, 55);
  fillRect(startX + 8, 70, curW - 16, 2, 200, 160, 55);

  // Dado rail at y: 734
  fillRect(startX, 734, curW, 6, 200, 160, 55);
  fillRect(startX, 740, curW, 8, 40, 28, 18);

  // Now render the Authentic 01 Portrait in the center of the bay!
  // Bay width is curW (~204px). We make the portrait 192x192 with heavy gold frame (total 200x200)
  const portraitSize = curW - 12; // ~192px
  const frameThickness = 6;
  const pSize = portraitSize - frameThickness * 2; // ~180px
  const pX = startX + Math.floor((curW - portraitSize) / 2);
  const pY = 240; // Center Y around 340-520, perfect eye level!

  // Frame dropshadow
  for (let s = 1; s <= 10; s++) {
    for (let dx = 0; dx < portraitSize; dx++) {
      setPixel(pX + dx + s, pY + portraitSize + s, 10, 8, 8, 170);
    }
  }

  // Gold ornate picture frame
  fillRect(pX, pY, portraitSize, portraitSize, 215, 175, 65);
  fillRect(pX + 2, pY + 2, portraitSize - 4, portraitSize - 4, 140, 100, 35);
  fillRect(pX + 4, pY + 4, portraitSize - 8, portraitSize - 8, 235, 195, 85);
  fillRect(pX + frameThickness, pY + frameThickness, pSize, pSize, 20, 14, 10);

  // Blit the authentic 512x512 PNG pixels scaled to pSize
  const srcSize = 512;
  const rgb = fund.rgb;
  for (let dy = 0; dy < pSize; dy++) {
    const sy = Math.floor((dy / pSize) * srcSize);
    for (let dx = 0; dx < pSize; dx++) {
      const sx = Math.floor((dx / pSize) * srcSize);
      const srcIdx = (sy * srcSize + sx) * 3;
      setPixel(pX + frameThickness + dx, pY + frameThickness + dy, rgb[srcIdx], rgb[srcIdx + 1], rgb[srcIdx + 2]);
    }
  }

  // Brass nameplate below portrait
  const plaqueW = curW - 24;
  const plaqueH = 32;
  const plX = startX + 12;
  const plY = pY + portraitSize + 12;

  fillRect(plX, plY, plaqueW, plaqueH, 220, 180, 65);
  fillRect(plX + 1, plY + 1, plaqueW - 2, plaqueH - 2, 40, 26, 14);
  fillRect(plX + 3, plY + 3, plaqueW - 6, plaqueH - 6, 195, 155, 55);

  // Vertical fluted architectural pilaster separating columns (right edge)
  if (colIdx < 4) {
    const pilasterX = endX - 3;
    fillRect(pilasterX, 0, 6, H, 25, 18, 12);
    fillRect(pilasterX + 1, 0, 2, H, 180, 140, 45); // Gold fluting highlight
    fillRect(pilasterX + 3, 0, 2, H, 60, 42, 22);
  }
});

// Leftmost edge border
fillRect(0, 0, 4, H, 190, 150, 50);
fillRect(2, 0, 2, H, 50, 35, 18);

// Rightmost edge border
fillRect(W - 4, 0, 4, H, 190, 150, 50);
fillRect(W - 4, 0, 2, H, 50, 35, 18);

// Continuous Top Gold Frieze Bar across 100% of the canvas
fillRect(0, 0, W, 8, 225, 185, 75);
fillRect(0, 8, W, 4, 110, 80, 30);

// Continuous Floor Plinth at bottom
fillRect(0, H - 24, W, 8, 180, 140, 45);
fillRect(0, H - 16, W, 16, 25, 18, 14);

const outPngPath = '/tmp/stage01_edge_to_edge.png';
const outJpgPath = 'src/assets/images/tmf_authentic_seat_portraits_1791587827673.jpg';

console.log('Writing PNG buffer...');
const pngBuf = createPNG(W, H, buf);
fs.writeFileSync(outPngPath, pngBuf);

console.log('Converting to high-quality JPEG for Stage 01...');
execSync(`convert ${outPngPath} -quality 95 ${outJpgPath}`);
console.log(`✓ Successfully updated ${outJpgPath} covering the whole area from right to left!`);
