// Generates authentic pixel-perfect 512x512 PNG portraits for The Mutual Fun:
// argon-01.png, bogle-01.png, midas-01.png, smaug-01.png, vladd-01.png

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

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
  ihdr[8] = 8; // 8 bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdr);

  const rowSize = width * 4;
  const rawData = Buffer.alloc(height * (rowSize + 1));
  for (let y = 0; y < height; y++) {
    rawData[y * (rowSize + 1)] = 0; // Filter 0
    rgbaBuffer.copy(rawData, y * (rowSize + 1) + 1, y * rowSize, (y + 1) * rowSize);
  }

  const idatData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function hexToRgba(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return [r, g, b, 255];
}

class PixelGrid {
  constructor(size = 32) {
    this.size = size;
    this.grid = Array(size).fill(0).map(() => Array(size).fill('#000000'));
  }

  set(x, y, color) {
    if (x >= 0 && x < this.size && y >= 0 && y < this.size) {
      this.grid[y][x] = color;
    }
  }

  rect(x, y, w, h, color) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        this.set(x + dx, y + dy, color);
      }
    }
  }

  drawFrame(outerGold = '#c99e46', innerLine = '#3e2417', cornerWine = '#7b1822') {
    // Outer edge border
    this.rect(0, 0, this.size, 1, outerGold);
    this.rect(0, this.size - 1, this.size, 1, outerGold);
    this.rect(0, 0, 1, this.size, outerGold);
    this.rect(this.size - 1, 0, 1, this.size, outerGold);

    // Second line gold
    this.rect(1, 1, this.size - 2, 1, outerGold);
    this.rect(1, this.size - 2, this.size - 2, 1, outerGold);
    this.rect(1, 1, 1, this.size - 2, outerGold);
    this.rect(this.size - 2, 1, 1, this.size - 2, outerGold);

    // Inner dark perimeter line
    this.rect(2, 2, this.size - 4, 1, innerLine);
    this.rect(2, this.size - 3, this.size - 4, 1, innerLine);
    this.rect(2, 2, 1, this.size - 4, innerLine);
    this.rect(this.size - 3, 2, 1, this.size - 4, innerLine);

    // Corner decorative pixels (top-left, top-right, bottom-left, bottom-right)
    this.set(0, 0, cornerWine);
    this.set(1, 0, cornerWine);
    this.set(0, 1, cornerWine);

    this.set(this.size - 1, 0, cornerWine);
    this.set(this.size - 2, 0, cornerWine);
    this.set(this.size - 1, 1, cornerWine);

    this.set(0, this.size - 1, cornerWine);
    this.set(1, this.size - 1, cornerWine);
    this.set(0, this.size - 2, cornerWine);

    this.set(this.size - 1, this.size - 1, cornerWine);
    this.set(this.size - 2, this.size - 1, cornerWine);
    this.set(this.size - 1, this.size - 2, cornerWine);
  }

  drawGreenTuftedChair() {
    const GREEN_DARK = '#245233';
    const GREEN_MID = '#2d633e';
    const GREEN_TUFT = '#3e7c52';
    const GOLD_STUD = '#d9aa32';
    const WOOD_DARK = '#482a17';
    const WOOD_MID = '#683d21';

    // Chair Back Cushion
    this.rect(9, 6, 14, 14, GREEN_DARK);
    this.rect(10, 7, 12, 12, GREEN_MID);

    // Tufted Checkerboard on upper-left quadrant
    for (let ty = 7; ty <= 11; ty += 2) {
      for (let tx = 10; tx <= 14; tx += 2) {
        this.set(tx, ty, GREEN_TUFT);
      }
    }

    // Gold brass nailheads on right rim and top rim
    for (let ny = 7; ny <= 18; ny += 2) {
      this.set(22, ny, GOLD_STUD);
    }
    for (let nx = 12; nx <= 20; nx += 3) {
      this.set(nx, 6, GOLD_STUD);
    }

    // Wooden armrests
    this.rect(7, 15, 4, 2, WOOD_MID);
    this.rect(21, 15, 4, 2, WOOD_MID);
    this.rect(7, 15, 18, 1, WOOD_DARK); // horizontal back rail

    // Armrest vertical supports
    this.rect(7, 17, 1, 4, WOOD_DARK);
    this.rect(24, 17, 1, 4, WOOD_DARK);

    // Chair bottom legs & crossbar
    this.rect(9, 21, 1, 6, WOOD_DARK);
    this.rect(22, 21, 1, 6, WOOD_DARK);
    this.rect(9, 24, 14, 1, WOOD_DARK);
  }

  drawWindow(x = 20, y = 4) {
    const FRAME = '#683d21';
    const SKY_BLUE = '#5b82ad';
    const SUNSET_GOLD = '#dc9e34';
    const SUNSET_RED = '#8f2e2e';

    // Outer frame
    this.rect(x, y, 9, 9, FRAME);

    // Panes: 3x3 each
    // Top-left pane (Sky blue)
    this.rect(x + 1, y + 1, 3, 3, SKY_BLUE);
    // Top-right pane (Sky blue)
    this.rect(x + 5, y + 1, 3, 3, SKY_BLUE);
    // Bottom-left pane (Sunset gold top, red bottom)
    this.rect(x + 1, y + 5, 3, 1, SUNSET_GOLD);
    this.rect(x + 1, y + 6, 3, 2, SUNSET_RED);
    // Bottom-right pane
    this.rect(x + 5, y + 5, 3, 1, SUNSET_GOLD);
    this.rect(x + 5, y + 6, 3, 2, SUNSET_RED);

    // Mullions
    this.rect(x + 4, y + 1, 1, 7, FRAME);
    this.rect(x + 1, y + 4, 7, 1, FRAME);
  }

  drawBriefcase(x = 23, y = 21, color = 'brown') {
    const isNavy = color === 'navy';
    const MAIN = isNavy ? '#293d63' : '#57341c';
    const DARK = isNavy ? '#1a2742' : '#3d2413';
    const LATCH = isNavy ? '#c5d1e6' : '#d9aa32';
    const HANDLE = isNavy ? '#1a2742' : '#3d2413';

    // Handle
    this.rect(x + 2, y, 3, 1, HANDLE);
    this.set(x + 2, y + 1, HANDLE);
    this.set(x + 4, y + 1, HANDLE);

    // Main body (7 wide, 6 high)
    this.rect(x, y + 1, 7, 6, MAIN);
    this.rect(x, y + 1, 7, 1, DARK);
    this.rect(x, y + 6, 7, 1, DARK);
    this.rect(x, y + 1, 1, 6, DARK);
    this.rect(x + 6, y + 1, 1, 6, DARK);

    // Latches
    this.set(x + 1, y + 3, LATCH);
    this.set(x + 2, y + 3, LATCH);
    this.set(x + 4, y + 3, LATCH);
    this.set(x + 5, y + 3, LATCH);
  }

  toBuffer(scale = 16) {
    const outWidth = this.size * scale;
    const outHeight = this.size * scale;
    const buf = Buffer.alloc(outWidth * outHeight * 4);

    for (let py = 0; py < this.size; py++) {
      for (let px = 0; px < this.size; px++) {
        const hex = this.grid[py][px];
        const [r, g, b, a] = hexToRgba(hex);

        for (let sy = 0; sy < scale; sy++) {
          const outY = py * scale + sy;
          for (let sx = 0; sx < scale; sx++) {
            const outX = px * scale + sx;
            const idx = (outY * outWidth + outX) * 4;
            buf[idx] = r;
            buf[idx + 1] = g;
            buf[idx + 2] = b;
            buf[idx + 3] = a;
          }
        }
      }
    }

    return createPNG(outWidth, outHeight, buf);
  }
}

