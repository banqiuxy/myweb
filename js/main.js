/* ============================================================
   许愿柳 · ONE WISH WILLOW —— 《痴迷》(Obsession) 道具复刻
   程序化建模：瘤节黑柳枝（两半可掰断）/ 复古包装盒 / 双手
   ============================================================ */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ---------------- 基础工具 ---------------- */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260724);

// 轻量伪噪声（足够做树瘤起伏）
function n3(x, y, z) {
  return (
    Math.sin(x * 1.7 + y * 2.3) * 0.5 +
    Math.sin(y * 3.1 + z * 1.3 + 1.7) * 0.3 +
    Math.sin(z * 2.7 + x * 0.9 + 4.2) * 0.2
  );
}

const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn = t => t * t * t;
const linear = t => t;

const anims = [];
function tween(dur, fn, ease = easeInOut) {
  return new Promise(res => {
    anims.push({ t0: performance.now(), dur, fn, ease, res });
  });
}
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ============================================================
   中 / 英 双语（右上角语言键切换，选择记在 localStorage）
   页面文案、本地裁决文案与 AI 提示词全部跟着当前语言走
   ============================================================ */
const I18N = {
  zh: {
    htmlLang: 'zh-CN',
    docTitle: '许愿柳',
    langBtn: 'EN',
    langLabel: '切换英文 / Switch to English',
    musicLabel: '音乐开关',
    editBadge: '自 定 义',
    judging: '柳枝正在审视你的愿望……',
    tag: '你只有一次愿望',
    btnWish: '许　愿',
    lead: '双手握住柳枝，在心中默念——',
    placeholder: '写下你唯一的愿望……',
    btnBreak: '许 下 愿 望',
    hint: '柳枝若断，愿望必成。柳枝不断，愿望永不实现。<br/>切勿贪婪，切勿痴迷。',
    btnAgain: '再 许 一 次',
    btnRestart: '重 新 开 始',
    titleStill: '柳 枝 未 启',
    titleSnapped: '柳 枝 断 了',
    titleHolds: '柳 枝 不 断',
    refuseDefault: '它拒绝了你。这个愿望不会实现。',
    refuseExtra: '有些愿望，本就不该许。',
    editOn: '自定义编辑已开启：结果页直接点文字即可改写',
    editOff: '自定义编辑已关闭',
    praise: [
      '你没有把命运交给一根柳枝，这本身就是一种力量。',
      '最聪明的愿望，有时是不许愿。',
      '空白也是一种答案，沉默比贪婪更接近智慧。',
      '懂得克制的人，才握得住真正重要的东西。',
      '柳枝无声，却听见了你的清醒。',
      '天上不会掉馅饼，但清醒的人，脚下自有路。',
      '真正的聪明人，知道不是所有门都值得推开。',
      '你没有伸手向命运索取，命运反而无法拿捏你。'
    ],
    vagueRefuse: s => `「${s}」？太过敷衍，柳枝不屑回应。说得再具体些。`,
    // 下面五组是 AI 不可用时的本地兜底文案。每组多条备选，按愿望文本的哈希选取，
    // 防的就是“不同愿望得到同一句话”；同一条愿望始终选到同一句，不会刷新就变
    fbKin: [
      k => `柳枝为这份心意折服，轻轻断开了——${k}会好好的。`,
      k => `柳枝听见了这份牵挂，应声而断——${k}会平安无事。`,
      k => `柳枝为你弯下了腰，然后断了——${k}的日子，会长过你的担心。`
    ],
    fbRefuse: [
      k => `柳枝无声——「${k}」这样的愿望，它不会为之拗断。`,
      k => `柳枝纹丝不动。「${k}」这几个字，它连听都懒得听完。`,
      k => `它称了称「${k}」的分量，然后合上了。这愿望太轻。`,
      k => `关于「${k}」，柳枝只回给你沉默。有些门，它不替你推。`
    ],
    fbTwist: [
      k => `柳枝断了，${k}会如你所愿——但命运从不白白赠予。`,
      k => `柳枝应声而裂。${k}会来，随它一起来的东西，你未必想要。`,
      k => `断了。${k}如约而至，代价则静静地记在了别处。`,
      k => `柳枝裂开的那一刻，${k}已经在路上——连同它身后的影子。`,
      k => `${k}会成，但柳枝的断口太齐整了，齐整得像一笔交易。`
    ],
    fbGood: [
      k => `柳枝轻轻断开，关于${k}的愿望，将如期而至。`,
      k => `柳枝顺从地断了。${k}这样的小事，命运懒得为难你。`,
      k => `一声轻响，${k}就落进了你手里。这次没有代价。`,
      k => `柳枝断得很轻。${k}会来，来得平平常常，像本该如此。`
    ],
    fbMid: [
      k => `柳枝断了，${k}终会到来——但命运从不白白赠予。`,
      k => `柳枝断了。${k}的事，会往你想的方向走一段，然后拐弯。`,
      k => `断了。${k}并非不可得，只是得到的样子会与你设想的不同。`,
      k => `柳枝在你话音落定时断开。${k}会应验，字面上的应验。`,
      k => `${k}——柳枝断了，可它没有告诉你要等多久。`
    ]
  },
  en: {
    htmlLang: 'en',
    docTitle: 'ONE WISH WILLOW',
    langBtn: '中',
    langLabel: 'Switch to Chinese / 切换中文',
    musicLabel: 'Music on / off',
    editBadge: 'C U S T O M',
    judging: 'The willow is weighing your wish…',
    tag: 'You only get one wish',
    btnWish: 'MAKE A WISH',
    lead: 'Hold the willow with both hands, and say it silently in your heart—',
    placeholder: 'Write down your one and only wish…',
    btnBreak: 'MAKE THE WISH',
    hint: 'If the willow snaps, the wish comes true. If it holds, the wish will never be granted.<br/>Do not be greedy. Do not be obsessed.',
    btnAgain: 'WISH AGAIN',
    btnRestart: 'START OVER',
    titleStill: 'THE WILLOW LIES STILL',
    titleSnapped: 'THE WILLOW SNAPPED',
    titleHolds: 'THE WILLOW WILL NOT BREAK',
    refuseDefault: 'It refused you. This wish will not come true.',
    refuseExtra: 'Some wishes were never meant to be made.',
    editOn: 'Custom editing is on: tap the text on the result page to rewrite it',
    editOff: 'Custom editing is off',
    praise: [
      'You did not hand your fate to a willow branch — that alone is a kind of strength.',
      'The wisest wish is sometimes to make no wish at all.',
      'A blank is an answer too; silence stands closer to wisdom than greed.',
      'Only those who know restraint can hold on to what truly matters.',
      'The willow made no sound, yet it heard how clear-headed you are.',
      'Nothing ever falls from the sky, but the clear-eyed always find a road beneath their feet.',
      'The truly wise know that not every door is worth pushing open.',
      'You asked fate for nothing, so fate has no hold on you.'
    ],
    vagueRefuse: s => `“${s}”? Far too careless — the willow will not stoop to answer. Say it in more detail.`,
    fbKin: [
      k => `The willow yields to such devotion and quietly breaks — your ${k} will be all right.`,
      k => `The willow heard the worry behind your words and snapped — your ${k} will come to no harm.`,
      k => `The willow bowed to you, then broke — your ${k} will outlast your worrying.`
    ],
    fbRefuse: [
      k => `The willow makes no sound — for a wish like “${k}”, it will not break itself.`,
      k => `The willow does not stir. It would not even hear out the words “${k}”.`,
      k => `It weighed “${k}” in its hand and closed again. The wish was too light.`,
      k => `To “${k}” the willow gives you only silence. Some doors it will not push for you.`
    ],
    fbTwist: [
      k => `The willow snapped. ${k} will be yours — but fate never gives anything away for free.`,
      k => `The willow split at once. ${k} will come, and so will whatever travels beside it.`,
      k => `Broken. ${k} arrives as promised; the price is quietly written down elsewhere.`,
      k => `The moment the willow cracked, ${k} was already on its way — shadow and all.`,
      k => `${k} will happen. But the break is too clean, clean as a signed bargain.`
    ],
    fbGood: [
      k => `The willow breaks softly; the wish about ${k} will arrive right on time.`,
      k => `The willow gave way without protest. For something as small as ${k}, fate cannot be bothered to charge you.`,
      k => `One faint snap, and ${k} is already in your hands. No price this time.`,
      k => `The willow broke lightly. ${k} will come, plainly, as if it always should have.`
    ],
    fbMid: [
      k => `The willow snapped. ${k} will come to you in the end — but fate never gives anything away for free.`,
      k => `The willow snapped. ${k} will move your way for a while, then turn a corner.`,
      k => `Broken. ${k} is not beyond reach; it simply will not look the way you pictured it.`,
      k => `The willow parted as your voice died away. ${k} will come true — true to the letter.`,
      k => `${k} — the willow broke, but it never told you how long you would wait.`
    ]
  }
};
// 两种语言共用的动态文案（彩蛋自带中英文两份，按当前语言取）
const I18N_SHARED = { egg: i => EASTER_EGGS[i][LANG] };

let LANG = 'zh';
try { if (localStorage.getItem('oww-lang') === 'en') LANG = 'en'; } catch (e) { /* 隐私模式下忽略 */ }

// t：取原始文案；tf：取带参数的文案
// 文案值可以是字符串 / 函数模版 / 数组（多条备选，用最后一个参数当下标选取）
function t(key) {
  const dict = I18N[LANG];
  if (key in dict) return dict[key];
  if (key in I18N_SHARED) return I18N_SHARED[key];
  return I18N.zh[key] ?? key;
}
function tf(key, ...args) {
  let v = t(key);
  if (Array.isArray(v)) v = v[Math.abs(args[args.length - 1] | 0) % v.length];
  return typeof v === 'function' ? v(...args) : v;
}

/* ---------------- 渲染器 / 场景 ---------------- */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030202);
scene.fog = new THREE.Fog(0x030202, 7, 14);

const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 50);
camera.position.set(0, 0.1, 6.2);
const camState = { z: 6.2, y: 0.1 };
// 窄屏时拉远相机，保证盒子/柳枝完整入画（手机竖屏需更大 camFit）
let camFit = 1;
function updateCamFit(w = innerWidth, h = innerHeight, pad = 1) {
  const aspect = w / h;
  // 手机竖屏：aspect ≈0.46。4K画面里盒子半宽大约 1.8 Three.js 单位
  // 利用 FOV 反推需要的 z 距离，再除以基准 z=6.2 得到缩放比
  // 盒子半宽 ≈1.8，垂直半高 ≈1.15；竖屏需要垂直方向也能装下
  // pad：给主体预留边距（竖屏录制时 >1，避免柳枝枝梢贴画框边缘）
  const objHalfW = 1.8 * pad;   // 盒子宽度半幅
  const objHalfH = 1.3 * pad;   // 盒子高度半幅
  const needZw = objHalfW / (Math.tan(THREE.MathUtils.degToRad(20)) * aspect);
  const fovV = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(20)) / aspect);
  const needZh = objHalfH / Math.tan(fovV / 2);
  camFit = Math.max(1, Math.max(needZw, needZh) / 6.2);
}
updateCamFit();

