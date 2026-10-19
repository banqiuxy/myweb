import { canvas, renderer, composer, camera, updateCamFit } from './scene.js';
import { phase, idleMotion, recordMode, setRecordMode } from './state.js';

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

// 窄屏（手机竖屏 / 内置浏览器）：文字更大、面板更高，柳枝必须抬高才不压字
function isNarrow() { return innerWidth <= 640 || innerWidth / innerHeight < 0.8; }

// 许愿阶段柳枝静止高度（世界坐标 y）：桌面停在 ~38%，手机抬到 ~29%，让开下方输入面板
export function wishWillowY() { return recordMode ? 0.2 : (isNarrow() ? 1.05 : 0.65); }

// 结果页柳枝高度：桌面落在画面 43%（1920×1080）；手机抬到 ~36%，给下方裁决文字让位
export function resultWillowY() { return recordMode ? 1.4 : (isNarrow() ? 0.8 : 0.4); }

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

export function applyStage() {
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

export function toggleRecordMode() {
  setRecordMode(!recordMode);
  // 竖屏下柳枝下移，在标题与输入区之间居中得更均衡；若正处于许愿阶段则实时重定位
  if (phase === 'wish') idleMotion.baseY = wishWillowY();
  applyStage();
}

/* 宽窄屏切换：尺寸统一由 applyStage 负责；
   许愿阶段柳枝的目标高度依赖视口比例，需要实时跟上 */
addEventListener('resize', () => {
  applyStage();
  if (phase === 'wish') idleMotion.baseY = wishWillowY();
});
