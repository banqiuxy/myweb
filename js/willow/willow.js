import * as THREE from 'three';
import { scene } from './scene.js';
import { rng, n3 } from './utils.js';

/* ============================================================
   柳枝 —— 多股绞合的黑色瘤节枝条，天生分成左右两半
   ============================================================ */
export const willowMat = new THREE.MeshPhysicalMaterial({
  color: 0x1e1b20, roughness: 0.62, metalness: 0.05,
  clearcoat: 0.18, clearcoatRoughness: 0.55,
  emissive: 0x000000
});

// 专门照亮柳枝的前侧冷光（出盒后才亮起）
export const willowLight = new THREE.PointLight(0xd8e0ea, 0, 8, 1.5);
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

export const willow = new THREE.Group();
export const halfL = makeWillowHalf(-1);
export const halfR = makeWillowHalf(1);
willow.add(halfL, halfR);
willow.visible = false;
scene.add(willow);
