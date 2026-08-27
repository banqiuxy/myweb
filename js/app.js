'use strict';

// ============ 本地存储 ============
const STORE_KEY = 'mbti_v1_state';
const RESULT_KEY = 'mbti_v1_result';

const Store = {
  load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); }
    catch (e) { return {}; }
  },
  save(state) { localStorage.setItem(STORE_KEY, JSON.stringify(state)); },
  clear() { localStorage.removeItem(STORE_KEY); localStorage.removeItem(RESULT_KEY); },
  saveResult(r) { localStorage.setItem(RESULT_KEY, JSON.stringify(r)); },
  loadResult() {
    try { return JSON.parse(localStorage.getItem(RESULT_KEY) || 'null'); }
    catch (e) { return null; }
  }
};

// ============ 路由 ============
const pages = ['home', 'quiz', 'loading', 'result', 'gallery'];
function showPage(name) {
  pages.forEach(p => {
    const el = document.getElementById('page-' + p);
    if (el) el.classList.toggle('active', p === name);
  });
  window.scrollTo(0, 0);
  if (name === 'gallery') renderGallery();
}

// ============ 答题页 ============
const OPTIONS = [
  { v: 1, label: '非常不同意' },
  { v: 2, label: '不同意' },
  { v: 3, label: '中立' },
  { v: 4, label: '同意' },
  { v: 5, label: '非常同意' }
];

let state = Store.load();
if (!Array.isArray(state.answers) || state.answers.length !== QUESTIONS.length) {
  state = { index: 0, answers: new Array(QUESTIONS.length).fill(0) };
}

function saveState() { Store.save(state); }

function renderQuiz() {
  // 边界保护
  if (state.index < 0) state.index = 0;
  if (state.index >= QUESTIONS.length) state.index = QUESTIONS.length - 1;

  const q = QUESTIONS[state.index];
  const total = QUESTIONS.length;
  const cur = state.index + 1;
  const pct = Math.round((cur / total) * 100);

  document.getElementById('qIndex').textContent = `第 ${cur} / ${total} 题`;
  document.getElementById('qText').textContent = q.t;
  const bar = document.getElementById('progBar');
  bar.style.width = pct + '%';
  document.getElementById('progNum').textContent = pct + '%';

  const optsEl = document.getElementById('options');
  optsEl.innerHTML = '';
  OPTIONS.forEach((opt, i) => {
    const sel = state.answers[state.index] === opt.v;
    const btn = document.createElement('button');
    btn.className = 'opt' + (sel ? ' selected' : '');
    btn.type = 'button';
    btn.innerHTML = `<span class="marker">${String.fromCharCode(65 + i)}</span><span class="olabel">${opt.label}</span>`;
    btn.onclick = () => selectOption(opt.v);
    optsEl.appendChild(btn);
  });

  // 上一题/下一题按钮
  const prevBtn = document.getElementById('btnPrev');
  prevBtn.disabled = state.index === 0;
  const nextBtn = document.getElementById('btnNext');
  const answered = state.answers[state.index] > 0;
  if (state.index === total - 1) {
    nextBtn.textContent = '查看结果';
  } else {
    nextBtn.textContent = '下一题';
  }
  nextBtn.disabled = !answered;
}

function selectOption(v) {
  state.answers[state.index] = v;
  saveState();
  renderQuiz();
}

function nextQuestion() {
  if (!state.answers[state.index]) return;
  if (state.index < QUESTIONS.length - 1) {
    state.index++;
    saveState();
    renderQuiz();
  } else {
    // 最后一题 → 计算结果
    enterLoading();
  }
}

function prevQuestion() {
  if (state.index > 0) {
    state.index--;
    saveState();
    renderQuiz();
  }
}