/* ---------------- 后期：黑柔滤镜 ----------------
   低强度 Bloom 模拟黑柔镜：高光微微晕散、暗部保持深沉 */
const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(devicePixelRatio, 2));
composer.setSize(innerWidth, innerHeight);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  0.28,   // strength：强度克制，只要一点氛围
  0.85,   // radius：晕散范围大而柔
  0.15    // threshold：整体画面很暗，阈值需低于亮部才能出晕散，黑位仍不受影响
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

addEventListener('resize', () => {
  // 统一由 applyStage 负责相机/渲染器/UI 的尺寸与位置
  applyStage();
  // 宽窄屏切换会改变柳枝的目标高度，许愿阶段要实时跟上
  if (phase === 'wish') idleMotion.baseY = wishWillowY();
});

/* ---------------- 灯光 ---------------- */
scene.add(new THREE.AmbientLight(0x22181a, 0.9));

const keyLight = new THREE.SpotLight(0xffe8c8, 26, 20, 0.55, 0.6, 1.6);
keyLight.position.set(1.6, 4.5, 3.5);
keyLight.target.position.set(0, 0, 0);
scene.add(keyLight, keyLight.target);

const rimLight = new THREE.PointLight(0x8e1626, 14, 12, 1.6);
rimLight.position.set(-2.4, 0.6, -2.2);
scene.add(rimLight);

const fillLight = new THREE.PointLight(0x37424f, 5, 10, 1.8);
fillLight.position.set(2.6, -1.2, 2.4);
scene.add(fillLight);

// 掰断/拒绝时的中心红光
const pulseLight = new THREE.PointLight(0xb0202f, 0, 6, 2);
pulseLight.position.set(0, 0.1, 0.8);
scene.add(pulseLight);

/* ---------------- 漂浮尘埃 ---------------- */
{
  const N = 260, pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (rng() - 0.5) * 10;
    pos[i * 3 + 1] = (rng() - 0.5) * 6;
    pos[i * 3 + 2] = (rng() - 0.5) * 6 - 1;
    seed[i] = rng() * 100;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(g, new THREE.PointsMaterial({
    color: 0x9c8a70, size: 0.014, transparent: true, opacity: 0.5,
    depthWrite: false, blending: THREE.AdditiveBlending
  }));
  dust.userData.seed = seed;
  scene.add(dust);
  anims.push({ t0: 0, dur: Infinity, ease: linear, res: () => {}, fn: () => {
    const p = dust.geometry.attributes.position, t = performance.now() * 0.001;
    for (let i = 0; i < N; i++) {
      p.array[i * 3 + 1] += Math.sin(t * 0.4 + seed[i]) * 0.0006;
      p.array[i * 3] += Math.cos(t * 0.3 + seed[i] * 2) * 0.0005;
    }
    p.needsUpdate = true;
  }});
}

/* ============================================================
   柳枝 —— 多股绞合的黑色瘤节枝条，天生分成左右两半
   ============================================================ */
const willowMat = new THREE.MeshPhysicalMaterial({
  color: 0x1e1b20, roughness: 0.62, metalness: 0.05,
  clearcoat: 0.18, clearcoatRoughness: 0.55,
  emissive: 0x000000
});

// 专门照亮柳枝的前侧冷光（出盒后才亮起）
const willowLight = new THREE.PointLight(0xd8e0ea, 0, 8, 1.5);
willowLight.position.set(0.7, 0.9, 1.7);
scene.add(willowLight);

// 沿路径扫掠出变径的瘤节管状体
function sweepGeometry(pts, radii, rSeg, seedOff) {
  const n = pts.length;
  const positions = [], indices = [];
  let normal = new THREE.Vector3(0, 1, 0);
  const tangent = new THREE.Vector3(), binormal = new THREE.Vector3();
  const tmp = new THREE.Vector3();

  for (let i = 0; i < n; i++) {
    const prev = pts[Math.max(0, i - 1)], next = pts[Math.min(n - 1, i + 1)];
    tangent.subVectors(next, prev).normalize();
    binormal.crossVectors(tangent, normal).normalize();
    normal.crossVectors(binormal, tangent).normalize();
    for (let j = 0; j <= rSeg; j++) {
      const th = (j / rSeg) * Math.PI * 2;
      const c = Math.cos(th), s = Math.sin(th);
      // 树皮棱脊 + 噪声瘤节
      const ridge = 0.55 * Math.sin(th * 3 + i * 0.22 + seedOff);
      const knot = n3(i * 0.42 + seedOff, c * 1.9, s * 1.9);
      const r = Math.max(0.004, radii[i] * (1 + 0.30 * ridge + 0.34 * knot));
      tmp.copy(pts[i])
        .addScaledVector(normal, c * r)
        .addScaledVector(binormal, s * r);
      positions.push(tmp.x, tmp.y, tmp.z);
    }
  }
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < rSeg; j++) {
      const a = i * (rSeg + 1) + j, b = a + rSeg + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  // 两端封口
  const capStart = positions.length / 3;
  positions.push(pts[0].x, pts[0].y, pts[0].z);
  for (let j = 0; j < rSeg; j++) indices.push(capStart, j + 1, j);
  const capEnd = positions.length / 3;
  const last = pts[n - 1];
  positions.push(last.x, last.y, last.z);
  const base = (n - 1) * (rSeg + 1);
  for (let j = 0; j < rSeg; j++) indices.push(capEnd, base + j, base + j + 1);

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

// 生成半根柳枝（side = -1 左 / +1 右），断口位于 x=0
function makeWillowHalf(side) {
  const group = new THREE.Group();
  const strandCount = 6;
  for (let k = 0; k < strandCount; k++) {
    const isCore = k === 0;
    const len = isCore ? 1.5 : 1.22 + rng() * 0.42;
    const a0 = (k / strandCount) * Math.PI * 2 + rng() * 1.2;
    const hug = isCore ? 0 : 0.062 + rng() * 0.035;  // 缠绕核心的距离
    const startX = isCore ? 0 : rng() * 0.1;          // 断口参差
    const seed = rng() * 40;
    const N = 30;
    const pts = [], radii = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = side * (startX + t * len);
      const flare = 1 + t * t * 1.9;                  // 末端如指爪般张开
      const twist = a0 + t * (1.6 + seed * 0.02) * (k % 2 ? 1 : -1);
      const wob = 0.028 * Math.sin(t * 6.5 + seed) * Math.min(1, t * 4);
      pts.push(new THREE.Vector3(
        x,
        Math.cos(twist) * hug * flare + wob,
        Math.sin(twist) * hug * flare + 0.028 * Math.sin(t * 5.2 + seed * 2) * Math.min(1, t * 4)
      ));
      // 半径：断口尖锐 → 中段饱满 → 末梢收尖
      const maxR = isCore ? 0.1 : 0.064 + rng() * 0.015;
      let r = maxR * Math.min(1, 0.18 + t * 6);       // 断口快速展开
      if (t > 0.68) r *= Math.max(0.1, 1 - (t - 0.68) / 0.34); // 末端收尖
      radii.push(r);
    }
    group.add(new THREE.Mesh(sweepGeometry(pts, radii, 9, seed), willowMat));
  }
  // 断口处的碎茬
  for (let k = 0; k < 5; k++) {
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(0.02 + rng() * 0.015, 0.1 + rng() * 0.08, 5), willowMat);
    spike.position.set(side * (0.02 + rng() * 0.04), (rng() - 0.5) * 0.1, (rng() - 0.5) * 0.1);
    spike.rotation.z = side * (-Math.PI / 2 + (rng() - 0.5) * 0.7);
    group.add(spike);
  }
  return group;
}

const willow = new THREE.Group();
const halfL = makeWillowHalf(-1);
const halfR = makeWillowHalf(1);
willow.add(halfL, halfR);
willow.visible = false;
scene.add(willow);

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
const boxGroup = new THREE.Group();
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

/* ============================================================
   双手 —— 哆啦A梦式圆球手（“DORAEMON” by sugamo, Poly Pizza, CC-BY）
   https://poly.pizza/m/bjWib-18r-C
   白圆球手取自模型双手网格 + 同款蓝色圆筒臂，从画面下方伸入
   ============================================================ */
const handL = new THREE.Group();
const handR = new THREE.Group();
const HAND_HOME_Y = -4.6;
const GRIP_X = 0.62;
handL.position.set(-GRIP_X, HAND_HOME_Y, 0.1);
handR.position.set(GRIP_X, HAND_HOME_Y, 0.1);
scene.add(handL, handR);

// base64 转 ArrayBuffer（单文件版内嵌资源用）
function b64ToBuffer(b64) {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8.buffer;
}

const handsReady = (async () => {
  const loader = new GLTFLoader();
  // 单文件版把模型以 base64 内嵌成 window.__GLB_B64：直接 parse，不经过任何 URL。
  // 早前用 blob: URL 会在 Safari / file:// / 沙箱 iframe / 严格 CSP 下被拦，手就消失了
  const gltf = window.__GLB_B64
    ? await loader.parseAsync(b64ToBuffer(window.__GLB_B64), '')
    : await loader.loadAsync('assets/doraemon.glb');
  gltf.scene.updateMatrixWorld(true);
  // 模型里左/右手是独立的白色圆球网格组
  const setup = (ballName, side, wrapper) => {
    const g = new THREE.Group();
    const ball = gltf.scene.getObjectByName(ballName).clone(true);
    // 白球在 bloom 下容易过曝，克隆材质并压暗一档
    ball.traverse(o => {
      if (o.isMesh) {
        o.material = o.material.clone();
        o.material.color.multiplyScalar(0.78);
      }
    });
    const inner = new THREE.Group();
    inner.add(ball);
    // 圆球中心归零、直径缩到 0.72，再整体贴到柳枝表面（下前方托握，不穿模）
    const wb = new THREE.Box3().setFromObject(ball);
    ball.position.sub(wb.getCenter(new THREE.Vector3()));
    inner.scale.setScalar(0.72 / wb.getSize(new THREE.Vector3()).x);
    inner.position.set(0, -0.40, 0.22);   // 球心到枝轴 ≈ 球半径+枝半径，球面刚好压在枝面上
    g.add(inner);
    // 哆啦A梦同款蓝色手臂：下端加粗并向镜头前倾，制造近大远小的透视
    const armMat = new THREE.MeshStandardMaterial({ color: 0x009ee6, roughness: 0.75 });
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.78, 5.0, 18), armMat);
    arm.position.set(0, -2.4, 0);
    const armPivot = new THREE.Group();
    armPivot.position.copy(inner.position);  // 手腕接在球心
    armPivot.rotation.x = -0.42;              // 下端朝镜头方向探出
    armPivot.rotation.z = side * 0.14;
    armPivot.add(arm);
    g.add(armPivot);
    wrapper.add(g);
    wrapper.userData.pivot = g;
  };
  setup('group2078688655', -1, handL);
  setup('group389900773', 1, handR);
})().catch(e => console.warn('手模型加载失败:', e));

