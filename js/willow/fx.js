import * as THREE from 'three';
import { scene } from './scene.js';
import { rng } from './utils.js';

/* ============================================================
   断裂碎屑粒子
   ============================================================ */
export const debris = (() => {
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
