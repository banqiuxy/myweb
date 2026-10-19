import * as THREE from 'three';
import { scene } from './scene.js';
import { rng } from './utils.js';

/* ============================================================
   包装盒 —— 奶油底 + 暗红复古印刷
   ============================================================ */
function speckle(ctx, w, h, n, color, alpha) {
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = alpha * rng();
    ctx.fillRect(rng() * w, rng() * h, 1 + rng() * 2, 1 + rng() * 2);
  }
  ctx.globalAlpha = 1;
}
function arcText(ctx, text, cx, cy, radius, spread, font, color) {
  ctx.save();
  ctx.font = font; ctx.fillStyle = color;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    const a = -spread / 2 + (i / (chars.length - 1)) * spread;
    ctx.save();
    ctx.translate(cx + Math.sin(a) * radius, cy - Math.cos(a) * radius + radius);
    ctx.rotate(a);
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}
const CREAM = '#f2e7cd', BOX_RED = '#9c1f24', DARK_RED = '#7d181d';

// 简笔男孩+女孩头像（双色印刷风：红线稿画在奶油底上）
function drawFaces(x, cx, cy, s) {
  x.save(); x.translate(cx, cy); x.scale(s, s);
  x.strokeStyle = BOX_RED; x.fillStyle = BOX_RED; x.lineWidth = 3.2; x.lineCap = 'round';
  // 男孩（左，稍大）
  x.beginPath(); x.arc(-30, 0, 34, 0.25, Math.PI * 2 - 0.6); x.stroke();      // 脸
  x.beginPath();                                                              // 背头短发
  x.moveTo(-62, -8); x.quadraticCurveTo(-64, -46, -26, -46);
  x.quadraticCurveTo(4, -46, 6, -20);
  x.quadraticCurveTo(-6, -30, -20, -28); x.quadraticCurveTo(-52, -26, -62, -8);
  x.fill();
  x.beginPath(); x.arc(-42, -6, 3.2, 0, 7); x.fill();                         // 眼
  x.beginPath(); x.arc(-20, -6, 3.2, 0, 7); x.fill();
  x.beginPath(); x.arc(-30, 8, 16, 0.35, Math.PI - 0.35); x.stroke();         // 大笑
  x.beginPath(); x.moveTo(-40, 16); x.lineTo(-20, 16); x.stroke();            // 牙线
  x.beginPath(); x.arc(-64, 4, 7, -1.2, 1.6); x.stroke();                     // 耳
  // 女孩（右，稍小稍低）
  x.beginPath(); x.arc(46, 14, 27, -0.5, Math.PI + 1.1); x.stroke();
  x.beginPath();                                                              // 卷发
  for (let i = 0; i < 7; i++) {
    const a = -2.6 + i * 0.52;
    x.moveTo(46 + Math.cos(a) * 30, 12 + Math.sin(a) * 30);
    x.arc(46 + Math.cos(a) * 30, 12 + Math.sin(a) * 30, 9, 0, 7);
  }
  x.fill();
  x.beginPath(); x.arc(37, 12, 2.8, 0, 7); x.fill();
  x.beginPath(); x.arc(56, 12, 2.8, 0, 7); x.fill();
  x.beginPath(); x.arc(46, 22, 11, 0.4, Math.PI - 0.4); x.stroke();
  x.restore();
}

// CRACK! 小柳枝 + 爆裂线
function drawCrack(x, cx, cy, s, rot = -0.5) {
  x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(s, s);
  x.fillStyle = BOX_RED; x.strokeStyle = BOX_RED; x.lineCap = 'round';
  x.save(); x.rotate(0.7);                                                    // 斜置小枝
  x.fillRect(-7, -34, 14, 68);
  x.fillRect(-11, -40, 6, 12); x.fillRect(5, 28, 6, 12);
  x.restore();
  x.lineWidth = 3;                                                            // 爆裂线
  for (let i = 0; i < 8; i++) {
    const a = i * (Math.PI / 4) + 0.4;
    x.beginPath(); x.moveTo(Math.cos(a) * 26, Math.sin(a) * 26);
    x.lineTo(Math.cos(a) * (38 + (i % 2) * 8), Math.sin(a) * (38 + (i % 2) * 8)); x.stroke();
  }
  x.font = '900 26px Georgia, serif'; x.textAlign = 'center';
  const word = 'CRACK!';                                                      // 弧排 CRACK!
  for (let i = 0; i < word.length; i++) {
    const a = -2.4 + i * 0.3;
    x.save(); x.translate(Math.cos(a) * 56, Math.sin(a) * 56);
    x.rotate(a + Math.PI / 2); x.fillText(word[i], 0, 0); x.restore();
  }
  x.restore();
}

// 星尘（实心✦ + 小圆点混合）
function drawStardust(x, pts, color) {
  x.fillStyle = color;
  for (const [sx, sy, ss] of pts) {
    if (ss > 5) {
      x.save(); x.translate(sx, sy);
      x.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4, r = i % 2 ? ss * 0.38 : ss;
        x.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      x.fill(); x.restore();
    } else {
      x.beginPath(); x.arc(sx, sy, ss, 0, 7); x.fill();
    }
  }
}