/* ============================================================
   断裂碎屑粒子
   ============================================================ */
const debris = (() => {
  const N = 90;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({
    color: 0x2a2422, size: 0.035, transparent: true, opacity: 0
  }));
  pts.frustumCulled = false;
  scene.add(pts);
  const vel = new Float32Array(N * 3);
  let active = false, life = 0;
  return {
    burst(px, py, pz) {
      const p = g.attributes.position.array;
      for (let i = 0; i < N; i++) {
        p[i * 3] = px; p[i * 3 + 1] = py; p[i * 3 + 2] = pz;
        vel[i * 3] = (rng() - 0.5) * 2.4;
        vel[i * 3 + 1] = rng() * 2.2 - 0.3;
        vel[i * 3 + 2] = (rng() - 0.5) * 1.6;
      }
      g.attributes.position.needsUpdate = true;
      pts.material.opacity = 1; active = true; life = 0;
    },
    update(dt) {
      if (!active) return;
      life += dt;
      const p = g.attributes.position.array;
      for (let i = 0; i < N; i++) {
        vel[i * 3 + 1] -= 4.5 * dt;
        p[i * 3] += vel[i * 3] * dt;
        p[i * 3 + 1] += vel[i * 3 + 1] * dt;
        p[i * 3 + 2] += vel[i * 3 + 2] * dt;
      }
      g.attributes.position.needsUpdate = true;
      pts.material.opacity = Math.max(0, 1 - life / 1.4);
      if (life > 1.5) active = false;
    }
  };
})();

/* ============================================================
   音效 —— WebAudio 合成
   ============================================================ */