// ============ 计分算法（标准官方同源） ============
// 每维度15题；同意(>3)偏向 pole 字母，不同意(<3)偏向另一极。
// 五级量表：5→pole+2, 4→pole+1, 3→0, 2→另一极+1, 1→另一极+2。
// 得分相等默认取稳定维度(I/S/T/J)。
function computeResult() {
  const dimScores = { ei: { E: 0, I: 0 }, sn: { S: 0, N: 0 }, tf: { T: 0, F: 0 }, jp: { J: 0, P: 0 } };

  QUESTIONS.forEach((q, i) => {
    const v = state.answers[i] || 0;
    const dimMeta = DIMENSIONS.find(d => d.key === q.dim);
    const pole = q.pole;
    const other = dimMeta.letters.find(l => l !== pole);
    if (v === 5) dimScores[q.dim][pole] += 2;
    else if (v === 4) dimScores[q.dim][pole] += 1;
    else if (v === 2) dimScores[q.dim][other] += 1;
    else if (v === 1) dimScores[q.dim][other] += 2;
  });

  // 决定每个维度最终字母 + 百分比
  const result = { dims: {}, code: '' };
  DIMENSIONS.forEach(d => {
    const s = dimScores[d.key];
    const a = s[d.letters[0]];
    const b = s[d.letters[1]];
    const total = a + b;
    let letter, pctA, pctB;
    if (total === 0) {
      // 全中立 → 默认稳定维度
      letter = d.stable;
      pctA = 50; pctB = 50;
    } else {
      pctA = Math.round((a / total) * 100);
      pctB = 100 - pctA;
      if (a > b) letter = d.letters[0];
      else if (b > a) letter = d.letters[1];
      else letter = d.stable; // 相等默认稳定维度
    }
    result.dims[d.key] = {
      letter, a: d.letters[0], b: d.letters[1],
      nameA: d.names[0], nameB: d.names[1],
      scoreA: a, scoreB: b, pctA, pctB
    };
    result.code += letter;
  });

  result.profile = PROFILES[result.code];
  result.timestamp = Date.now();
  return result;
}

function enterLoading() {
  showPage('loading');
  // 模拟计算延时 300-800ms
  const delay = 300 + Math.floor(Math.random() * 500);
  setTimeout(() => {
    const result = computeResult();
    Store.saveResult(result);
    renderResult(result);
    showPage('result');
  }, delay);
}

// ============ 结果页 ============
function renderResult(r) {
  const p = r.profile;
  // 人格代码与名称
  document.getElementById('resCode').textContent = r.code;
  document.getElementById('resName').textContent = p.name;

  // 维度条
  const barsEl = document.getElementById('dimBars');
  barsEl.innerHTML = '';
  ['ei', 'sn', 'tf', 'jp'].forEach(key => {
    const d = r.dims[key];
    const row = document.createElement('div');
    row.className = 'dim-row';
    const aWin = d.letter === d.a, bWin = d.letter === d.b;
    row.innerHTML = `
      <div class="dim-labels">
        <span class="left ${aWin ? 'win' : ''}"><b>${d.a}</b> ${d.nameA} <span class="pct">${d.pctA}%</span></span>
        <span class="right ${bWin ? 'win' : ''}"><span class="pct">${d.pctB}%</span> ${d.nameB} <b>${d.b}</b></span>
      </div>
      <div class="dim-bar"><i class="mid"></i><i class="fill" style="width:${d.pctA}%"></i></div>
    `;
    barsEl.appendChild(row);
  });

  // 雷达图
  drawRadar(r);

  // 文案
  document.getElementById('resSummary').textContent = p.summary;
  document.getElementById('resStrengths').innerHTML = p.strengths.map(s => `<li>${s}</li>`).join('');
  document.getElementById('resWeakness').innerHTML = p.weaknesses.map(s => `<li>${s}</li>`).join('');
  document.getElementById('resScenes').innerHTML = `
    <div class="sk">学习</div><div class="sv">${p.scenes.study}</div>
    <div class="sk">工作</div><div class="sv">${p.scenes.work}</div>
    <div class="sk">社交</div><div class="sv">${p.scenes.social}</div>
  `;
  document.getElementById('resTags').innerHTML = p.tags.map(t => `<span class="tag">${t}</span>`).join('');
}

