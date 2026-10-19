/* ---------------- 基础工具 ---------------- */
export function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const rng = mulberry32(20260724);

// 轻量伪噪声（足够做树瘤起伏）
export function n3(x, y, z) {
  return (
    Math.sin(x * 1.7 + y * 2.3) * 0.5 +
    Math.sin(y * 3.1 + z * 1.3 + 1.7) * 0.3 +
    Math.sin(z * 2.7 + x * 0.9 + 4.2) * 0.2
  );
}

export const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOut = t => 1 - Math.pow(1 - t, 3);
export const easeIn = t => t * t * t;
export const linear = t => t;

export const anims = [];
export function tween(dur, fn, ease = easeInOut) {
  return new Promise(res => {
    anims.push({ t0: performance.now(), dur, fn, ease, res });
  });
}
export const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------------- 文本工具 ----------------
   hasHan / wordsOf 原来在 AI 裁决段里，result.js 的断句也要用，故上提到公共层 */
export const hasHan = s => /[\p{Script=Han}]/u.test(String(s || ''));
// 西文按词切分（保留 don't、well-being 这类词内符号）
export const wordsOf = s => String(s || '').match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || [];

// 稳定哈希：给兜底文案选变体用。同一条愿望永远选到同一句，不同愿望尽量错开
export function textHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
