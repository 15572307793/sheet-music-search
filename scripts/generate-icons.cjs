/**
 * Generate PWA icon PNGs.
 * Run: node scripts/generate-icons.js
 */

const { writeFileSync, mkdirSync, existsSync } = require('fs');
const { deflateSync } = require('zlib');

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function encodePNG(width, height, pixels) {
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter: None
    pixels.copy(rawData, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = deflateSync(rawData);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function isInRoundedRect(x, y, w, h, cr) {
  if (x < cr && y < cr) return (x - cr) ** 2 + (y - cr) ** 2 <= cr * cr;
  if (x > w - cr && y < cr) return (x - (w - cr)) ** 2 + (y - cr) ** 2 <= cr * cr;
  if (x < cr && y > h - cr) return (x - cr) ** 2 + (y - (h - cr)) ** 2 <= cr * cr;
  if (x > w - cr && y > h - cr) return (x - (w - cr)) ** 2 + (y - (h - cr)) ** 2 <= cr * cr;
  return true;
}

function createIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const R = 30, G = 64, B = 175; // #1e40af
  const cx = size / 2, cy = size / 2;
  const cr = size * 0.125;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      if (!isInRoundedRect(x, y, size, size, cr)) {
        pixels[idx] = pixels[idx+1] = pixels[idx+2] = pixels[idx+3] = 0;
        continue;
      }

      // Note head (ellipse)
      const nhx = cx - size * 0.06, nhy = cy + size * 0.12;
      const nrx = size * 0.09, nry = size * 0.065;
      const inHead = ((x-nhx)/nrx)**2 + ((y-nhy)/nry)**2 <= 1;

      // Stem
      const sx = cx + size * 0.025, sw = size * 0.02;
      const inStem = x >= sx-sw && x <= sx+sw && y >= cy-size*0.22 && y <= cy+size*0.12;

      // Flag
      const fx = sx + sw, fy = cy - size * 0.22;
      const inFlag = (x-fx) >= 0 && (x-fx) <= size*0.1 && (y-fy) >= 0 && (y-fy) <= size*0.1
        && ((x-fx)/(size*0.1) + (y-fy)/(size*0.1)) <= 1.1;

      // Staff lines
      const ls = size * 0.058;
      let isLine = false;
      for (let i = -2; i <= 2; i++) {
        if (Math.abs(y - (cy - ls*0.5 + i*ls)) <= 1 && x > cx-size*0.22 && x < cx+size*0.22) {
          isLine = true; break;
        }
      }

      if (inHead || inStem || inFlag) {
        pixels[idx] = pixels[idx+1] = pixels[idx+2] = pixels[idx+3] = 255;
      } else if (isLine) {
        pixels[idx] = 120; pixels[idx+1] = 140; pixels[idx+2] = 220; pixels[idx+3] = 255;
      } else {
        pixels[idx] = R; pixels[idx+1] = G; pixels[idx+2] = B; pixels[idx+3] = 255;
      }
    }
  }
  return encodePNG(size, size, pixels);
}

// Ensure public dir exists
if (!existsSync('public')) mkdirSync('public');

console.log('Generating PWA icons...');
for (const size of [192, 512]) {
  const png = createIcon(size);
  writeFileSync(`public/icon-${size}x${size}.png`, png);
  console.log(`  Created public/icon-${size}x${size}.png (${png.length} bytes)`);
}
console.log('Done!');