// -------------------------------------------------------------
// 1. ARGON 01
// -------------------------------------------------------------
function generateArgon01() {
  const g = new PixelGrid(32);
  g.drawFrame('#c99e46', '#3e2417', '#7b1822');

  // Background: Vertical Blue Pinstripes
  const STRIPE_A = '#8aa2cc';
  const STRIPE_B = '#6d86b0';
  for (let x = 3; x < 29; x++) {
    const col = (x % 2 === 0) ? STRIPE_A : STRIPE_B;
    for (let y = 3; y < 24; y++) {
      g.set(x, y, col);
    }
  }

  // Floor: Slate blue carpet with vertical shadow slats
  g.rect(3, 24, 26, 5, '#6d86b0');
  for (let fx = 5; fx < 27; fx += 2) {
    g.set(fx, 28, '#8aa2cc');
  }

  // Chair shadow slats under seat
  for (let sx = 9; sx <= 23; sx += 1) {
    g.set(sx, 26, '#3a2315');
    g.set(sx, 27, '#3a2315');
  }

  // Green Chair
  g.drawGreenTuftedChair();

  // Character: Argon Matriarch
  const SKIN = '#8f5c38';
  const SKIN_SHADOW = '#734729';
  const HAIR_GREY = '#96969e';
  const HAIR_LIGHT = '#b8b8c2';
  const SUIT_GREY = '#413f44';
  const SUIT_DARK = '#2f2e32';
  const COLLAR_WHITE = '#ededf2';

  // Hair / Headdress
  g.rect(14, 4, 4, 3, HAIR_LIGHT);
  g.rect(13, 7, 6, 2, HAIR_GREY);
  g.rect(12, 8, 2, 4, HAIR_GREY);
  g.rect(18, 8, 2, 4, HAIR_GREY);
  g.set(15, 5, HAIR_GREY);
  g.set(16, 5, HAIR_LIGHT);

  // Face
  g.rect(13, 9, 6, 5, SKIN);
  // Eyes
  g.set(14, 10, '#1c1410');
  g.set(17, 10, '#1c1410');
  g.set(14, 9, '#ffffff'); // highlight
  g.set(17, 9, '#ffffff');
  // Mouth
  g.rect(15, 13, 3, 1, SKIN_SHADOW);

  // Collar
  g.rect(14, 14, 4, 2, COLLAR_WHITE);

  // Suit / Torso
  g.rect(11, 15, 10, 6, SUIT_GREY);
  g.rect(12, 16, 8, 5, SUIT_GREY);
  g.rect(11, 15, 1, 6, SUIT_DARK);
  g.rect(20, 15, 1, 6, SUIT_DARK);

  // Arms and hands
  g.rect(14, 19, 4, 2, SKIN); // clasped hands

  // Skirt
  g.rect(12, 21, 8, 3, SUIT_DARK);

  // Legs and shoes
  g.rect(13, 24, 2, 3, SKIN);
  g.rect(17, 24, 2, 3, SKIN);
  g.rect(12, 27, 3, 1, '#18181b'); // black shoes
  g.rect(17, 27, 3, 1, '#18181b');

  // Blue Briefcase
  g.drawBriefcase(22, 20, 'navy');

  return g.toBuffer(16);
}

