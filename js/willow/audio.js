/* ============================================================
   音效 —— WebAudio 合成
   ============================================================ */
export const AudioFX = (() => {
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
export const bgm = new Audio(window.__MP3_SRC || 'assets/audio/forever.mp3');
bgm.loop = true;
bgm.volume = 0.35;
bgm.preload = 'none'; // 不预加载，防止首屏阻塞
let bgmEnabled = true;
export function getBgmEnabled() { return bgmEnabled; }
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
export function setBgm(on) {
  bgmEnabled = on;
  updateMusicIcon();
  if (bgmEnabled) {
    tryPlay();
  } else {
    bgm.pause();
    bgmStarted = false;
  }
}
updateMusicIcon();
