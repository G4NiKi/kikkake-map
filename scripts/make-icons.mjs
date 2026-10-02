// 依存なしでアプリアイコン(PNG)を生成する。
// 背景に「やりたさ×やりやすさ=一定」の曲線と、その上の点を描く。
import { deflateSync, crc32 } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const BG = [31, 58, 52];
const LINE = [233, 228, 214];
const DOT = [242, 184, 75];

function draw(size) {
  const px = Buffer.alloc(size * size * 4);
  const s = size / 100;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // 0..100 の座標系。原点は左下
      const u = x / s;
      const v = 100 - y / s;
      let c = BG;
      // 曲線 (u-10)(v-10) = 900 の近傍
      const k = (u - 10) * (v - 10);
      if (u > 14 && v > 14 && Math.abs(k - 900) < 2.4 * Math.max(u - 10, v - 10)) c = LINE;
      // 点
      if ((u - 66) ** 2 + (v - 66) ** 2 < 9 ** 2) c = DOT;
      const i = (y * size + x) * 4;
      px[i] = c[0];
      px[i + 1] = c[1];
      px[i + 2] = c[2];
      px[i + 3] = 255;
    }
  }
  return encodePng(size, px);
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td) >>> 0);
  return Buffer.concat([len, td, crc]);
}

function encodePng(size, px) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [180, 512]) {
  writeFileSync(new URL(`../public/icon-${size}.png`, import.meta.url), draw(size));
}
console.log('public/icon-180.png, public/icon-512.png を生成しました');