// -------------------------------------------------------------
// 2. BOGLE 01
// -------------------------------------------------------------
function generateBogle01() {
  const g = new PixelGrid(32);
  g.drawFrame('#c99e46', '#3e2417', '#7b1822');

  // Sage green wallpaper with flecks
  const WALL = '#8ea998';
  const FLECK = '#698573';
  for (let x = 3; x < 29; x++) {
    for (let y = 3; y < 24; y++) {
      g.set(x, y, WALL);
    }
  }
  // Flecks
  const flecks = [
    [5, 5], [7, 10], [18, 5], [6, 17], [27, 15], [26, 8], [9, 14]
  ];
  flecks.forEach(([fx, fy]) => g.set(fx, fy, FLECK));

  // Window upper-right
  g.drawWindow(20, 4);

  // Floor
  g.rect(3, 24, 26, 5, '#7b9585');
  for (let fx = 5; fx < 27; fx += 2) {
    g.set(fx, 28, '#8ea998');
  }

  // Chair shadow slats
  for (let sx = 9; sx <= 23; sx += 1) {
    g.set(sx, 26, '#3a2315');
    g.set(sx, 27, '#3a2315');
  }

  // Chair
  g.drawGreenTuftedChair();

  // Skeleton Character (Bogle)
  const BONE = '#f0ede6';
  const BONE_SHADOW = '#dfdad0';
  const EYE_BLACK = '#1f1610';
  const SUIT_BROWN = '#593821';
  const SUIT_DARK = '#422816';
  const TIE_GOLD = '#d9aa32';

  // Skull Head
  g.rect(13, 6, 6, 5, BONE);
  g.rect(14, 5, 4, 2, BONE);
  // Cheekbones
  g.rect(13, 8, 6, 3, BONE);
  // Eye Sockets
  g.rect(14, 8, 2, 2, EYE_BLACK);
  g.rect(17, 8, 2, 2, EYE_BLACK);
  // Nasal cavity
  g.set(16, 10, EYE_BLACK);
  // Teeth / Jaw
  g.rect(14, 11, 4, 1, BONE_SHADOW);

  // Spine / Neck
  g.rect(15, 12, 2, 2, BONE);

  // Collar & Gold Tie
  g.rect(14, 14, 4, 1, '#ffffff');
  g.rect(15, 14, 2, 5, TIE_GOLD);

  // Brown Suit Jacket
  g.rect(11, 14, 4, 6, SUIT_BROWN);
  g.rect(17, 14, 4, 6, SUIT_BROWN);
  g.rect(11, 14, 1, 6, SUIT_DARK);
  g.rect(20, 14, 1, 6, SUIT_DARK);

  // Bony hands clasped
  g.rect(14, 19, 4, 2, BONE);

  // Brown Trousers
  g.rect(12, 20, 8, 4, SUIT_DARK);

  // Legs & Black shoes
  g.rect(13, 24, 2, 3, SUIT_BROWN);
  g.rect(17, 24, 2, 3, SUIT_BROWN);
  g.rect(12, 27, 3, 1, '#18181b');
  g.rect(17, 27, 3, 1, '#18181b');

  // Brown Briefcase
  g.drawBriefcase(22, 20, 'brown');

  return g.toBuffer(16);
}