// 雷达图：4个维度，每个维度显示当前极的倾向强度(0-100)
function drawRadar(r) {
  const wrap = document.getElementById('radarWrap');
  wrap.innerHTML = '';
  const size = 280, cx = size / 2, cy = size / 2, R = 100;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('aria-hidden', 'true');

  // 4个轴：上(E)、右(S)、下(T)、左(J)，对应ei/sn/tf/jp的主导极方向
  // 为直观，我们用4个维度名作为轴标签，数值为该维度主导极的百分比
  const axes = [
    { key: 'ei', label: 'E/I', pct: r.dims.ei.letter === 'E' ? r.dims.ei.pctA : r.dims.ei.pctB, pole: r.dims.ei.letter },
    { key: 'sn', label: 'S/N', pct: r.dims.sn.letter === 'S' ? r.dims.sn.pctA : r.dims.sn.pctB, pole: r.dims.sn.letter },
    { key: 'tf', label: 'T/F', pct: r.dims.tf.letter === 'T' ? r.dims.tf.pctA : r.dims.tf.pctB, pole: r.dims.tf.letter },
    { key: 'jp', label: 'J/P', pct: r.dims.jp.letter === 'J' ? r.dims.jp.pctA : r.dims.jp.pctB, pole: r.dims.jp.letter }
  ];
  const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI]; // 上右下左

  // 背景网格
  [0.25, 0.5, 0.75, 1].forEach(scale => {
    const pts = angles.map(a => {
      const x = cx + Math.cos(a) * R * scale;
      const y = cy + Math.sin(a) * R * scale;
      return `${x},${y}`;
    }).join(' ');
    const poly = document.createElementNS(ns, 'polygon');
    poly.setAttribute('points', pts);
    poly.setAttribute('fill', 'none');
    poly.setAttribute('stroke', 'rgba(255,255,255,0.08)');
    poly.setAttribute('stroke-width', '1');
    svg.appendChild(poly);
  });

  // 轴线
  angles.forEach(a => {
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', cx); line.setAttribute('y1', cy);
    line.setAttribute('x2', cx + Math.cos(a) * R);
    line.setAttribute('y2', cy + Math.sin(a) * R);
    line.setAttribute('stroke', 'rgba(255,255,255,0.08)');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
  });

  // 数据多边形
  const dataPts = axes.map((ax, i) => {
    const a = angles[i];
    const val = Math.max(0, Math.min(1, ax.pct / 100));
    const x = cx + Math.cos(a) * R * val;
    const y = cy + Math.sin(a) * R * val;
    return `${x},${y}`;
  }).join(' ');
  const dataPoly = document.createElementNS(ns, 'polygon');
  dataPoly.setAttribute('points', dataPts);
  dataPoly.setAttribute('fill', 'rgba(108,123,255,0.25)');
  dataPoly.setAttribute('stroke', '#6c7bff');
  dataPoly.setAttribute('stroke-width', '2');
  svg.appendChild(dataPoly);

  // 数据点
  axes.forEach((ax, i) => {
    const a = angles[i];
    const val = Math.max(0, Math.min(1, ax.pct / 100));
    const x = cx + Math.cos(a) * R * val;
    const y = cy + Math.sin(a) * R * val;
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', '4');
    c.setAttribute('fill', '#f06292');
    svg.appendChild(c);
  });

  // 轴标签
  axes.forEach((ax, i) => {
    const a = angles[i];
    const lx = cx + Math.cos(a) * (R + 20);
    const ly = cy + Math.sin(a) * (R + 20);
    const txt = document.createElementNS(ns, 'text');
    txt.setAttribute('x', lx); txt.setAttribute('y', ly);
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('dominant-baseline', 'middle');
    txt.setAttribute('fill', '#b8bed8');
    txt.setAttribute('font-size', '13');
    txt.setAttribute('font-weight', '700');
    txt.textContent = ax.label;
    svg.appendChild(txt);

    const txt2 = document.createElementNS(ns, 'text');
    txt2.setAttribute('x', lx); txt2.setAttribute('y', ly + 14);
    txt2.setAttribute('text-anchor', 'middle');
    txt2.setAttribute('fill', '#7c84a8');
    txt2.setAttribute('font-size', '11');
    txt2.textContent = ax.pole + ' ' + ax.pct + '%';
    svg.appendChild(txt2);
  });

  wrap.appendChild(svg);
}

