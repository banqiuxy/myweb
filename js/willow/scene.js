import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { rng, anims, linear } from './utils.js';

/* ---------------- 渲染器 / 场景 ---------------- */
export const canvas = document.getElementById('scene');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030202);
scene.fog = new THREE.Fog(0x030202, 7, 14);

export const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 50);
camera.position.set(0, 0.1, 6.2);
export const camState = { z: 6.2, y: 0.1 };
// 窄屏时拉远相机，保证盒子/柳枝完整入画（手机竖屏需更大 camFit）
export let camFit = 1;
export function updateCamFit(w = innerWidth, h = innerHeight, pad = 1) {
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
export const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(devicePixelRatio, 2));
composer.setSize(innerWidth, innerHeight);
composer.addPass(new RenderPass(scene, camera));
export const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  0.28,   // strength：强度克制，只要一点氛围
  0.85,   // radius：晕散范围大而柔
  0.15    // threshold：整体画面很暗，阈值需低于亮部才能出晕散，黑位仍不受影响
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

/* ---------------- 灯光 ---------------- */
scene.add(new THREE.AmbientLight(0x22181a, 0.9));

export const keyLight = new THREE.SpotLight(0xffe8c8, 26, 20, 0.55, 0.6, 1.6);
keyLight.position.set(1.6, 4.5, 3.5);
keyLight.target.position.set(0, 0, 0);
scene.add(keyLight, keyLight.target);

export const rimLight = new THREE.PointLight(0x8e1626, 14, 12, 1.6);
rimLight.position.set(-2.4, 0.6, -2.2);
scene.add(rimLight);

export const fillLight = new THREE.PointLight(0x37424f, 5, 10, 1.8);
fillLight.position.set(2.6, -1.2, 2.4);
scene.add(fillLight);

// 掰断/拒绝时的中心红光
export const pulseLight = new THREE.PointLight(0xb0202f, 0, 6, 2);
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