// -------------------------------------------------------------
// 3. MIDAS 01
// -------------------------------------------------------------
function generateMidas01() {
  const g = new PixelGrid(32);
  g.drawFrame('#c99e46', '#3e2417', '#7b1822');

  // Cream/tan wallpaper with flecks
  const WALL = '#d6c5a5';
  const FLECK = '#b09e7e';
  for (let x = 3; x < 29; x++) {
    for (let y = 3; y < 24; y++) {
      g.set(x, y, WALL);
    }
  }
  const flecks = [
    [5, 5], [8, 9], [17, 5], [6, 18], [26, 16], [9, 14]
  ];
  flecks.forEach(([fx, fy]) => g.set(fx, fy, FLECK));

  // Window
  g.drawWindow(20, 4);

  // Floor
  g.rect(3, 24, 26, 5, '#c5b394');
  for (let fx = 5; fx < 27; fx += 2) {
    g.set(fx, 28, '#d6c5a5');
  }

  // Shadow slats
  for (let sx = 9; sx <= 23; sx += 1) {
    g.set(sx, 26, '#3a2315');
    g.set(sx, 27, '#3a2315');
  }

  // Chair
  g.drawGreenTuftedChair();

  // Character: Midas with Glasses in Burgundy
  const SKIN = '#a8744f';
  const HAIR = '#222026';
  const GLASSES = '#18181b';
  const BURGUNDY = '#6e1d2e';
  const BURGUNDY_DARK = '#4d1420';

  // Hair
  g.rect(13, 5, 6, 3, HAIR);
  g.rect(12, 6, 8, 2, HAIR);
  g.rect(12, 8, 1, 3, HAIR);
  g.rect(19, 8, 1, 3, HAIR);

  // Face
  g.rect(13, 8, 6, 6, SKIN);

  // Glasses & Eyes
  g.rect(13, 9, 3, 2, GLASSES);
  g.rect(17, 9, 3, 2, GLASSES);
  g.set(16, 9, GLASSES); // bridge
  g.set(14, 9, '#ffffff'); // lens reflection
  g.set(18, 9, '#ffffff');

  // Mouth
  g.rect(15, 12, 3, 1, '#482a17');

  // White collar
  g.rect(14, 14, 4, 2, '#ededf2');

  // Burgundy Robe/Suit
  g.rect(11, 15, 10, 6, BURGUNDY);
  g.rect(12, 16, 8, 5, BURGUNDY);
  g.rect(11, 15, 1, 6, BURGUNDY_DARK);
  g.rect(20, 15, 1, 6, BURGUNDY_DARK);

  // Hands clasped
  g.rect(14, 19, 4, 2, SKIN);

  // Robe skirt
  g.rect(12, 21, 8, 3, BURGUNDY_DARK);

  // Legs and black shoes
  g.rect(13, 24, 2, 3, SKIN);
  g.rect(17, 24, 2, 3, SKIN);
  g.rect(12, 27, 3, 1, '#18181b');
  g.rect(17, 27, 3, 1, '#18181b');

  // Brown Briefcase
  g.drawBriefcase(22, 20, 'brown');

  return g.toBuffer(16);
}

