/* ============================================================
   许愿柳 · 跨模块共享状态
   phase / 舞台模式 / 编辑模式会被多个模块读写，
   统一放在这里，外部只能通过 setter 修改，避免各处各存一份
   ============================================================ */
export let phase = 'idle';           // idle → reveal → wish → judging → break → result
export let recordMode = false;       // 3:4 竖屏录制模式
export let editMode = false;         // 自定义编辑模式

export const idleMotion = { box: true, willow: false, baseY: 0 };

// 调试：?hold=grip / ?hold=snap 可将动画定格在关键帧
export const HOLD = new URLSearchParams(location.search).get('hold');

export function setPhase(v) { phase = v; }
export function setRecordMode(v) { recordMode = v; }
export function setEditMode(v) { editMode = v; }