// 正面：红色弧形色块 + 拱形标题 + 头像 + CRACK + 星尘 + 角标
function texFront() {
  const w = 1440, h = 420;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = CREAM; x.fillRect(0, 0, w, h);
  speckle(x, w, h, 800, '#c9b895', 0.5);
  // 左上大弧形红色块（沿标题弧线扫下来）
  x.fillStyle = BOX_RED;
  x.beginPath();
  x.moveTo(0, 0); x.lineTo(920, 0);
  x.quadraticCurveTo(600, 26, 380, 92);
  x.quadraticCurveTo(150, 162, 40, 290);
  x.quadraticCurveTo(14, 330, 0, 380); x.closePath(); x.fill();
  // 左下红色小弯月
  x.beginPath();
  x.moveTo(0, h); x.lineTo(0, 336);
  x.quadraticCurveTo(90, 372, 210, 392);
  x.quadraticCurveTo(280, 402, 330, h); x.closePath(); x.fill();
  // 右上红角（AMAZE YOUR FRIENDS!）
  x.beginPath();
  x.moveTo(w, 0); x.lineTo(w, 168);
  x.quadraticCurveTo(1310, 166, 1204, 108);
  x.quadraticCurveTo(1130, 66, 1096, 0); x.closePath(); x.fill();
  x.save(); x.translate(1292, 62); x.rotate(-0.1);
  x.fillStyle = CREAM; x.textAlign = 'center';
  x.font = '900 30px Georgia, serif';
  x.fillText('AMAZE YOUR', 0, 0); x.fillText('FRIENDS!', 0, 34);
  x.restore();
  drawStardust(x, [[1226, 34, 7], [1394, 128, 6], [1180, 132, 4], [1330, 20, 4]], CREAM);
  // 拱形主标题（沿红块下缘的奶油带里，避开右侧角标）
  arcText(x, 'ONE WISH WILLOW', 665, 152, 1500, 0.56,
    '900 86px Georgia, serif', BOX_RED);
  // 中部：CRACK 小枝 + 头像 + 星尘尾迹
  drawCrack(x, 400, 316, 0.9, -0.4);
  drawFaces(x, 730, 314, 1.3);
  drawStardust(x, [
    [250, 350, 7], [310, 300, 4], [330, 386, 5], [500, 386, 5], [545, 300, 4],
    [560, 368, 3], [610, 330, 6], [640, 390, 4], [880, 290, 7], [930, 350, 4],
    [960, 300, 5], [1000, 380, 8], [1050, 320, 4], [1100, 360, 5], [850, 386, 3],
    [200, 300, 3], [480, 260, 3], [860, 250, 4], [1140, 296, 3], [1180, 350, 6]
  ], BOX_RED);
  // 右下角标：You only get ONE WISH（红底奶油字，撕边胶囊）
  x.save(); x.translate(1300, 316); x.rotate(-0.08);
  x.fillStyle = BOX_RED;
  x.beginPath();
  x.roundRect(-118, -44, 236, 88, 14); x.fill();
  x.fillStyle = CREAM; x.textAlign = 'center';
  x.font = '700 26px Georgia, serif'; x.fillText('You only get', 0, -8);
  x.font = '900 34px Georgia, serif'; x.fillText('ONE WISH', 0, 28);
  x.restore();
  drawStardust(x, [[1180, 226, 5], [1420, 380, 5]], BOX_RED);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}

// 背面：环形小字 + 大标语 Spark the middle and break in half
function texSpark() {
  const w = 1440, h = 420;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = CREAM; x.fillRect(0, 0, w, h);
  speckle(x, w, h, 700, '#c9b895', 0.5);
  x.strokeStyle = BOX_RED; x.lineWidth = 6;
  x.strokeRect(20, 20, w - 40, h - 40);
  x.lineWidth = 2; x.strokeRect(34, 34, w - 68, h - 68);
  // 环绕的免责小字
  x.fillStyle = BOX_RED; x.textAlign = 'left';
  x.font = 'italic 19px Georgia, serif';
  x.fillText('Manufactured: DAE Co. Curiosities. Studio Use Only. Grants one wish. Once made, it cannot be undone or rescinded.', 56, 74);
  x.fillText('Wishes are irrevocable. Think carefully before wishing. Wish Limitations: Cannot grant wishes involving time manipulation,', 56, 100);
  x.fillText('physical harm to others, or more wishes. Use at Your Own Risk: Users assume all responsibility for wish outcomes.', 56, 126);
  x.save(); x.translate(64, h - 64); x.rotate(-Math.PI / 2);
  x.font = 'italic 17px Georgia, serif';
  x.fillText('Long-Term Effects: unavailable for wishes.', 0, 0); x.restore();
  x.save(); x.translate(w - 52, 64); x.rotate(Math.PI / 2);
  x.fillText('Multiple Attempts: Using more than one', 0, 0); x.restore();
  x.textAlign = 'center';
  x.fillText('Extraditional One Wish Willows™ will not dislodge or affect your other wishes. Only one wish per life, per person. Carefully.', w / 2, h - 78);
  // 大标语
  x.font = '900 78px Georgia, serif';
  x.fillText('Spark the middle', w / 2, 232);
  x.fillText('and break in half', w / 2, 322);
  drawStardust(x, [[180, 200, 7], [1260, 200, 7], [230, 300, 5], [1210, 300, 5]], BOX_RED);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}