// -------------------------------------------------------------
// 4. SMAUG 01
// -------------------------------------------------------------
function generateSmaug01() {
  const g = new PixelGrid(32);
  // Smaug has dark brown wooden frame
  g.drawFrame('#3d281e', '#1c110b', '#24160f');

  // Dusty rose / pink wallpaper
  const WALL = '#c9a3a8';
  const FLECK = '#9e797e';
  for (let x = 3; x < 29; x++) {
    for (let y = 3; y < 24; y++) {
      g.set(x, y, WALL);
    }
  }
  const flecks = [
    [5, 5], [10, 8], [18, 5], [6, 17], [26, 12], [27, 6], [12, 14]
  ];
  flecks.forEach(([fx, fy]) => g.set(fx, fy, FLECK));

  // Potted Plant on left
  // Terracotta pot
  g.rect(5, 23, 4, 3, '#8a3c3c');
  g.rect(4, 22, 6, 1, '#a64d4d');
  // Green leaves
  g.set(6, 19, '#2e6b3e');
  g.set(7, 18, '#449156');
  g.set(5, 20, '#449156');
  g.set(6, 21, '#2e6b3e');
  g.set(8, 20, '#2e6b3e');

  // Floor
  g.rect(3, 24, 26, 5, '#b58f94');
  for (let fx = 5; fx < 27; fx += 2) {
    g.set(fx, 28, '#c9a3a8');
  }

  // Modern Swivel Office Chair (Blue cushion, white/cream frame)
  const CHAIR_WHITE = '#ded6c8';
  const CUSHION_BLUE = '#7ea9cf';
  const CUSHION_LIGHT = '#9dc0df';
  // Backrest
  g.rect(10, 7, 12, 12, CHAIR_WHITE);
  g.rect(11, 8, 10, 10, CUSHION_BLUE);
  g.rect(12, 8, 8, 3, CUSHION_LIGHT);
  // Seat cushion
  g.rect(9, 18, 14, 2, CHAIR_WHITE);
  // Stem & Caster Base
  g.rect(15, 20, 2, 4, '#5e5a66');
  for (let cx = 10; cx <= 21; cx++) {
    g.set(cx, 24, '#787680');
  }

  // Shadow under casters
  for (let sx = 9; sx <= 22; sx += 1) {
    g.set(sx, 26, '#3a2315');
    g.set(sx, 27, '#3a2315');
  }

  // Character: Golden Retriever Dog in Navy Suit with Red Tie
  const FUR_GOLD = '#ebb456';
  const FUR_DARK = '#d99b38';
  const NOSE = '#141010';
  const SUIT_NAVY = '#233863';
  const SUIT_DARK = '#16233e';
  const TIE_RED = '#bd2222';
  const TONGUE = '#d95b68';

  // Head and Floppy Ears
  g.rect(12, 4, 8, 7, FUR_GOLD);
  g.rect(11, 4, 2, 6, FUR_DARK); // left ear
  g.rect(19, 4, 2, 6, FUR_DARK); // right ear

  // Eyes
  g.set(14, 6, '#18120c');
  g.set(17, 6, '#18120c');

  // Muzzle & Nose
  g.rect(14, 7, 4, 3, FUR_GOLD);
  g.rect(15, 7, 2, 1, NOSE);
  g.rect(15, 8, 2, 1, NOSE);

  // Tongue
  g.set(16, 9, TONGUE);

  // White Collar & Red Tie
  g.rect(14, 12, 4, 1, '#ffffff');
  g.rect(15, 12, 2, 5, TIE_RED);

  // Navy Suit
  g.rect(11, 13, 4, 6, SUIT_NAVY);
  g.rect(17, 13, 4, 6, SUIT_NAVY);
  g.rect(11, 13, 1, 6, SUIT_DARK);
  g.rect(20, 13, 1, 6, SUIT_DARK);

  // Paws clasped
  g.rect(14, 17, 4, 2, FUR_GOLD);

  // Navy Trousers
  g.rect(12, 19, 8, 4, SUIT_DARK);
  g.rect(13, 23, 2, 4, SUIT_NAVY);
  g.rect(17, 23, 2, 4, SUIT_NAVY);

  // Brown Shoes
  g.rect(12, 26, 3, 1, '#3d2516');
  g.rect(17, 26, 3, 1, '#3d2516');

  // Blue Briefcase
  g.drawBriefcase(22, 20, 'navy');

  return g.toBuffer(16);
}

