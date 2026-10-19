/* ============================================================
   许愿柳 · 入口 / 主流程
   3D 场景、柳枝与包装盒、双手、音频、AI 裁决、词库、结果页
   已拆分到同目录模块；这里只保留状态机、动画编排与 UI 绑定
   ============================================================ */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { scene, renderer, camera, camState, camFit, composer, bloomPass,
  keyLight, rimLight, pulseLight } from './scene.js';
import { willow, halfL, halfR, willowMat, willowLight } from './willow.js';
import { boxGroup } from './box.js';
import { handL, handR, HAND_HOME_Y, GRIP_X, handsReady } from './hands.js';
import { debris } from './fx.js';
import { AudioFX, bgm, setBgm, getBgmEnabled } from './audio.js';
import { judgeWish } from './ai.js';
import { detectForbidden } from './moderation.js';
import { phase, setPhase, idleMotion, HOLD, editMode, setEditMode } from './state.js';
import { applyStage, toggleRecordMode, wishWillowY } from './stage.js';
import { resultPanel, showResult, paintResult, layoutResultText,
  stageResultWillow, setResultEditable, resetResult } from './result.js';
import { tween, wait, linear, easeIn, easeOut, easeInOut, anims } from './utils.js';
import { t, getLang, setLangValue } from './i18n.js';

const $ = id => document.getElementById(id);
const idlePanel = $('idlePanel'), wishPanel = $('wishPanel'), judging = $('judging');

// 整屏黑幕：盖住一切、切声、断掉所有交互，只能刷新页面恢复
function blackoutAll(reason) {
  setPhase('blackout');
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

// 调试出口：后台标签无 rAF 时可强制渲染导出画面
window.__dbg = { renderer, scene, camera, boxGroup, willow, handL, handR,
  render: () => composer.render(), bloomPass, bgm, THREE, GLTFLoader, judgeWish };

$('btnWish').addEventListener('click', async () => {
  if (phase !== 'idle') return;
  setPhase('reveal');
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
  setPhase('wish');
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
  setPhase('judging');
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
    setPhase('result');
    wishPanel.classList.add('hidden');
    // 完整的柳枝定格在文字上方（未启）
    stageResultWillow(false);
    showResult('titleStill', 'granted', verdict);
    resultPanel.classList.remove('hidden');
    $('btnAgain').classList.remove('hidden');
    return;
  }

  setPhase('break');
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

  setPhase('result');
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

  setPhase('result');
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
  resetResult();
  $('wishText').value = '';
  camState.z = 6.2;
  willow.position.x = 0; willow.position.z = 0.06;
  willow.rotation.set(0, 0, 0);
  // 柳枝从结果高度平滑回到许愿阶段的静止位置
  const y0 = idleMotion.baseY, yT = wishWillowY();
  tween(1200, k => { idleMotion.baseY = y0 + (yT - y0) * k; });
  setPhase('wish');
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

const musicToggle = document.getElementById('musicToggle');

// 连点 5 下音乐键：开启 / 关闭自定义编辑模式（循环末恢复音乐状态）
let mClicks = 0, mTimer = null, mBgmBefore = true;
if (musicToggle) {
  musicToggle.addEventListener('click', () => {
    if (mClicks === 0) mBgmBefore = getBgmEnabled();
    mClicks++;
    clearTimeout(mTimer);
    mTimer = setTimeout(() => { mClicks = 0; }, 1500);
    if (mClicks >= 5) {
      mClicks = 0;
      setBgm(mBgmBefore);      // 复原音乐开关，避免连点遗留关闭状态
      toggleEditMode();        // 进入 / 退出自定义编辑模式
      return;
    }
    setBgm(!getBgmEnabled());
  });
}


const editToast = document.getElementById('editToast');
let editToastTimer = null;

function showEditToast(text) {
  if (!editToast) return;
  editToast.textContent = text;
  editToast.classList.add('show');
  clearTimeout(editToastTimer);
  editToastTimer = setTimeout(() => editToast.classList.remove('show'), 2200);
}

function toggleEditMode() {
  setEditMode(!editMode);
  document.body.classList.toggle('edit', editMode);
  setResultEditable(editMode);
  showEditToast(t(editMode ? 'editOn' : 'editOff'));
}

// 原来的 3:4 竖屏录制模式改由 ?record=1 进入（不再占用连点手势）
if (new URLSearchParams(location.search).get('record')) toggleRecordMode();

const langToggle = document.getElementById('langToggle');

function applyI18n() {
  document.documentElement.lang = t('htmlLang');
  document.title = t('docTitle');
  // 西文不需要中文那样的字距与单行限制，排版差异全走 body.lang-en
  document.body.classList.toggle('lang-en', getLang() === 'en');

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
  if (lang === getLang()) return;
  setLangValue(lang);
  try { localStorage.setItem('oww-lang', getLang()); } catch (e) { /* 隐私模式下忽略 */ }
  applyI18n();
  // 切语言后文字行数可能变了，结果页重新跟紧柳枝下方
  if (phase === 'result') requestAnimationFrame(layoutResultText);
}

if (langToggle) {
  langToggle.addEventListener('click', () => setLang(getLang() === 'en' ? 'zh' : 'en'));
}
applyI18n();

applyStage();

loop();