// 复制结果文案
function copyResult() {
  const r = Store.loadResult();
  if (!r) return;
  const p = r.profile;
  const dims = ['ei', 'sn', 'tf', 'jp'].map(k => {
    const d = r.dims[k];
    return `${d.a}${d.pctA}% / ${d.b}${d.pctB}%`;
  }).join('  ');
  const text =
`【MBTI 人格测试结果】
人格类型：${r.code} ${p.name}

${p.summary}

维度倾向：
${dims}

性格优势：
- ${p.strengths.join('\n- ')}

性格短板：
- ${p.weaknesses.join('\n- ')}

适合方向：
· 学习：${p.scenes.study}
· 工作：${p.scenes.work}
· 社交：${p.scenes.social}

标签：${p.tags.join('、')}

（纯前端本地计算 · 隐私安全）`;

  const done = () => showToast('结果已复制到剪贴板');
  const fail = () => showToast('复制失败，请手动选择');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done, fail));
  } else {
    fallbackCopy(text, done, fail);
  }
}
function fallbackCopy(text, ok, fail) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.top = '-9999px';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta); ok();
  } catch (e) { fail(); }
}

// 保存图片（截图结果区域为SVG/png不易，用简易方案：导出文本结果为canvas下载）
function saveImage() {
  const r = Store.loadResult();
  if (!r) return;
  const p = r.profile;
  const canvas = document.createElement('canvas');
  const W = 750, H = 1100;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  // 背景
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#1a1f3a'); grad.addColorStop(1, '#0f1222');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#7c84a8'; ctx.font = '600 22px sans-serif';
  ctx.fillText('MBTI 人格测试结果', W / 2, 70);

  // code
  ctx.fillStyle = '#6c7bff'; ctx.font = '800 96px sans-serif';
  ctx.fillText(r.code, W / 2, 180);
  ctx.fillStyle = '#e8ecf5'; ctx.font = '700 36px sans-serif';
  ctx.fillText(p.name, W / 2, 230);

  // 维度
  ctx.font = '600 22px sans-serif';
  let y = 300;
  ['ei', 'sn', 'tf', 'jp'].forEach(k => {
    const d = r.dims[k];
    ctx.fillStyle = '#b8bed8';
    ctx.fillText(`${d.nameA} ${d.a}  ${d.pctA}% : ${d.pctB}%  ${d.b} ${d.nameB}`, W / 2, y);
    y += 36;
  });

  // 简介
  ctx.textAlign = 'left';
  ctx.fillStyle = '#9aa3c8'; ctx.font = '500 20px sans-serif';
  wrapText(ctx, p.summary, 50, y + 30, W - 100, 30);

  // 优势
  let yy = y + 180;
  ctx.fillStyle = '#6c7bff'; ctx.font = '700 22px sans-serif';
  ctx.fillText('性格优势', 50, yy);
  ctx.fillStyle = '#cdd3e8'; ctx.font = '500 19px sans-serif';
  p.strengths.forEach((s, i) => { yy += 30; ctx.fillText('• ' + s, 60, yy); });

  yy += 40;
  ctx.fillStyle = '#f06292'; ctx.font = '700 22px sans-serif';
  ctx.fillText('性格短板', 50, yy);
  ctx.fillStyle = '#cdd3e8'; ctx.font = '500 19px sans-serif';
  p.weaknesses.forEach((s) => { yy += 30; ctx.fillText('• ' + s, 60, yy); });

  yy += 40;
  ctx.fillStyle = '#4ade80'; ctx.font = '700 22px sans-serif';
  ctx.fillText('适合方向', 50, yy);
  ctx.fillStyle = '#cdd3e8'; ctx.font = '500 19px sans-serif';
  yy += 30; ctx.fillText('学习：' + p.scenes.study, 60, yy);
  yy += 30; ctx.fillText('工作：' + p.scenes.work, 60, yy);
  yy += 30; ctx.fillText('社交：' + p.scenes.social, 60, yy);

  // 标签
  yy += 50;
  ctx.fillStyle = '#7c84a8'; ctx.font = '500 18px sans-serif';
  ctx.fillText('标签：' + p.tags.join('、'), 50, yy);

  // 底部
  ctx.textAlign = 'center';
  ctx.fillStyle = '#5a627e'; ctx.font = '400 16px sans-serif';
  ctx.fillText('纯前端本地计算 · 隐私安全', W / 2, H - 40);

  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url; a.download = `MBTI_${r.code}.png`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  showToast('图片已开始下载');
}
function wrapText(ctx, text, x, y, maxW, lh) {
  const chars = text.split('');
  let line = '';
  let yy = y;
  for (let i = 0; i < chars.length; i++) {
    const test = line + chars[i];
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = chars[i]; yy += lh;
    } else { line = test; }
  }
  if (line) ctx.fillText(line, x, yy);
}

