import * as THREE from 'three';
import { t, tf } from './i18n.js';
import { hasHan, tween } from './utils.js';
import { scene, camera } from './scene.js';
import { willow, halfL, halfR, willowMat, willowLight } from './willow.js';
import { handL, handR, HAND_HOME_Y, GRIP_X } from './hands.js';
import { idleMotion } from './state.js';
import { resultWillowY } from './stage.js';

const $ = id => document.getElementById(id);
export const resultPanel = $('resultPanel');
export const resultTitle = $('resultTitle');
export const resultSub = $('resultSub');

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
export function paintResult() {
  if (!lastResult) return;
  const { titleKey, cls, verdict, extraKey } = lastResult;
  resultTitle.textContent = t(titleKey);
  resultTitle.className = cls;
  const body = verdict.key ? tf(verdict.key, ...(verdict.args || [])) : (verdict.outcome || '');
  resultSub.innerHTML = clauseWrap(body) + (extraKey ? '<br/>' + clauseWrap(t(extraKey)) : '');
}
export function showResult(titleKey, cls, verdict, extraKey) {
  lastResult = { titleKey, cls, verdict, extraKey };
  paintResult();
}

/* 结果页柳枝定格：
   broken=true  → 两半微微分开的“已断”姿态
   broken=false → 完整的柳枝
   尺寸与许愿阶段一致（camState.z 回到 6.2），位置落在文字上方，便于截图 */
export async function stageResultWillow(broken) {
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
export function layoutResultText() {
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

export function setResultEditable(on) {
  [resultTitle, resultSub].forEach(el => {
    if (!el) return;
    if (!on) { el.removeAttribute('contenteditable'); el.blur(); return; }
    el.setAttribute('spellcheck', 'false');
    // 纯文本改写，避免粘贴带入样式；老浏览器不支持则退回普通可编辑
    el.setAttribute('contenteditable', 'plaintext-only');
    if (el.contentEditable !== 'plaintext-only') el.setAttribute('contenteditable', 'true');
  });
}


// 再许一次时清空结果缓存，避免下一次结果页重绘出上一轮的文案
export function resetResult() {
  lastResult = null;
  resultTitle.className = '';
}
