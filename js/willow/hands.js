import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { scene } from './scene.js';

/* ============================================================
   双手 —— 哆啦A梦式圆球手（“DORAEMON” by sugamo, Poly Pizza, CC-BY）
   https://poly.pizza/m/bjWib-18r-C
   白圆球手取自模型双手网格 + 同款蓝色圆筒臂，从画面下方伸入
   ============================================================ */
export const handL = new THREE.Group();
export const handR = new THREE.Group();
export const HAND_HOME_Y = -4.6;
export const GRIP_X = 0.62;
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

export const handsReady = (async () => {
  const loader = new GLTFLoader();
  // 单文件版把模型以 base64 内嵌成 window.__GLB_B64：直接 parse，不经过任何 URL。
  // 早前用 blob: URL 会在 Safari / file:// / 沙箱 iframe / 严格 CSP 下被拦，手就消失了
  const gltf = window.__GLB_B64
    ? await loader.parseAsync(b64ToBuffer(window.__GLB_B64), '')
    : await loader.loadAsync('assets/models/doraemon.glb');
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