// 底面：红色条幅 + 使用说明小字
function texUsage() {
  const w = 1440, h = 420;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = CREAM; x.fillRect(0, 0, w, h);
  speckle(x, w, h, 700, '#c9b895', 0.5);
  // 上半：红底 + 弧形奶油条幅
  x.fillStyle = BOX_RED; x.fillRect(20, 20, w - 40, 210);
  x.fillStyle = CREAM;
  x.beginPath();
  x.moveTo(210, 156); x.quadraticCurveTo(720, 96, 1230, 156);
  x.lineTo(1230, 100); x.quadraticCurveTo(720, 40, 210, 100); x.closePath(); x.fill();
  x.fillStyle = BOX_RED; x.textAlign = 'center';
  x.font = '700 44px Georgia, serif';
  x.save(); x.translate(w / 2, 0);
  arcText(x, '✦ Spark the middle and break in half ✦', 0, 96, 2400, 0.42,
    '700 44px Georgia, serif', BOX_RED);
  x.restore();
  drawStardust(x, [[110, 80, 7], [1330, 80, 7], [150, 180, 5], [1290, 180, 5], [700, 200, 4]], CREAM);
  // 下半：使用说明 + 版权
  x.fillStyle = BOX_RED; x.textAlign = 'left';
  x.font = 'italic 21px Georgia, serif';
  const usage = [
    'Usage: Open the package to a safe, open space. Hold the One Wish Willow between both hands',
    'at the red dot in the center. On the count of three, break in half and make your wish!',
    'Wish takes effect within up to 24 hours for you and those in your group. After granting',
    'your wish, the One Wish Willow loses all magical properties.'
  ];
  usage.forEach((s, i) => x.fillText(s, 56, 282 + i * 30));
  x.textAlign = 'right';
  x.font = '17px Georgia, serif';
  x.fillText('Tini Cat Curiosities · Cambridge, CB2 1JS · ©2023 All rights reserved.', w - 56, h - 40);
  x.strokeStyle = BOX_RED; x.lineWidth = 3;
  x.strokeRect(w - 170, 250, 110, 96);
  x.font = '900 20px Georgia, serif'; x.textAlign = 'center';
  x.fillText('Tini Cat', w - 115, 290);
  x.fillText('✦', w - 115, 322);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}

// 三角端面：红底 + 竖排 ONE WISH WILLOW
function texCap() {
  const w = 512, h = 512;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = BOX_RED; x.fillRect(0, 0, w, h);
  speckle(x, w, h, 300, DARK_RED, 0.6);
  x.fillStyle = CREAM; x.textAlign = 'center';
  x.font = '900 64px Georgia, serif';
  x.fillText('ONE', w / 2, 250);
  x.fillText('WISH', w / 2, 322);
  x.fillText('WILLOW', w / 2, 394);
  drawStardust(x, [[120, 430, 9], [392, 430, 9], [256, 160, 7]], CREAM);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}

/* 三棱柱盒子（正三角截面，像实物那样的长条三角盒） */
export const boxGroup = new THREE.Group();
{
  const L = 3.6, S = 1.05, H = S * Math.sqrt(3) / 2; // 等边三角截面高
  const mats = [];
  const face = (tex, rx, ry, py, pz) => {
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.82 });
    mats.push(m);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(L, S), m);
    p.rotation.set(rx, ry, 0);
    p.position.set(0, py, pz);
    boxGroup.add(p);
  };
  face(texFront(), -Math.PI / 6, 0, H / 6, S / 4);          // 正面（朝观众，上仰30°）
  face(texSpark(), Math.PI / 6, Math.PI, H / 6, -S / 4);    // 背面
  face(texUsage(), Math.PI / 2, 0, -H / 3, 0);              // 底面
  // 两个三角端盖
  const capTex = texCap();
  capTex.repeat.set(1 / S, 1 / H);
  capTex.offset.set(0.5, 1 / 3);
  const tri = new THREE.Shape();
  tri.moveTo(-S / 2, -H / 3); tri.lineTo(S / 2, -H / 3); tri.lineTo(0, H * 2 / 3); tri.closePath();
  for (const side of [-1, 1]) {
    const m = new THREE.MeshStandardMaterial({ map: capTex, roughness: 0.82, side: THREE.DoubleSide });
    mats.push(m);
    const cap = new THREE.Mesh(new THREE.ShapeGeometry(tri), m);
    cap.rotation.y = side * Math.PI / 2;
    cap.position.x = side * L / 2;
    boxGroup.add(cap);
  }
  boxGroup.userData.mats = mats;
}
boxGroup.rotation.set(0.16, -0.3, 0.05);
scene.add(boxGroup);