// 重新测试
function restart() {
  if (!confirm('确定要重新开始测试吗？当前进度与结果将被清除。')) return;
  Store.clear();
  state = { index: 0, answers: new Array(QUESTIONS.length).fill(0) };
  showPage('home');
}

// ============ 图鉴页 ============
function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  grid.innerHTML = '';
  Object.keys(PROFILES).forEach(code => {
    const p = PROFILES[code];
    const btn = document.createElement('button');
    btn.className = 'gcell'; btn.type = 'button';
    btn.innerHTML = `<div class="gc">${code}</div><div class="gn">${p.name}</div><div class="gd">${p.summary.slice(0, 28)}…</div>`;
    btn.onclick = () => openProfile(code);
    grid.appendChild(btn);
  });
}
function openProfile(code) {
  const p = PROFILES[code];
  const box = document.getElementById('overlayBox');
  box.innerHTML = `
    <div class="card" style="text-align:center;">
      <div style="font-size:40px;font-weight:800;letter-spacing:4px;background:linear-gradient(135deg,#6c7bff,#f06292);-webkit-background-clip:text;background-clip:text;color:transparent;">${code}</div>
      <div style="font-size:20px;font-weight:700;margin-top:4px;">${p.name}</div>
    </div>
    <div class="card"><h3>核心概述</h3><p>${p.summary}</p></div>
    <div class="card"><h3>性格优势</h3><ul>${p.strengths.map(s => `<li>${s}</li>`).join('')}</ul></div>
    <div class="card"><h3>性格短板</h3><ul>${p.weaknesses.map(s => `<li>${s}</li>`).join('')}</ul></div>
    <div class="card"><h3>适合方向</h3><div class="scene-grid">
      <div class="sk">学习</div><div class="sv">${p.scenes.study}</div>
      <div class="sk">工作</div><div class="sv">${p.scenes.work}</div>
      <div class="sk">社交</div><div class="sv">${p.scenes.social}</div>
    </div></div>
    <div class="card"><h3>标签</h3><div class="tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div></div>
    <div class="result-actions"><button class="btn ghost block sm" id="closeOverlay">关闭</button></div>
  `;
  document.getElementById('overlay').classList.add('show');
  document.getElementById('closeOverlay').onclick = closeProfile;
}
function closeProfile() { document.getElementById('overlay').classList.remove('show'); }

// ============ toast ============
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ============ 启动 ============
function startTest() {
  state = { index: 0, answers: new Array(QUESTIONS.length).fill(0) };
  saveState();
  renderQuiz();
  showPage('quiz');
}

function resumeTest() {
  renderQuiz();
  showPage('quiz');
}

function viewLastResult() {
  const r = Store.loadResult();
  if (r) { renderResult(r); showPage('result'); }
  else { showToast('暂无历史结果'); }
}

document.addEventListener('DOMContentLoaded', () => {
  // 绑定首页按钮
  document.getElementById('btnStart').onclick = startTest;
  document.getElementById('btnResume').onclick = resumeTest;
  document.getElementById('btnViewResult').onclick = viewLastResult;
  // 顶栏
  document.getElementById('navHome').onclick = () => showPage('home');
  document.getElementById('navGallery').onclick = () => showPage('gallery');
  // 答题页
  document.getElementById('btnPrev').onclick = prevQuestion;
  document.getElementById('btnNext').onclick = nextQuestion;
  // 结果页
  document.getElementById('btnRestart').onclick = restart;
  document.getElementById('btnCopy').onclick = copyResult;
  document.getElementById('btnSaveImg').onclick = saveImage;
  // overlay
  document.getElementById('overlay').onclick = (e) => {
    if (e.target.id === 'overlay') closeProfile();
  };

  // 恢复状态：如果有未完成答题，显示"继续"；如果有结果，显示"查看结果"
  const hasProgress = state.answers.some(a => a > 0) && state.answers.filter(a => a > 0).length < QUESTIONS.length;
  const hasResult = !!Store.loadResult();
  document.getElementById('btnResume').style.display = hasProgress ? '' : 'none';
  document.getElementById('btnViewResult').style.display = hasResult ? '' : 'none';

  showPage('home');
});