// -------------------------------------------------------------
// 5. VLADD 01
// -------------------------------------------------------------
function generateVladd01() {
  const g = new PixelGrid(32);
  g.drawFrame('#c99e46', '#3e2417', '#7b1822');

  // Lavender / Violet Striped Wallpaper
  const STRIPE_A = '#9f8db5';
  const STRIPE_B = '#86739e';
  for (let x = 3; x < 29; x++) {
    const col = (x % 2 === 0) ? STRIPE_A : STRIPE_B;
    for (let y = 3; y < 24; y++) {
      g.set(x, y, col);
    }
  }

  // Floor
  g.rect(3, 24, 26, 5, '#86739e');
  for (let fx = 5; fx < 27; fx += 2) {
    g.set(fx, 28, '#9f8db5');
  }

  // Shadow slats
  for (let sx = 9; sx <= 23; sx += 1) {
    g.set(sx, 26, '#3a2315');
    g.set(sx, 27, '#3a2315');
  }

  // Carved Dark Wooden Bench Chair
  const WOOD_DARK = '#422918';
  const WOOD_MID = '#633c22';
  // Backrest
  g.rect(9, 9, 14, 6, WOOD_MID);
  g.rect(8, 8, 16, 2, WOOD_DARK);
  // Cutout slats in backrest
  for (let bx = 10; bx <= 14; bx += 2) {
    g.set(bx, 10, WOOD_DARK);
    g.set(bx + 1, 11, WOOD_DARK);
  }
  // Armrests
  g.rect(6, 13, 4, 6, WOOD_DARK);
  g.rect(22, 13, 4, 6, WOOD_DARK);
  g.rect(7, 20, 2, 7, WOOD_DARK); // legs
  g.rect(23, 20, 2, 7, WOOD_DARK);

  // Character: Vladd with Raven Hair, Green Suit & Gold Tie
  const SKIN = '#f0d5be';
  const HAIR = '#1a1820';
  const SUIT_GREEN = '#235c36';
  const SUIT_DARK = '#184227';
  const TIE_GOLD = '#d9aa32';

  // Wild Raven Hair
  g.rect(12, 3, 8, 6, HAIR);
  g.rect(11, 4, 10, 5, HAIR);
  g.rect(10, 6, 2, 4, HAIR);
  g.rect(20, 6, 2, 4, HAIR);
  g.set(11, 3, HAIR);
  g.set(13, 2, HAIR);
  g.set(17, 2, HAIR);
  g.set(19, 3, HAIR);

  // Face
  g.rect(13, 6, 6, 6, SKIN);

  // Expressive sideways eyes
  g.set(14, 8, '#1b1820');
  g.set(18, 8, '#1b1820');
  g.set(13, 8, '#ffffff'); // white sclera
  g.set(17, 8, '#ffffff');

  // Half smirk
  g.rect(15, 10, 3, 1, '#523624');

  // White Collar & Gold Tie
  g.rect(14, 12, 4, 1, '#ffffff');
  g.rect(15, 12, 2, 5, TIE_GOLD);

  // Green Suit
  g.rect(11, 13, 4, 6, SUIT_GREEN);
  g.rect(17, 13, 4, 6, SUIT_GREEN);
  g.rect(11, 13, 1, 6, SUIT_DARK);
  g.rect(20, 13, 1, 6, SUIT_DARK);

  // Hands clasped
  g.rect(14, 17, 4, 2, SKIN);

  // Green Trousers
  g.rect(12, 19, 8, 4, SUIT_DARK);
  g.rect(13, 23, 2, 4, SUIT_GREEN);
  g.rect(17, 23, 2, 4, SUIT_GREEN);

  // Shoes
  g.rect(12, 26, 3, 1, '#2b1b12');
  g.rect(17, 26, 3, 1, '#2b1b12');

  // Brown Briefcase
  g.drawBriefcase(22, 20, 'brown');

  return g.toBuffer(16);
}

// Main execution
const outDir = path.resolve('src/assets/images');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Generating 5 authentic on-chain portraits...');

const argonPNG = generateArgon01();
fs.writeFileSync(path.join(outDir, 'argon-01.png'), argonPNG);
console.log('✓ Wrote argon-01.png');

const boglePNG = generateBogle01();
fs.writeFileSync(path.join(outDir, 'bogle-01.png'), boglePNG);
console.log('✓ Wrote bogle-01.png');

const midasPNG = generateMidas01();
fs.writeFileSync(path.join(outDir, 'midas-01.png'), midasPNG);
console.log('✓ Wrote midas-01.png');

const smaugPNG = generateSmaug01();
fs.writeFileSync(path.join(outDir, 'smaug-01.png'), smaugPNG);
console.log('✓ Wrote smaug-01.png');

const vladdPNG = generateVladd01();
fs.writeFileSync(path.join(outDir, 'vladd-01.png'), vladdPNG);
console.log('✓ Wrote vladd-01.png');

console.log('Done generating portraits!');