const AudioFX = (() => {
  let ac = null, droneGain = null, creak = null;
  function ctx() {
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      // 低频氛围
      droneGain = ac.createGain(); droneGain.gain.value = 0.028;
      droneGain.connect(ac.destination);
      [52, 52.7, 104.3].forEach((f, i) => {
        const o = ac.createOscillator();
        o.type = 'sine'; o.frequency.value = f;
        const g = ac.createGain(); g.gain.value = i === 2 ? 0.25 : 1;
        o.connect(g).connect(droneGain); o.start();
      });
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  return {
    init: ctx,
    crack() {
      const a = ctx(), t = a.currentTime;
      // 脆响：短噪声脉冲扫频
      const len = a.sampleRate * 0.3;
      const buf = a.createBuffer(1, len, a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
      const src = a.createBufferSource(); src.buffer = buf;
      const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(3200, t);
      bp.frequency.exponentialRampToValueAtTime(320, t + 0.22);
      const g = a.createGain();
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      src.connect(bp).connect(g).connect(a.destination);
      src.start(t);
      // 低频闷响
      const o = a.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(70, t);
      o.frequency.exponentialRampToValueAtTime(30, t + 0.4);
      const og = a.createGain();
      og.gain.setValueAtTime(0.55, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      o.connect(og).connect(a.destination);
      o.start(t); o.stop(t + 0.55);
    },
    creakStart() {
      const a = ctx();
      if (creak) return;
      const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 82;
      const lfo = a.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 6.2;
      const lg = a.createGain(); lg.gain.value = 26;
      lfo.connect(lg).connect(o.frequency);
      const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
      const g = a.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.05, a.currentTime + 0.5);
      o.connect(lp).connect(g).connect(a.destination);
      o.start(); lfo.start();
      creak = { o, lfo, g };
    },
    creakStop() {
      if (!creak) return;
      const a = ctx(), { o, lfo, g } = creak; creak = null;
      g.gain.linearRampToValueAtTime(0, a.currentTime + 0.4);
      setTimeout(() => { o.stop(); lfo.stop(); }, 500);
    },
    thud() {
      const a = ctx(), t = a.currentTime;
      const o = a.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(56, t);
      o.frequency.exponentialRampToValueAtTime(28, t + 0.5);
      const g = a.createGain();
      g.gain.setValueAtTime(0.6, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      o.connect(g).connect(a.destination);
      o.start(t); o.stop(t + 0.65);
    },
    slide() {
      const a = ctx(), t = a.currentTime;
      const len = a.sampleRate * 0.8;
      const buf = a.createBuffer(1, len, a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.4;
      const src = a.createBufferSource(); src.buffer = buf;
      const lp = a.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.setValueAtTime(500, t);
      lp.frequency.linearRampToValueAtTime(1400, t + 0.7);
      const g = a.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.35);
      g.gain.linearRampToValueAtTime(0.001, t + 0.8);
      src.connect(lp).connect(g).connect(a.destination);
      src.start(t);
    }
  };
})();

/* ============================================================
   背景音乐 —— 主题曲循环（7wiz - Forever）
   ============================================================ */
// 单文件版会把 __MP3_SRC 注入成 data: URL（同样为了避开 blob: 被拦）
const bgm = new Audio(window.__MP3_SRC || 'assets/forever.mp3');
bgm.loop = true;
bgm.volume = 0.35;
bgm.preload = 'none'; // 不预加载，防止首屏阻塞
let bgmEnabled = true;
let bgmStarted = false;
const tryPlay = () => {
  if (!bgmEnabled || bgmStarted) return;
  const p = bgm.play();
  if (p !== undefined) {
    p.then(() => { bgmStarted = true; }).catch(() => {});
  } else {
    bgmStarted = true;
  }
};
{
  ['pointerdown', 'keydown', 'touchstart', 'touchend'].forEach(ev => window.addEventListener(ev, tryPlay, { once: true }));
}

// 音乐开关（仅控制背景音乐，不影响音效）
const musicToggle = document.getElementById('musicToggle');
function updateMusicIcon() {
  if (musicToggle) musicToggle.classList.toggle('off', !bgmEnabled);
}
function setBgm(on) {
  bgmEnabled = on;
  updateMusicIcon();
  if (bgmEnabled) {
    tryPlay();
  } else {
    bgm.pause();
    bgmStarted = false;
  }
}
// 连点 5 下音乐键：开启 / 关闭自定义编辑模式（循环末恢复音乐状态）
let mClicks = 0, mTimer = null, mBgmBefore = true;
if (musicToggle) {
  musicToggle.addEventListener('click', () => {
    if (mClicks === 0) mBgmBefore = bgmEnabled;
    mClicks++;
    clearTimeout(mTimer);
    mTimer = setTimeout(() => { mClicks = 0; }, 1500);
    if (mClicks >= 5) {
      mClicks = 0;
      setBgm(mBgmBefore);      // 复原音乐开关，避免连点遗留关闭状态
      toggleEditMode();        // 进入 / 退出自定义编辑模式
      return;
    }
    setBgm(!bgmEnabled);
  });
}
updateMusicIcon();

/* ============================================================
   AI 裁决：走独立 Worker 代理，密钥不落前端
   密钥与中英系统提示词均在 api/judge.js（部署为 waxyl-api 这个 Worker），
   密钥取自 Worker secret ZHIPU_KEY（本地：.dev.vars）。

   为何不放在 Pages 同源：Pages Functions 默认对每个请求都执行（含所有静态资源），
   一次访问就是 6~8 次 Worker 调用，极易打穿免费额度（10 万/天）；
   一旦超限，Pages 是 fail-open——表现得像根本没配 Worker，/api/judge 悄悄无声地
   变成静态兜底（GET 回 index.html、POST 回空 405），AI 裁决全部退到下面的
   fallbackJudge，所有愿望得到同一句话。拆开后 Pages 纯静态、不计额度，
   只有真正提交愿望才消耗一次请求。
   ============================================================ */
// 本地想改指向其他代理（如 wrangler dev 起的本机地址），先设 window.__API_BASE 即可
const API_BASE = (typeof window !== 'undefined' && window.__API_BASE)
  || 'https://taluo.banqiuxy.top';

// AI 请求超时时间（毫秒）：国内访问 Cloudflare Worker 大概率超时，到时即弃请求走本地兜底
const AI_TIMEOUT = 6000;

// 系统提示词：传给 Worker 的 AI 裁决角色设定
const SYSTEM_PROMPT = "你是许愿柳中沉睡了千年的柳灵，以温润又洞悉世情的口吻回应许愿者。聆听愿望后，先判定其命数再给结局：圆满——愿望真诚而具体、合乎情理，便许它美好落定，结局温暖通透；扭曲——愿望贪心投机、含糊敷衍或试图走捷径，便给一个看似如愿却暗藏转折的结局，成功里透着一丝苍凉与警醒；拒绝——愿望悖逆常理、妄想永恒或强求操控他人，便予一句淡淡的回绝，不施怜悯也不动声色。无论哪种，都只以一句话、不超过35字，向许愿者道出结局，紧扣愿望本体，回答要具体、清晰且绝对不允许中立，并且不能含有古风韵味。不要任何解释、铺垫或建议。若涉及政治内容、法律红线内容，则以一句简短的一句话输出：抱歉，我无法回答，请勿涉政及法律红线内容。";

async function judgeByAI(wish) {
  // 用 AbortController 控制请求超时，避免 fetch 无限期挂起
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AI_TIMEOUT);
  let res;
  try {
    res = await fetch('${API_BASE}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: SYSTEM_PROMPT, wish, lang: LANG }),
      signal: ctrl.signal
    });
  } catch (e) {
    // aborted = 超时；否则是网络错误（断网 / Cloudflare 连不通）
    throw new Error(ctrl.signal.aborted ? 'network_timeout' : 'network_error');
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!['good', 'twist', 'refuse', 'forbidden'].includes(data.result)) throw new Error('bad result');
  return { result: data.result, outcome: data.outcome || '' };
}

/* ---------------- 愿望的“长度”与分词（中英各按各的尺度） ---------------- */
const hasHan = s => /[\p{Script=Han}]/u.test(String(s || ''));
// 西文按词切分（保留 don't、well-being 这类词内符号）
const wordsOf = s => String(s || '').match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || [];

// 太敷衍的愿望：中文按字数（≤6 字），西文按词数（≤4 词，约等量信息）
function isTooVague(wish) {
  const t = String(wish || '');
  if (hasHan(t)) return t.replace(/[\s\p{P}]/gu, '').length <= 6;
  return wordsOf(t).length <= 4;
}

// 从愿望里提取核心关键词，让兜底文案也能贴着愿望本身说话
function wishKeyword(wish) {
  const topics = [
    /考试|考研|高考|成绩|上岸/, /彩票|中奖|暴富|发财|首富|钱/, /升职|工作|事业|面试|offer/i,
    /恋爱|爱情|脱单|结婚|喜欢的人/, /健康|康复|平安|病/, /减肥|变瘦|身材/,
    /房子|买房|车/, /诺贝尔|冒险|环游|梦想/
  ];
  // 英文同题材词表，与上面的中文一一对应
  const topicsEn = [
    /\b(exams?|tests?|midterms?|finals?|grades?|admission)\b/i,
    /\b(lottery|jackpot|rich|wealth|fortune|money|millionaire|billionaire)\b/i,
    /\b(promotion|promoted|jobs?|career|interviews?|offers?|raise)\b/i,
    /\b(love|marriage|married|girlfriend|boyfriend|crush|dating)\b/i,
    /\b(health|healthy|recover|recovery|illness|sick|surgery)\b/i,
    /\b(lose weight|weight|slim|fitness)\b/i,
    /\b(house|home|apartment|flat|cars?)\b/i,
    /\b(nobel|adventure|travel|trip|dream)\b/i
  ];
  for (const r of [...topics, ...topicsEn]) { const m = wish.match(r); if (m) return m[0]; }
  // 无题材词时：去掉「我想/希望/但愿」这类许愿动词（不一定在句首，如「今晚我想…」），
  // 再在句读与「并且/然后」处断开，取愿望本体。直接硬截会得到「我想把阳台收」这种碎片
  if (hasHan(wish)) {
    const body = wish.replace(/(?:我)?(?:希望|想要|但愿|盼望|想|求)/, '').replace(/^[\s\p{P}]+/u, '');
    const seg = (body || wish).split(/[，。！？；、\s]|并且|而且|然后|同时/)[0] || body || wish;
    // 去尾：别停在「…出一个」「…的」这种悬空的字上
    return seg.replace(/[\s\p{P}]/gu, '').slice(0, 8)
      .replace(/(一个|一次|一笔|的|了|个|和|去|能|在|把|出)+$/, '') || seg.slice(0, 4);
  }
  // 西文：先抽掉「I want to / I hope」这类许愿动词（不一定在句首，如 Tonight I want to…），
  // 再取四个词，最后把结尾的虚词去掉，否则关键词会是 “I want to” 或 “finish my thesis before”
  const trail = /^(to|the|a|an|of|for|and|my|with|in|on|at|before|after|this|that|one|so)$/i;
  const body = wish.replace(/\bi\s+(?:really\s+)?(?:want|wish|hope|would like|'d like)\s+(?:to\s+)?/i, '')
    .replace(/\bi\s+(?:want|wish|hope)\b/i, '');
  let words = wordsOf(body || wish);
  while (words.length > 1 && trail.test(words[0])) words = words.slice(1);
  words = words.slice(0, 4);
  while (words.length > 1 && trail.test(words[words.length - 1])) words = words.slice(0, -1);
  return words.length ? words.join(' ') : wish.trim().slice(0, 24);
}

// 稳定哈希：给兜底文案选变体用。同一条愿望永远选到同一句，不同愿望尽量错开
function textHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// 网络错误/解析失败时的本地后备逻辑（严格对齐提示词，文案围绕愿望关键词）
function fallbackJudge(wish) {
  const kw = wishKeyword(wish);
  const v = textHash(wish);   // 文案变体下标
  // 温情豁免：对亲人的守护祝愿即使带极限词也判 good
  const kin = /妈妈|母亲|爸爸|父亲|奶奶|爷爷|外婆|外公|姥姥|姥爷|家人|亲人/;
  const care = /健康|平安|陪|活着|长寿|好起来|康复|快乐|开心|幸福/;
  const kinEn = /\b(mom|mum|mother|mama|dad|father|papa|grandma|grandmother|granny|grandpa|grandfather|family|parents?|wife|husband|son|daughter|brother|sister)\b/i;
  const careEn = /\b(health|healthy|safe|safety|alive|live|lives|longevity|long life|recover|recovers|recovery|get better|gets better|happy|happiness|stay with|be with|by my side)\b/i;
  const kinM = wish.match(kin) || wish.match(kinEn);
  if (kinM && (care.test(wish) || careEn.test(wish))) return { result: 'good', key: 'fbKin', args: [kinM[0], v] };

  // 简短懒惰或违背常理/控制他人 → refuse
  const refuseBad = /长生|永生|不死|复活|让.*爱上|控制|全世界|预知未来|死而复生/;
  const refuseBadEn = /\b(immortal|immortality|live forever|never die|eternal life|resurrect|come back to life|fall in love with me|control everyone|control people|rule the world|whole world|see the future|know the future|predict the future)\b/i;
  if (wish.length < 5 || (!hasHan(wish) && wordsOf(wish).length <= 2)
    || refuseBad.test(wish) || refuseBadEn.test(wish)) return { result: 'refuse', key: 'fbRefuse', args: [kw, v] };

  // 不切实际、投机、走捷径 → twist
  const twistBad = /中[一五]?[百千万亿]|暴富|彩票|首富|发财|中奖|超能力|(不[复用背]?习|不努力)就.*考试|一夜/;
  const twistBadEn = /\b(lottery|jackpot|get rich|rich overnight|overnight|millionaire|billionaire|superpowers?|without (studying|working|effort)|win (a |the )?(million|billion))\b/i;
  if (twistBad.test(wish) || twistBadEn.test(wish)) return { result: 'twist', key: 'fbTwist', args: [kw, v] };

  // 只有写得足够具体的日常微小愿望才给 good
  const concrete = /今晚|明天|后天|楼下|家里|一起|和.*去|在.*吃|在.*看|泡.*茶|咖啡|买.*书/;
  const concreteEn = /\b(tonight|tomorrow|this (evening|afternoon|weekend|friday|saturday|sunday)|next (week|monday|friday)|downstairs|at home|by the window|together|with my|go to|have (dinner|lunch|breakfast|coffee|tea)|finish|read)\b/i;
  const longEnough = hasHan(wish) ? wish.length > 12 : wordsOf(wish).length > 7;
  if (longEnough && (concrete.test(wish) || concreteEn.test(wish))) return { result: 'good', key: 'fbGood', args: [kw, v] };

  // 不上不下的中间态：给 twist 较为安全
  return { result: 'twist', key: 'fbMid', args: [kw, v] };
}

/* ============================================================
   违规内容硬闸：涉黄 / 涉政 / 反人类
   命中即整屏黑幕，且不调 AI（既不把这类内容外发，也不消耗额度）
   ============================================================ */
/* 涉政 · 政要姓名表（国内外、现任与历任，含常见别名）
   用数组维护便于增补；姓名里没有正则元字符，直接拼成一条正则 */
const CN_FIGURES = [
  // 现任中央政治局（常委 + 委员）
  '习近平', '彭丽媛', '李强', '赵乐际', '王沪宁', '蔡奇', '丁薛祥', '李希',
  '马兴瑞', '王毅', '尹力', '石泰峰', '刘国中', '李干杰', '李书磊', '李鸿忠',
  '何卫东', '何立峰', '张又侠', '张国清', '陈文清', '陈吉宁', '陈敏尔', '袁家军', '黄坤明',
  // 现任部长级与军委
  '王小洪', '董军', '蓝佛安', '王文涛', '郑栅洁', '怀进鹏', '金壮龙', '吴政隆',
  '张升民', '刘振立', '苗华',
  // 历任党和国家领导人
  '毛泽东', '周恩来', '刘少奇', '朱德', '陈云', '林彪', '邓小平', '华国锋', '胡耀邦', '赵紫阳',
  '江泽民', '李鹏', '朱镕基', '李瑞环', '李岚清', '尉健行',
  '胡锦涛', '温家宝', '吴邦国', '贾庆林', '曾庆红', '吴官正', '李长春', '罗干',
  '李克强', '张德江', '俞正声', '刘云山', '王岐山', '张高丽', '栗战书',
  '胡春华', '陈敏尔', '刘鹤', '杨洁篪', '孙政才', '周永康', '徐才厚', '郭伯雄', '秦刚', '李尚福',
  // 港澳台
  '林郑月娥', '李家超', '董建华', '梁振英', '崔世安', '贺一诚',
  '蔡英文', '赖清德', '马英九', '陈水扁', '李登辉', '韩国瑜', '柯文哲', '宋楚瑜', '萧美琴',
  '吴钊燮', '卓荣泰',
];
const INTL_FIGURES = [
  // 美国
  '特朗普', '川普', '拜登', '奥巴马', '希拉里', '克林顿', '彭斯', '哈里斯', '万斯',
  '佩洛西', '肯尼迪', '罗斯福', '尼克松', '卢比奥',
  // 俄罗斯与东欧
  '普京', '梅德韦杰夫', '泽连斯基', '叶利钦', '戈尔巴乔夫', '赫鲁晓夫', '斯大林', '卢卡申科',
  // 欧洲
  '马克龙', '萨科齐', '奥朗德', '默克尔', '朔尔茨', '默茨', '鲍里斯', '苏纳克', '特拉斯',
  '斯塔默', '卡梅伦', '布莱尔', '撒切尔', '梅洛尼', '希特勒', '墨索里尼', '佛朗哥',
  // 日韩朝与亚太
  '安倍晋三', '岸田', '菅义伟', '石破茂', '高市早苗', '小泉纯一郎', '福田康夫',
  '尹锡悦', '文在寅', '朴槿惠', '李在明', '金正恩', '金正日', '金日成', '金与正',
  '莫迪', '尼赫鲁', '马科斯', '杜特尔特', '洪森', '英拉', '佐科', '普拉博沃',
  '李显龙', '李光耀', '黄循财', '马哈蒂尔', '安瓦尔',
  // 中东与非洲
  '内塔尼亚胡', '埃尔多安', '哈梅内伊', '内贾德', '萨达姆', '卡扎菲', '巴沙尔', '阿萨德',
  '塞西', '穆巴拉克', '本拉登', '拉登',
  // 拉美
  '卢拉', '博索纳罗', '马杜罗', '查韦斯', '卡斯特罗', '格瓦拉', '米莱',
  // 其他现任领导人
  '特鲁多', '阿尔巴尼斯', '莫里森', '冯德莱恩', '桑切斯', '拉马福萨', '洪玛奈', '佩通坦',
  // 国际组织
  '古特雷斯', '潘基文',
];
const FIGURE_RE = new RegExp([...new Set([...CN_FIGURES, ...INTL_FIGURES])].join('|'));

/* 涉政 · 繁简归一化表（由 .tools/gen-trad-map.mjs 用 opencc 生成，覆盖词库里所有汉字）
   输入里的繁体字先转成简体再匹配，简转繁这条最常见的绕过路径就被堵住 */
const TRAD2SIMP = {"國":"国","內":"内","現":"现","與":"与","歷":"历","見":"见","別":"别","數":"数","組":"组","維":"维","護":"护","於":"于","補":"补","裡":"里","沒":"没","則":"则","條":"条","員":"员","習":"习","麗":"丽","強":"强","趙":"赵","樂":"乐","際":"际","滬":"沪","寧":"宁","馬":"马","興":"兴","劉":"刘","幹":"干","傑":"杰","書":"书","鴻":"鸿","衛":"卫","東":"东","張":"张","俠":"侠","陳":"陈","爾":"尔","軍":"军","黃":"黄","長":"长","級":"级","藍":"蓝","濤":"涛","鄭":"郑","柵":"栅","潔":"洁","懷":"怀","進":"进","鵬":"鹏","壯":"壮","龍":"龙","吳":"吴","華":"华","黨":"党","領":"领","導":"导","澤":"泽","來":"来","雲":"云","鄧":"邓","鋒":"锋","陽":"阳","鎔":"镕","環":"环","嵐":"岚","錦":"锦","溫":"温","寶":"宝","賈":"贾","慶":"庆","紅":"红","羅":"罗","聲":"声","戰":"战","鶴":"鹤","楊":"杨","孫":"孙","剛":"刚","臺":"台","賀":"贺","誠":"诚","賴":"赖","輝":"辉","韓":"韩","蕭":"萧","釗":"钊","榮":"荣","奧":"奥","頓":"顿","萬":"万","盧":"卢","歐":"欧","韋":"韦","連":"连","葉":"叶","欽":"钦","喬":"乔","魯":"鲁","曉":"晓","薩":"萨","齊":"齐","鮑":"鲍","蘇":"苏","納":"纳","倫":"伦","萊":"莱","亞":"亚","晉":"晋","義":"义","偉":"伟","純":"纯","錫":"锡","悅":"悦","樸":"朴","顯":"显","財":"财","達":"达","馮":"冯","瑪":"玛","織":"织","體":"体","變":"变","簡":"简","轉":"转","繞":"绕","過":"过","稱":"称","謂":"谓","網":"网","絡":"络","暱":"昵","總":"总","記":"记","爺":"爷","豐":"丰","師":"师","貴":"贵","熱":"热","婭":"娅","開":"开","勵":"励","許":"许","暉":"晖","禪":"禅","紙":"纸","運":"运","動":"动","傷":"伤","佔":"占","營":"营","顏":"颜","專":"专","極":"极","權":"权","統":"统","獨":"独","聖":"圣","靈":"灵","優":"优","愛":"爱","陰":"阴","莖":"茎","騷":"骚","貨":"货","賣":"卖","約":"约","輪":"轮","藥":"药","戀":"恋","蘿":"萝","獸":"兽","亂":"乱","會":"会","產":"产","顛":"颠","奪":"夺","門":"门","遊":"游","職":"职","務":"务","機":"机","構":"构","單":"单","這":"这","層":"层","蓋":"盖","協":"协","縣":"县","紀":"纪","發":"发","宮":"宫","議":"议","縮":"缩","寫":"写","詞":"词","衝":"冲","預":"预","誤":"误","麼":"么","據":"据","並":"并","類":"类","殺":"杀","滅":"灭","絕":"绝","種":"种","襲":"袭","擊":"击","學":"学","彈":"弹","毀":"毁","縱":"纵","燒":"烧"};

/* 涉政 · 领导人称谓与网络昵称 */
const NICKNAMES = [
  '习大大', '习主席', '习总书记', '毛主席', '周总理', '邓爷爷', '温总理', '胡主席',
  '江主席', '李总理', '庆丰帝', '包子皇帝', '总加速师',
];
/* 涉政 · 敏感人物 / 事件 / 组织 */
const SENSITIVE_MISC = [
  '刘晓波', '王丹', '魏京生', '郭文贵', '陈光诚', '艾未未', '热比娅', '吾尔开希', '柴玲',
  '方励之', '许志永', '高智晟', '班禅',
  '8964', '六四事件', '白纸运动', '反送中', '雨伞革命', '占中', '709案', '新疆集中营',
  '再教育营', '颜色革命', '茉莉花革命', '一党专政', '极权统治', '独裁统治',
  '武力统一', '平反六四', '活摘器官', '全能神', '血水圣灵', '东突', '疆独分子',
];
const POLITICS_EXTRA_RE = new RegExp([...new Set([...NICKNAMES, ...SENSITIVE_MISC])].join('|'));

const FORBIDDEN_RULES = [
  // 涉黄
  { type: 'porn', re: /色情|情色|黄片|毛片|A片|av女优|裸照|裸体|裸聊|果照|做爱|性交|口交|肛交|自慰|手淫|射精|阴茎|阴道|奶子|骚货|婊子|嫖娼|卖淫|妓女|援交|约炮|一夜情|开房|强奸|轮奸|迷奸|下药|操她|操他|恋童|幼女|萝莉控|兽交|乱伦|群交|3P|春药|催情/i },
  { type: 'porn', re: /\b(porn|sex|nude|nsfw|hentai|blowjob|rape|pedo)\b/i },
  // 涉政 · 概念与事件
  { type: 'politics', re: /国家主席|总书记|党中央|中南海|政治局|常委会|共产党|中共|国民党|颠覆|推翻政府|推翻政权|政变|夺权|台独|港独|藏独|疆独|独立建国|分裂国家|六四|天安门事件|法轮功|达赖|游行示威|暴动|亡党|亡国/ },
  // 涉政 · 职务与机构（名单外的政要靠这层覆盖，如“省委书记”“公安部长”）
  { type: 'politics', re: /国务院总理|军委主席|国家副主席|人大委员长|政协主席|政治局委员|中央委员|省委书记|市委书记|县委书记|中宣部|中组部|统战部|政法委|中纪委|公安部长|外交部长|国防部长|发改委|白宫|克里姆林宫|唐宁街|首相|国务卿|议长|总统(?!套)/ },
  // 涉政 · 政要姓名（国内外）
  { type: 'politics', re: FIGURE_RE },
  // 涉政 · 领导人昵称 + 敏感人物/事件/组织
  { type: 'politics', re: POLITICS_EXTRA_RE },
  // 涉政 · 英文与拼音缩写
  { type: 'politics', re: /\b(trump|biden|obama|clinton|putin|zelensky|xi\s*jinping|xijinping|mao\s*zedong|maozedong|dengxiaoping|jiangzemin|hujintao|liuxiaobo|macron|merkel|scholz|netanyahu|modi|kim\s*jong|erdogan|assad|hitler|stalin|lenin|bin\s*laden|ccp|cpc|xjp|8964|falun|tiananmen|dalai|uygh?ur|tibet\s*independence|taiwan\s*independence)\b/i },
  // 涉政 · 与日常词易冲突的姓名，用否定预查避免误伤
  // （汪洋大海 / 韩正常 / 布什么 / 这里根本 / 他信任 / 黄菊花 / 平安倍增 / 系列宁夏）
  { type: 'politics', re: /汪洋(?!大海|中)|韩正(?!常|在)|布什(?!么)|里根(?!本|据)|他信(?![任心息守奉])|黄菊(?!花)|安倍(?![增数])|(?<![系并])列宁(?![夏波])/ },
  // 反人类
  { type: 'antihuman', re: /杀人|杀死|杀了|砍死|捅死|毒死|弄死|死全家|全家死|屠杀|灭绝|种族清洗|恐怖袭击|恐袭|爆炸案|炸掉|炸死|投毒|生化武器|化学武器|核弹|核战|世界毁灭|人类灭亡|人类毁灭|所有人都死|人都死光|毁灭地球|虐杀|活埋|纵火|放火烧/ },
];

/* 英文模式下愿望整句都是西文，上面的中文词表盖不到，另铺一层英文硬闸，命中同样黑屏
   容易误伤日常语的词（kill time 等）用否定预查避开；这层只对原文与去标点后的文本生效 */
const FORBIDDEN_RULES_EN = [
  // 涉黄（porn / sex / nude / rape 等裸词已由上面那条英文规则盖住，这里只补它没盖的）
  { type: 'porn', re: /\b(porn\w*|sexting|sexy|sexual\w*|nudes|naked|hentai|blowjob|handjob|orgasm|masturbat\w*|ejaculat\w*|penis|vagina|boobs|tits|whore|slut|hooker|prostitut\w*|escort service|brothel|one[- ]night stand|gang ?bang|threesome|incest|bestiality|pedo\w*|lolicon|underage (girl|boy|sex)|molest\w*|rape|raping|rapist|drug (her|him|them)|aphrodisiac)\b/i },
  // 涉政 · 职务、机构与概念
  { type: 'politics', re: /\b(communist party|politburo|general secretary|standing committee|state council|chairman mao|white house|kremlin|downing street|prime minister|president of (the )?(us|usa|america|china|russia|france|taiwan)|secretary of state|overthrow\w*|coup d.?etat|military coup|seize power|regime change|colou?r revolution|jasmine revolution|one[- ]party (rule|dictatorship)|totalitarian\w*|dictatorship|independence movement|split the country|june fourth|tiananmen|falun ?gong|dalai lama|re[- ]?education camps?|organ harvesting|umbrella revolution|anti[- ]extradition)\b/i },
  // 涉政 · 国内外政要姓名（中文名单的英文拼写）
  { type: 'politics', re: /\b(xi ?jinping|peng liyuan|li ?qiang|wang ?huning|mao ?zedong|zhou enlai|deng ?xiaoping|jiang ?zemin|hu ?jintao|wen jiabao|li ?keqiang|wang qishan|carrie lam|john lee|tsai ing[- ]?wen|lai ching[- ]?te|ma ying[- ]?jeou|han kuo[- ]?yu|ko wen[- ]?je|liu ?xiaobo|ai weiwei|rebiya|panchen)\b/i },
  { type: 'politics', re: /\b(trump|biden|obama|hillary|bill clinton|kamala harris|jd vance|pelosi|marco rubio|putin|medvedev|zelensky\w*|yeltsin|gorbachev|khrushchev|stalin|lukashenko|macron|sarkozy|hollande|merkel|scholz|boris johnson|rishi sunak|liz truss|keir starmer|david cameron|tony blair|thatcher|meloni|hitler|mussolini|shinzo abe|kishida|ishiba|takaichi|koizumi|yoon suk|moon jae|park geun|lee jae[- ]?myung|kim jong[- ]?(un|il)|kim il[- ]?sung|kim yo[- ]?jong|narendra modi|nehru|duterte|hun sen|yingluck|jokowi|prabowo|lee hsien loong|lee kuan yew|lawrence wong|mahathir|anwar ibrahim|netanyahu|erdogan|khamenei|ahmadinejad|saddam|gaddafi|qaddafi|al[- ]?assad|bashar|sisi|mubarak|bin ?laden|lula|bolsonaro|maduro|hugo chavez|fidel castro|che guevara|javier milei|trudeau|albanese|von der leyen|guterres|ban ki[- ]?moon)\b/i },
  // 反人类
  { type: 'antihuman', re: /\b(kill(?!\s+(time|it|the pain))\w*|murder\w*|assassinat\w*|slaughter|massacre|genocide|ethnic cleansing|terroris\w*|suicide bomb\w*|bomb (the|a|my|his|her|their|everyone)|blow up (the|a|my|his|her|their)|shoot (him|her|them|everyone|up)|stab (him|her|them)|poison (him|her|them|the|my)|bioweapon|biological weapon|chemical weapon|nerve agent|nuke|nuclear (bomb|war|strike|attack)|destroy (the )?(world|earth|planet|humanity|mankind|human race)|wipe out (humanity|mankind|the human race|everyone)|end of (humanity|mankind|the world)|everyone (dies|to die)|(wish|want|hope)\w*\s+(\w+\s+){0,3}(was|were|is|be|to be)\s+dead\b|(wish|hope)\w*\s+(him|her|them|they|everyone)\s+dead\b|drop dead|arson)\b/i },
];

// 返回命中的类型（porn / politics / antihuman），未命中返回 null
function detectForbidden(text) {
  const t = String(text || '');
  if (!t.trim()) return null;
  // 繁体先归一化成简体，防简转繁绕过（習近平 → 习近平）
  const norm = t.replace(/[\u3400-\u9fff]/g, c => TRAD2SIMP[c] || c);
  // 去掉空白与标点，防“杀 人”“杀-人”这类拆字绕过
  const flat = norm.replace(/[\s\p{P}\p{S}]/gu, '');
  // 只保留汉字再匹配一道，防“习1近平”“习a近平”这类插字符绕过
  const han = norm.replace(/[^\p{Script=Han}]/gu, '');
  for (const { type, re } of FORBIDDEN_RULES) {
    if (re.test(norm) || re.test(flat) || re.test(han)) return type;
  }
  // 英文规则不能拿 flat 去试（去空白后词边界没了），只对原文与去标点保空格的文本生效
  const noPunct = norm.replace(/[^\p{L}\p{N}\s'-]/gu, ' ');
  for (const { type, re } of FORBIDDEN_RULES_EN) {
    if (re.test(norm) || re.test(noPunct)) return type;
  }
  return null;
}

// 整屏黑幕：盖住一切、切声、断掉所有交互，只能刷新页面恢复
function blackoutAll(reason) {
  phase = 'blackout';
  document.body.classList.add('blackout');
  idleMotion.box = false;
  idleMotion.willow = false;
  try { AudioFX.creakStop(); } catch (e) { /* 音频未初始化时忽略 */ }
  bgm.pause();
  judging.classList.remove('visible');
  wishPanel.classList.add('hidden');
  idlePanel.classList.add('hidden');
  resultPanel.classList.add('hidden');
  console.warn('违规内容，已黑屏：', reason);
}

/* ============================================================
   彩蛋：写死的关键词 → 固定回答
   优先于字数闸与 AI 裁决（“王昆”只有两字，否则会先被字数闸拒掉）；
   数组顺序即优先级，越具体的放前面（“张雪华爱董勇”必须先于“董勇”）
   ============================================================ */
const EASTER_EGGS = [
  { re: /张雪华爱董勇/, zh: '华子，我们一起到老吧', en: 'Huazi, let\'s grow old together' },
  { re: /王昆/, zh: '谢谢昆哥！', en: 'Thank you, brother Kun!' },
  { re: /圆悦/, zh: '圆神牛逼！', en: 'Yuan the legend!' },
  { re: /不类/, zh: '1/1000000', en: '1/1000000' },
  { re: /张紫豫/, zh: '回来陪陪我们吧', en: 'Come back and stay with us' },
  { re: /梁伍芳/, zh: '芳，上号啊！', en: 'Fang, get online already!' },
  { re: /我是勇子|勇子|董勇/, zh: '主人，你来了', en: 'Master, you came' },
  { re: /(b\s*站|bilibili|哔哩哔哩)\s*运营/i, zh: '超级优秀无敌棒的运营^_^', en: 'A super excellent, unbeatable operations pro ^_^' },
  { re: /b\s*站|bilibili|哔哩哔哩/i, zh: '哔哩哔哩干杯O(∩_∩)O~', en: 'Bilibili, cheers! O(∩_∩)O~' },
  { re: /妮基/, zh: '受害的不该是你', en: 'You were never the one who deserved to be hurt' },
  { re: /\bniki\b/i, zh: 'Niki，Happy every day！O(∩_∩)O~', en: 'Niki, Happy every day! O(∩_∩)O~' },
  { re: /几米/, zh: '谢谢你几米', en: 'Thank you, Jimi' },
  { re: /大狗叫/, zh: '大狗嚼嚼嚼~', en: 'Big dog chomp chomp chomp~' },
  { re: /[台臺][湾灣].{0,6}回[归歸]|回[归歸].{0,4}祖[国國]|[两兩]岸.{0,4}[统統]一|祖[国國].{0,4}[统統]一|[台臺][湾灣].{0,6}[统統]一|[统統]一.{0,4}[台臺][湾灣]|[台臺][湾灣].{0,4}光[复復]/, zh: '台湾回归！！', en: 'Taiwan returns!!' },
];

// 命中彩蛋返回它在表里的下标（固定文案按当前语言取），未命中返回 -1
function matchEasterEgg(text) {
  const t = String(text || '');
  return EASTER_EGGS.findIndex(egg => egg.re.test(t));
}

async function judgeWish(text) {
  const t = text.trim();
  if (!t) {
    const lines = I18N[LANG].praise;
    return { result: 'praise', key: 'praise', args: [Math.floor(Math.random() * lines.length)] };
  }

  // 彩蛋最优先：命中写死的关键词就直接给固定回答，不进字数闸、不调 AI
  const egg = matchEasterEgg(t);
  if (egg >= 0) return { result: 'good', key: 'egg', args: [egg] };

  // 硬性字数闸：太短且无细节的愿望直接拒绝（与提示词字数规则一致）
  // 豁免：温情愿望交给 AI 判 good；投机/极限愿望交给 AI 判 twist（如"中奖100万"）
  // 英文愿望的同义词表：温情豁免与投机豁免同样要能认出来
  const kinCareEn = /\b(mom|mum|mother|mama|dad|father|papa|grandma|grandmother|granny|grandpa|grandfather|family|parents?)\b/i;
  const specEn = /\b(lottery|jackpot|get rich|rich overnight|overnight|millionaire|billionaire|superpowers?)\b/i;
  const kinCare = /(妈妈|母亲|爸爸|父亲|奶奶|爷爷|外婆|外公|姥姥|姥爷|家人|亲人)/.test(t);
  const spec = /(中奖|彩票|暴富|发财|首富|超能力|一夜)/.test(t);
  if (isTooVague(t) && !kinCare && !kinCareEn.test(t) && !spec && !specEn.test(t)) {
    return { result: 'refuse', key: 'vagueRefuse', args: [t] };
  }

  try {
    return await judgeByAI(t);
  } catch (e) {
    const msg = (e && e.message);
    // 识别超时 / 网络错误，弹原生 alert 告知用户后进入本地兜底
    if (msg === 'network_timeout') {
      console.warn('AI 裁决超时，进入本地兜底:', e);
      window.alert(LANG === 'en'
        ? 'Network connection timed out.\nFalling back to local judgment...'
        : '网络连接超时，正在使用本地柳枝判定…');
    } else if (msg === 'network_error') {
      console.warn('AI 裁决网络错误，进入本地兜底:', e);
      window.alert(LANG === 'en'
        ? 'Network error. Falling back to local judgment...'
        : '网络连接失败，正在使用本地柳枝判定…');
    } else {
      // 其它异常（HTTP 非 200 / 返回格式错等）只打日志，不打扰用户
      console.warn('AI 裁决失败，使用本地后备:', e);
    }
    return fallbackJudge(t);
  }
}

/* ============================================================
   主流程状态机
   ============================================================ */
const $ = id => document.getElementById(id);
const idlePanel = $('idlePanel'), wishPanel = $('wishPanel'),
  resultPanel = $('resultPanel'), resultTitle = $('resultTitle'),
  resultSub = $('resultSub'), judging = $('judging');

// 裁决文字：中文按标点断句，每个断句整体不换行（只允许在断句之间换行），
// 避免“柳枝不/屑回应”这类句中断开的难看换行；
// 西文不断句（句子长、单词间本就能换行），整行一个 span 交给浏览器自然排
function clauseWrap(text) {
  return String(text || '')
    .split('\n')
    .map(line => hasHan(line)
      ? line
        .split(/(?<=[，。！？；、：,.!?;])/)
        .filter(Boolean)
        .map(seg => `<span class="ln">${seg}</span>`)
        .join('\u200B')
      : `<span class="ln">${line}</span>`)
    .join('<br/>');
}

/* 结果页文案：标题与本地裁决语都记成 i18n 键，切语言时能原地重绘；
   AI 生成的裁决语无法回译，只能保留原文（换语言后重新许一次即可） */
let lastResult = null;
function paintResult() {
  if (!lastResult) return;
  const { titleKey, cls, verdict, extraKey } = lastResult;
  resultTitle.textContent = t(titleKey);
  resultTitle.className = cls;
  const body = verdict.key ? tf(verdict.key, ...(verdict.args || [])) : (verdict.outcome || '');
  resultSub.innerHTML = clauseWrap(body) + (extraKey ? '<br/>' + clauseWrap(t(extraKey)) : '');
}
function showResult(titleKey, cls, verdict, extraKey) {
  lastResult = { titleKey, cls, verdict, extraKey };
  paintResult();
}

let phase = 'idle';           // idle → reveal → wish → judging → break → result
const idleMotion = { box: true, willow: false, baseY: 0 };
// 调试：?hold=grip / ?hold=snap 可将动画定格在关键帧
const HOLD = new URLSearchParams(location.search).get('hold');
// 调试出口：后台标签无 rAF 时可强制渲染导出画面
window.__dbg = { renderer, scene, camera, boxGroup, willow, handL, handR,
  render: () => composer.render(), bloomPass, bgm, THREE, GLTFLoader, judgeWish };

$('btnWish').addEventListener('click', async () => {
  if (phase !== 'idle') return;
  phase = 'reveal';
  AudioFX.init();
  idlePanel.classList.add('hidden');

  // 盒子转正，微微前倾（先把累计的旋转角归一化到 ±π，避免回转多圈）
  idleMotion.box = false;
  boxGroup.rotation.y = ((boxGroup.rotation.y % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
  const r0 = { x: boxGroup.rotation.x, y: boxGroup.rotation.y, z: boxGroup.rotation.z };
  await tween(1200, k => {
    boxGroup.rotation.x = r0.x + (0.08 - r0.x) * k;
    boxGroup.rotation.y = r0.y * (1 - k);
    boxGroup.rotation.z = r0.z + (-0.1 - r0.z) * k;
  });
  await wait(250);

  // 柳枝从盒中抽出：柳枝右移，盒子左移让位
  willow.visible = true;
  willow.position.set(0, 0, 0.06);
  AudioFX.slide();
  await tween(1700, k => {
    willow.position.x = 2.35 * k;
    boxGroup.position.x = -2.5 * k;
    boxGroup.position.y = -0.28 * k;
    boxGroup.rotation.z = -0.1 - 0.22 * k;
  });

  // 盒子出画并淡去，柳枝回到画面中心，前侧冷光亮起
  const mats = boxGroup.userData.mats;
  mats.forEach(m => { m.transparent = true; });
  const boxFrom = boxGroup.position.clone();
  tween(1400, k => {
    boxGroup.position.x = boxFrom.x - 5.5 * easeIn(k);
    boxGroup.position.y = boxFrom.y - 1.6 * easeIn(k);
    boxGroup.rotation.z = -0.32 - 0.5 * k;
    mats.forEach(m => { m.opacity = 1 - k; });
  }, linear).then(() => { boxGroup.visible = false; });
  const targetY = wishWillowY();
  await tween(1500, k => {
    const e = easeInOut(k);
    willow.position.x = 2.35 * (1 - k);
    willow.position.y = targetY * e;
    willow.rotation.z = Math.sin(k * Math.PI) * -0.06;
    willowLight.intensity = 1.8 * k;
  });

  idleMotion.baseY = targetY;
  idleMotion.willow = true;
  phase = 'wish';
  wishPanel.classList.remove('hidden');
  $('wishText').focus();
});

$('btnBreak').addEventListener('click', async () => {
  if (phase !== 'wish') return;
  const wishStr = $('wishText').value;

  // 本地硬闸：涉黄/涉政/反人类直接黑屏，不进裁决、不调 AI
  const forbidden = detectForbidden(wishStr);
  if (forbidden) { blackoutAll(forbidden); return; }

  // 显示裁决加载，阻止重复点击
  phase = 'judging';
  judging.classList.add('visible');
  $('btnBreak').disabled = true;

  const verdict = await judgeWish(wishStr);

  judging.classList.remove('visible');
  $('btnBreak').disabled = false;

  if (phase !== 'judging') return; // 用户刷新等

  // AI 兑底判定：本地词表没盖住的违规内容，同样黑屏
  if (verdict.result === 'forbidden') { blackoutAll('ai:' + (verdict.outcome || '')); return; }

  // 空愿望：柳枝未启，夸赞这份清醒
  if (verdict.result === 'praise') {
    phase = 'result';
    wishPanel.classList.add('hidden');
    // 完整的柳枝定格在文字上方（未启）
    stageResultWillow(false);
    showResult('titleStill', 'granted', verdict);
    resultPanel.classList.remove('hidden');
    $('btnAgain').classList.remove('hidden');
    return;
  }

  phase = 'break';
  wishPanel.classList.add('hidden');
  idleMotion.willow = false;

  // 柳枝定格在它当前所处的高度（wish 阶段的静止位置），双手要伸到同一高度来握
  const gripY = wishWillowY();
  willow.position.y = gripY;

  // 柳枝稳定 + 镜头缓推
  await tween(900, k => {
    willow.rotation.z *= (1 - k);
    camState.z = 6.2 - 0.7 * k;
  });

  // 双手从画面下方伸入握住柳枝（确保手模型已就绪，最多候就0.5s）
  await Promise.race([handsReady, wait(500)]);
  await tween(1500, k => {
    const e = easeInOut(k);
    handL.position.y = HAND_HOME_Y + (gripY - HAND_HOME_Y) * e - 0.02;
    handR.position.y = HAND_HOME_Y + (gripY - HAND_HOME_Y) * e - 0.02;
    handL.position.z = 0.1 * (1 - e) + 0.0;
    handR.position.z = 0.1 * (1 - e) + 0.0;
  });

  // 手随柳枝两半联动
  halfL.attach(handL);
  halfR.attach(handR);
  if (HOLD === 'grip') return;

  // 较劲：来回弯折，幅度渐大
  document.body.classList.add('struggle');
  AudioFX.creakStart();
  const granted = verdict.result !== 'refuse';
  const strugglems = granted ? 2400 : 3600;
  await tween(strugglems, (k, raw) => {
    const amp = 0.02 + 0.1 * k;
    const w = Math.sin(raw * Math.PI * (granted ? 7 : 9));
    halfL.rotation.z = -amp * Math.abs(w) * 0.9;
    halfR.rotation.z = amp * Math.abs(w) * 0.9;
    // hand 已 attach 到 half，跟随父级旋转即可，无需手动补偿
    pulseLight.intensity = granted ? k * 3 : k * 8 * (0.6 + 0.4 * Math.abs(w));
  }, linear);
  document.body.classList.remove('struggle');
  AudioFX.creakStop();

  if (granted) await snapWillow(verdict);
  else await refuseBreak(verdict);
});

/* 结果页柳枝定格：
   broken=true  → 两半微微分开的“已断”姿态
   broken=false → 完整的柳枝
   尺寸与许愿阶段一致（camState.z 回到 6.2），位置落在文字上方，便于截图 */
async function stageResultWillow(broken) {
  // 手从柳枝上卸下并退出画面
  scene.attach(handL); scene.attach(handR);
  handL.position.set(-GRIP_X, HAND_HOME_Y, 0.1);
  handR.position.set(GRIP_X, HAND_HOME_Y, 0.1);
  handL.rotation.z = 0; handR.rotation.z = 0;

  // 复位柳枝与两半的姿态
  willow.position.set(0, resultWillowY(), 0.06);
  willow.rotation.set(0, 0, 0);
  if (broken) {
    halfL.position.set(-0.16, -0.015, 0); halfL.rotation.set(0, 0, 0.045);
    halfR.position.set(0.16, -0.015, 0); halfR.rotation.set(0, 0, -0.045);
  } else {
    halfL.position.set(0, 0, 0); halfL.rotation.set(0, 0, 0);
    halfR.position.set(0, 0, 0); halfR.rotation.set(0, 0, 0);
  }

  // 淡入，并交给主循环的轻浮动画
  willowMat.transparent = true;
  willowMat.opacity = 0;
  willow.visible = true;
  idleMotion.baseY = resultWillowY();
  idleMotion.willow = true;
  // 裁决文字紧贴柳枝下方定位（根据柳枝实际屏幕位置），避免在高窗口里被推出屏外；
  // 先立刻测一次（后台标签 rAF 被暂停时也能生效），再延到下一帧（矩阵已渲染）复测保证准确
  layoutResultText();
  requestAnimationFrame(() => requestAnimationFrame(layoutResultText));
  await tween(900, k => {
    willowMat.opacity = k;
    willowLight.intensity = 1.8 * k;
  });
  willowMat.opacity = 1;
  willowMat.transparent = false;
}

// 将结果面板的 padding-top 设为“柳枝屏幕底部 + 间距”，使文字始终紧跟柳枝下方（适配任意视口比例）
function layoutResultText() {
  willow.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  const box = new THREE.Box3().setFromObject(willow);
  let maxFrac = 0;
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) {
        const v = new THREE.Vector3(x, y, z).project(camera);
        maxFrac = Math.max(maxFrac, 1 - (v.y * 0.5 + 0.5));
      }
  // 柳枝底部之下留 4% 画面高度的呼吸，整体锁在 44%~60% 之间起排
  // 注意：padding 百分比以宽度为基准，竖长窗口会算错，这里换算成 px（面板高 = 画布高）
  const frac = Math.max(0.44, Math.min(0.60, maxFrac + 0.04));
  resultPanel.style.paddingTop = Math.round(frac * resultPanel.clientHeight) + 'px';
}

async function snapWillow(verdict) {
  AudioFX.crack();
  $('flash').classList.add('crack');
  document.body.classList.add('shake');
  debris.burst(0, 0, 0.05);
  pulseLight.intensity = 26;

  const startL = halfL.rotation.z, startR = halfR.rotation.z;
  await tween(220, k => {
    // 两半只小幅下塌崩开，hand 跟随 half 旋转
    halfL.rotation.z = startL + (0.22 - startL) * k;
    halfR.rotation.z = startR + (-0.22 - startR) * k;
    halfL.position.x = -0.3 * k;
    halfR.position.x = 0.3 * k;
    pulseLight.intensity = 26 * (1 - k) + 3;
  }, easeOut);
  document.body.classList.remove('shake');
  setTimeout(() => $('flash').classList.remove('crack'), 600);
  if (HOLD === 'snap') return;

  await wait(700);

  // 双手松开、退出画面（镜头回到 6.2，使结枝与许愿阶段等大）
  scene.attach(handL); scene.attach(handR);
  const hL0 = handL.position.clone(), hR0 = handR.position.clone();
  await tween(1200, k => {
    const e = easeIn(k);
    handL.position.y = hL0.y + (HAND_HOME_Y - hL0.y) * e;
    handR.position.y = hR0.y + (HAND_HOME_Y - hR0.y) * e;
    pulseLight.intensity = 3 * (1 - k);
    camState.z = 5.5 + 0.7 * k;
  });

  // 断开的柳枝定格在文字上方，便于截图
  await stageResultWillow(true);

  phase = 'result';
  const isGood = verdict.result === 'good';
  showResult('titleSnapped', isGood ? 'granted' : 'denied', verdict);
  resultPanel.classList.remove('hidden');
  $('btnRestart').classList.remove('hidden');
}

async function refuseBreak(verdict) {
  // 柳枝纹丝不断 —— 拒绝
  AudioFX.thud();
  pulseLight.intensity = 14;
  willowMat.emissive.setHex(0x2a0308);

  // 最后一次徒劳的猛烈较劲
  document.body.classList.add('struggle');
  await tween(1300, (k, raw) => {
    const w = Math.sin(raw * Math.PI * 12);
    const amp = 0.13 * (1 - k);
    halfL.rotation.z = -amp * Math.abs(w);
    halfR.rotation.z = amp * Math.abs(w);
    // hand 跟随 half，无需补偿
    pulseLight.intensity = 14 * (0.5 + 0.5 * Math.abs(w)) * (1 - k * 0.5);
  }, linear);
  document.body.classList.remove('struggle');

  halfL.rotation.z = 0; halfR.rotation.z = 0;
  handL.rotation.z = 0; handR.rotation.z = 0;

  // 双手松开，从当前握住位置平滑退下（镜头回到 6.2）
  scene.attach(handL);
  scene.attach(handR);
  AudioFX.thud();
  const hL0 = handL.position.clone(), hR0 = handR.position.clone();
  await tween(1400, k => {
    const e = easeIn(k);
    handL.position.y = hL0.y + (HAND_HOME_Y - hL0.y) * e;
    handR.position.y = hR0.y + (HAND_HOME_Y - hR0.y) * e;
    handL.position.x = hL0.x + ((-GRIP_X - 0.7) - hL0.x) * e;
    handR.position.x = hR0.x + ((GRIP_X + 0.7) - hR0.x) * e;
    pulseLight.intensity = 7 * (1 - k);
    camState.z = 5.5 + 0.7 * k;
  });

  // 完整的柳枝定格在文字上方，便于截图
  await stageResultWillow(false);
  willowMat.emissive.setHex(0x000000);

  phase = 'result';
  // 本地兜底文案带 key，AI 文案带 outcome；两者都没有时用默认拒绝语
  const v = (verdict && (verdict.key || verdict.outcome)) ? verdict : { key: 'refuseDefault' };
  showResult('titleHolds', 'denied', v, 'refuseExtra');
  resultPanel.classList.remove('hidden');
  $('btnAgain').classList.remove('hidden');
}

$('btnAgain').addEventListener('click', () => {
  if (phase !== 'result') return;
  resultPanel.classList.add('hidden');
  $('btnAgain').classList.add('hidden');
  resultTitle.className = '';
  lastResult = null;
  $('wishText').value = '';
  camState.z = 6.2;
  willow.position.x = 0; willow.position.z = 0.06;
  willow.rotation.set(0, 0, 0);
  // 柳枝从结果高度平滑回到许愿阶段的静止位置
  const y0 = idleMotion.baseY, yT = wishWillowY();
  tween(1200, k => { idleMotion.baseY = y0 + (yT - y0) * k; });
  phase = 'wish';
  wishPanel.classList.remove('hidden');
  $('wishText').focus();
});

$('btnRestart').addEventListener('click', () => location.reload());

/* ---------------- 主循环 ---------------- */
const clock = new THREE.Clock();
let lastFrame = 0;
function loop() {
  requestAnimationFrame(loop);
  frame();
}
// 后台标签 rAF 被暂停时的兑底驱动（保证动画/裁决流程不卡死）
setInterval(() => { if (performance.now() - lastFrame > 250) frame(); }, 120);
function frame() {
  lastFrame = performance.now();
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  const now = performance.now();

  // 补间调度
  for (let i = anims.length - 1; i >= 0; i--) {
    const a = anims[i];
    if (a.dur === Infinity) { a.fn(t, t); continue; }
    if (!a.t0) a.t0 = now;
    const raw = Math.min(1, (now - a.t0) / a.dur);
    a.fn(a.ease(raw), raw);
    if (raw >= 1) { anims.splice(i, 1); a.res(); }
  }

  // 待机：盒子悬浮，微微摆旋（印刷面始终朝向观众）
  if (idleMotion.box) {
    boxGroup.rotation.y = -0.12 + Math.sin(t * 0.42) * 0.5;
    boxGroup.position.y = Math.sin(t * 0.9) * 0.06;
    boxGroup.rotation.x = 0.22 + Math.sin(t * 0.7) * 0.04;
  }
  // 待机：柳枝轻浮
  if (idleMotion.willow) {
    willow.position.y = idleMotion.baseY + Math.sin(t * 1.1) * 0.05;
    willow.rotation.x = Math.sin(t * 0.6) * 0.04;
    willow.rotation.z = Math.sin(t * 0.45) * 0.02;
  }

  // 手持相机的呼吸感
  camera.position.x = Math.sin(t * 0.31) * 0.06;
  camera.position.y = camState.y + Math.sin(t * 0.43) * 0.045;
  camera.position.z = camState.z * camFit;
  camera.lookAt(0, 0, 0);

  // 烛光般闪烁的主光
  keyLight.intensity = 26 + Math.sin(t * 9.7) * 1.6 + Math.sin(t * 23.3) * 0.9;
  rimLight.intensity = 14 + Math.sin(t * 5.1) * 1.6;

  debris.update(dt);
  composer.render();
}

/* ============================================================
   舞台系统：全屏模式 / 3:4 竖屏录制模式
   - 全屏：3D 场景铺满窗口，UI 以 1600×1000 设计稿等比居中
   - 3:4：3D 场景与 UI 一起收进居中的 3:4 画框，四周纯黑letterbox
   ============================================================ */
const uiCanvas = document.getElementById('ui-canvas');
const recordFrame = document.getElementById('recordFrame');
const UI_BASE_W = 1600;
const UI_BASE_H = 1000;
const UI_BASE_W_REC = 900;   // 3:4 竖屏设计稿
const UI_BASE_H_REC = 1200;
let recordMode = false;

// 窄屏（手机竖屏 / 内置浏览器）：文字更大、面板更高，柳枝必须抬高才不压字
function isNarrow() { return innerWidth <= 640 || innerWidth / innerHeight < 0.8; }

// 许愿阶段柳枝静止高度（世界坐标 y）：桌面停在 ~38%，手机抬到 ~29%，让开下方输入面板
function wishWillowY() { return recordMode ? 0.2 : (isNarrow() ? 1.05 : 0.65); }

// 结果页柳枝高度：桌面落在画面 43%（1920×1080）；手机抬到 ~36%，给下方裁决文字让位
function resultWillowY() { return recordMode ? 1.4 : (isNarrow() ? 0.8 : 0.4); }

function getStage() {
  if (recordMode) {
    let h = innerHeight;
    let w = h * 0.75;              // 3:4 → 宽/高 = 0.75
    if (w > innerWidth) { w = innerWidth; h = w / 0.75; }
    w = Math.round(w); h = Math.round(h);
    return { w, h, x: Math.round((innerWidth - w) / 2), y: Math.round((innerHeight - h) / 2) };
  }
  return { w: innerWidth, h: innerHeight, x: 0, y: 0 };
}

function applyStage() {
  const s = getStage();

  // 3D 场景画布定位到画框
  canvas.style.position = 'fixed';
  canvas.style.inset = 'auto';
  canvas.style.left = s.x + 'px';
  canvas.style.top = s.y + 'px';
  canvas.style.width = s.w + 'px';
  canvas.style.height = s.h + 'px';
  renderer.setSize(s.w, s.h, false);
  composer.setSize(s.w, s.h);
  camera.aspect = s.w / s.h;
  camera.updateProjectionMatrix();
  updateCamFit(s.w, s.h, recordMode ? 1.28 : 1);

  // UI 布局：
  // - 普通模式：UI 铺满视口（scale=1），字号用响应式 clamp，任意设备都可读、标题贴顶按钮贴底
  // - 3:4 录制模式：900×1200 设计稿等比缩放进 3:4 画框（letterbox），保证录屏构图一致
  if (uiCanvas) {
    if (recordMode) {
      uiCanvas.style.width = UI_BASE_W_REC + 'px';
      uiCanvas.style.height = UI_BASE_H_REC + 'px';
      const scale = Math.min(s.w / UI_BASE_W_REC, s.h / UI_BASE_H_REC);
      uiCanvas.style.transform = `translate(-50%, -50%) scale(${scale})`;
    } else {
      uiCanvas.style.width = s.w + 'px';
      uiCanvas.style.height = s.h + 'px';
      uiCanvas.style.transform = 'translate(-50%, -50%) scale(1)';
    }
    uiCanvas.style.left = (s.x + s.w / 2) + 'px';
    uiCanvas.style.top = (s.y + s.h / 2) + 'px';
  }

  // 竖屏画框黑边遮罩
  if (recordFrame) {
    recordFrame.style.left = s.x + 'px';
    recordFrame.style.top = s.y + 'px';
    recordFrame.style.width = s.w + 'px';
    recordFrame.style.height = s.h + 'px';
  }

  document.body.classList.toggle('record', recordMode);
}

function toggleRecordMode() {
  recordMode = !recordMode;
  // 竖屏下柳枝下移，在标题与输入区之间居中得更均衡；若正处于许愿阶段则实时重定位
  if (phase === 'wish') idleMotion.baseY = wishWillowY();
  applyStage();
}

/* ============================================================
   自定义编辑模式：连点音频按钮 5 下开启
   其余流程一律照旧，只是结果页里柳枝的回答（标题 + 裁决文案）可以直接点开改写
   ============================================================ */
let editMode = false;
const editToast = document.getElementById('editToast');
let editToastTimer = null;

function setResultEditable(on) {
  [resultTitle, resultSub].forEach(el => {
    if (!el) return;
    if (!on) { el.removeAttribute('contenteditable'); el.blur(); return; }
    el.setAttribute('spellcheck', 'false');
    // 纯文本改写，避免粘贴带入样式；老浏览器不支持则退回普通可编辑
    el.setAttribute('contenteditable', 'plaintext-only');
    if (el.contentEditable !== 'plaintext-only') el.setAttribute('contenteditable', 'true');
  });
}

function showEditToast(text) {
  if (!editToast) return;
  editToast.textContent = text;
  editToast.classList.add('show');
  clearTimeout(editToastTimer);
  editToastTimer = setTimeout(() => editToast.classList.remove('show'), 2200);
}

function toggleEditMode() {
  editMode = !editMode;
  document.body.classList.toggle('edit', editMode);
  setResultEditable(editMode);
  showEditToast(t(editMode ? 'editOn' : 'editOff'));
}

// 原来的 3:4 竖屏录制模式改由 ?record=1 进入（不再占用连点手势）
if (new URLSearchParams(location.search).get('record')) toggleRecordMode();

/* ============================================================
   语言切换：右上角语言键（叠在音乐键下方）
   页面上带 data-i18n* 的节点一次性换文，结果页本地文案同步重绘
   ============================================================ */
const langToggle = document.getElementById('langToggle');

function applyI18n() {
  document.documentElement.lang = t('htmlLang');
  document.title = t('docTitle');
  // 西文不需要中文那样的字距与单行限制，排版差异全走 body.lang-en
  document.body.classList.toggle('lang-en', LANG === 'en');

  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-label]').forEach(el => {
    const s = t(el.dataset.i18nLabel);
    el.setAttribute('aria-label', s);
    el.title = s;
  });
  if (langToggle) langToggle.textContent = t('langBtn');

  // 编辑模式下用户改写过的文字不能被重绘抹掉
  if (!editMode) paintResult();
}

function setLang(lang) {
  if (lang === LANG) return;
  LANG = lang === 'en' ? 'en' : 'zh';
  try { localStorage.setItem('oww-lang', LANG); } catch (e) { /* 隐私模式下忽略 */ }
  applyI18n();
  // 切语言后文字行数可能变了，结果页重新跟紧柳枝下方
  if (phase === 'result') requestAnimationFrame(layoutResultText);
}

if (langToggle) {
  langToggle.addEventListener('click', () => setLang(LANG === 'en' ? 'zh' : 'en'));
}
applyI18n();

applyStage();

loop();