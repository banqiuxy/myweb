/* ============================================================
 *  MBTI 16型人格测试 - 应用逻辑
 *  纯前端本地计算，数据仅存于 localStorage，不上传任何服务器。
 * ============================================================ */
(function () {
  'use strict';

  // ---------- 四维度配置 ----------
  // 左极/右极 字母及中文名，默认值(打平时)
  const DIMS = [
    { key: 'ei', left: 'E', leftName: '外向', right: 'I', rightName: '内向', def: 'I' },
    { key: 'sn', left: 'S', leftName: '实感', right: 'N', rightName: '直觉', def: 'S' },
    { key: 'tf', left: 'T', leftName: '理性', right: 'F', rightName: '感性', def: 'T' },
    { key: 'jp', left: 'J', leftName: '计划', right: 'P', rightName: '随性', def: 'J' }
  ];
  const LETTERS = ['A', 'B', 'C', 'D', 'E'];
  const STORAGE_PROGRESS = 'mbti_progress';
  const STORAGE_RESULT = 'mbti_result';

  // ---------- 状态 ----------
  let answers = [];             // 每题答案: 值 v in {0:很不同意,-2, 1:不同意,-1, 2:中立,0, 3:同意,+1, 4:非常同意,+2}
  let current = 0;              // 当前题号 0-based
  let lastResult = null;        // 最近一次结果

  // ---------- DOM ----------
  const $ = function (id) { return document.getElementById(id); };
  const screens = {
    home: $('screen-home'), quiz: $('screen-quiz'), loading: $('screen-loading'),
    result: $('screen-result'), gallery: $('screen-gallery')
  };

  function showScreen(name) {
    Object.keys(screens).forEach(function (k) { screens[k].classList.remove('active'); });
    screens[name].classList.add('active');
    if (name === 'gallery') renderGallery();
    if (name === 'home') refreshHomeButtons();
  }

  // ---------- 轻提示 ----------
  let toastTimer = null;
  function showToast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2000);
  }

  function copyText(text, msg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { showToast(msg); })
        .catch(function () { fallbackCopy(text, msg); });
    } else { fallbackCopy(text, msg); }
  }
  function fallbackCopy(text, msg) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); showToast(msg); }
    catch (e) { alert('复制失败，请手动复制。'); }
    document.body.removeChild(ta);
  }

  // ---------- 首页 ----------
  function refreshHomeButtons() {
    const progress = loadProgress();
    $('resumeBtn').classList.toggle('hidden', !(progress && progress.answers && progress.answers.length > 0));
    const result = loadResult();
    $('lastResultBtn').classList.toggle('hidden', !result);
  }

  // ---------- localStorage ----------
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(STORAGE_PROGRESS)); } catch (e) { return null; }
  }
  function saveProgress() {
    localStorage.setItem(STORAGE_PROGRESS, JSON.stringify({ answers: answers, current: current }));
  }
  function loadResult() {
    try { return JSON.parse(localStorage.getItem(STORAGE_RESULT)); } catch (e) { return null; }
  }
  function saveResult(r) { localStorage.setItem(STORAGE_RESULT, JSON.stringify(r)); }

  // ---------- 答题页 ----------
  function startTest() {
    answers = new Array(window.QUESTIONS.length).fill(-1);
    current = 0;
    saveProgress();
    renderQuestion();
    showScreen('quiz');
  }

  function resumeTest() {
    const p = loadProgress();
    if (p && p.answers) { answers = p.answers; current = p.current || 0; }
    else { answers = new Array(window.QUESTIONS.length).fill(-1); current = 0; }
    renderQuestion();
    showScreen('quiz');
  }

  function renderQuestion() {
    const q = window.QUESTIONS[current];
    $('questionNum').textContent = '第 ' + (current + 1) + ' / ' + window.QUESTIONS.length + ' 题';
    $('questionText').textContent = q.text;
    const pct = Math.round((current) / window.QUESTIONS.length * 100);
    $('progressPct').textContent = pct + '%';
    $('progressFill').style.width = pct + '%';

    const optionTexts = ['非常不同意', '不同意', '中立', '同意', '非常同意'];
    const area = $('optionsArea');
    area.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const b = document.createElement('button');
      b.className = 'option' + (answers[current] === i ? ' selected' : '');
      b.type = 'button';
      b.innerHTML = '<span class="letter">' + LETTERS[i] + '</span>' + optionTexts[i];
      (function (idx) {
        b.addEventListener('click', function () {
          answers[current] = idx;
          saveProgress();
          renderQuestion();
        });
      })(i);
      area.appendChild(b);
    }

    $('prevBtn').disabled = (current === 0);
    const last = (current === window.QUESTIONS.length - 1);
    $('nextBtn').textContent = last ? '查看结果' : '下一题';
    $('nextBtn').disabled = (answers[current] === -1);
  }

  function nextQuestion() {
    if (answers[current] === -1) { showToast('请先选择本题答案'); return; }
    if (current === window.QUESTIONS.length - 1) {
      saveProgress();
      finishQuiz();
    } else {
      current++;
      saveProgress();
      renderQuestion();
    }
  }
  function prevQuestion() {
    if (current > 0) { current--; saveProgress(); renderQuestion(); }
  }

  // ---------- 计分 ----------
  function finishQuiz() {
    showScreen('loading');
    setTimeout(function () {
      const scoreMap = {};
      DIMS.forEach(function (d) { scoreMap[d.key] = 0; });

      window.QUESTIONS.forEach(function (q, i) {
        const v = answers[i];          // 0,1,2,3,4 -> 值转换
        let val = 0;
        if (v === 0) val = -2;         // 非常不同意
        else if (v === 1) val = -1;    // 不同意
        else if (v === 2) val = 0;     // 中立
        else if (v === 3) val = 1;     // 同意
        else if (v === 4) val = 2;     // 非常同意

        const d = getDim(q.dim);
        if (q.pole === d.left) scoreMap[q.dim] += val;
        else scoreMap[q.dim] -= val;
      });

      // 计算四维代码
      let code = '';
      DIMS.forEach(function (d) {
        const s = scoreMap[d.key];
        code += (s === 0) ? d.def : (s > 0 ? d.left : d.right);
      });

      const data = window.PERSONALITIES[code];
      lastResult = { code: code, type: data.type, scoreMap: scoreMap, time: Date.now() };
      saveResult(lastResult);
      renderResult();
      showScreen('result');
    }, 1400); // 模拟加载
  }

  function getDim(key) {
    for (let i = 0; i < DIMS.length; i++) if (DIMS[i].key === key) return DIMS[i];
    return null;
  }

  // ---------- 结果渲染 ----------
  function renderResult() {
    if (!lastResult) { lastResult = loadResult(); }
    if (!lastResult) return;
    const r = lastResult;
    const data = window.PERSONALITIES[r.code];
    const sm = r.scoreMap;

    let html = '';
    // 代码 + 名称
    html += '<div class="card" style="margin-bottom:16px;">';
    html += '<div class="result-code"><span class="code grad-text">' + r.code + '</span></div>';
    html += '<div class="result-type">' + data.type + '型</div>';
    html += '</div>';

    // 四维条
    html += '<div class="card dims-card">';
    html += '<div class="dims-title">四维倾向</div>';
    DIMS.forEach(function (d) {
      const s = sm[d.key];
      const winnerLetter = (s === 0) ? d.def : (s > 0 ? d.left : d.right);
      const winnerName = (winnerLetter === d.left) ? d.leftName : d.rightName;
      // 强度 = |s|/30 (每维度15题，最大极值30)
      const strength = Math.min(1, Math.abs(s) / 30);
      // marker位置：0%时为左极，100%时为右极，用 winnerLetter 判定偏向一侧，
      // 但为展示"中间分隔线+胜出高亮"，用强度与方向定位。
      const leftStrength = (winnerLetter === d.left) ? strength : (1 - strength);
      const markerPct = leftStrength * 100;

      html += '<div class="dim">';
      html += '<div class="dim-head"><span>' + d.leftName + ' <span class="winner">' + winnerLetter + '</span></span><span><span class="winner">' + winnerName + '</span> ' + winnerLetter + '</span></div>';
      html += '<div class="dim-bar"><div class="marker" style="left:' + markerPct + '%;"></div></div>';
      const leftStrong = d.left === winnerLetter;
      const rightStrong = d.right === winnerLetter;
      html += '<div class="dim-labels"><span class="' + (leftStrong ? 'strong' : '') + '">' + d.left + ' ' + Math.round(leftStrength * 100) + '%</span><span class="' + (rightStrong ? 'strong' : '') + '">' + Math.round((1 - leftStrength) * 100) + '% ' + d.right + '</span></div>';
      html += '</div>';
    });
    html += '</div>';

    // 雷达图
    html += '<div class="card dims-card"><div class="dims-title">综合雷达</div>';
    html += '<div class="radar-wrap"><canvas id="radarCanvas" width="280" height="280"></canvas></div></div>';

    // 信息卡
    html += '<div class="card dims-card"><div class="dims-title">人格解析</div>';
    html += '<div class="info-card"><h3>核心概述</h3><p>' + data.overview + '</p></div>';
    html += '<div class="info-card"><h3>性格优势</h3><ul>' + data.strengths.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul></div>';
    html += '<div class="info-card"><h3>性格短板</h3><ul>' + data.weaknesses.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul></div>';
    html += '<div class="info-card"><h3>适合方向</h3><p><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#ffd966" stroke-width="2" style="vertical-align:-2px;margin-right:4px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>学习：' + data.directions.study + '</p><p><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#ffd966" stroke-width="2" style="vertical-align:-2px;margin-right:4px;"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>工作：' + data.directions.work + '</p><p><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#ffd966" stroke-width="2" style="vertical-align:-2px;margin-right:4px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>社交：' + data.directions.social + '</p></div>';
    html += '<div class="info-card"><h3>人格标签</h3><div class="tags">' + data.tags.map(function (t) { return '<span class="tag">' + t + '</span>'; }).join('') + '</div></div>';
    html += '</div>';

    // 操作按钮
    html += '<div class="result-actions">';
    html += '<button class="btn-grad" onclick="window.__mbtiRetest()">重新测试</button>';
    html += '<button class="btn-ghost" onclick="window.__mbtiCopy()">复制结果</button>';
    html += '<button class="btn-ghost" onclick="window.__mbtiSaveImage()">保存图片</button>';
    html += '</div>';

    $('screen-result').innerHTML = html;

    // 绘制雷达图
    drawRadar(r.code, sm);
  }

  // ---------- 雷达图 ----------
  function drawRadar(code, sm) {
    const cv = $('radarCanvas');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const cx = 140, cy = 140, R = 100;
    ctx.clearRect(0, 0, 280, 280);

    // 强度映射：每维度 strength = |s|/30，方向决定左右极
    const dims = DIMS.map(function (d) {
      const s = sm[d.key];
      // 0~1：0=弱(偏向右极)，0.5=中间，1=强(偏向左极)
      let v = 0.5;
      if (s > 0) v = 0.5 + (Math.min(1, s / 30) * 0.5);
      else if (s < 0) v = 0.5 - (Math.min(1, -s / 30) * 0.5);
      return v;
    });

    // 网格
    const layers = 4;
    for (let l = 1; l <= layers; l++) {
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI / 2 * i) - Math.PI / 2;
        const rr = R * l / layers;
        const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // 轴线
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2 * i) - Math.PI / 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.stroke();
    }
    // 数据多边形
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2 * i) - Math.PI / 2;
      const rr = R * dims[i];
      const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 280, 280);
    g.addColorStop(0, 'rgba(123,92,255,0.7)');
    g.addColorStop(1, 'rgba(255,107,203,0.7)');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = '#ff6bcb'; ctx.lineWidth = 2; ctx.stroke();

    // 顶点标签
    const labels = ['E外向/I内向', 'S实感/N直觉', 'T理性/F感性', 'J计划/P随性'];
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#c9beff';
    ctx.textAlign = 'center';
    labels.forEach(function (lb, i) {
      const a = (Math.PI / 2 * i) - Math.PI / 2;
      const x = cx + (R + 22) * Math.cos(a), y = cy + (R + 22) * Math.sin(a);
      ctx.fillText(lb, x, y);
    });
  }

  // 复制结果
  window.__mbtiCopy = function () {
    if (!lastResult) return;
    const r = lastResult;
    const data = window.PERSONALITIES[r.code];
    const text = '我的MBTI测试结果：' + r.code + '（' + data.type + '）\n\n' +
      '概述：' + data.overview + '\n' +
      '优势：' + data.strengths.join('、') + '\n' +
      '短板：' + data.weaknesses.join('、') + '\n' +
      '适合方向：\n  学习：' + data.directions.study + '\n  工作：' + data.directions.work + '\n  社交：' + data.directions.social + '\n' +
      '标签：' + data.tags.join('、');
    copyText(text, '结果已复制！');
  };

  // 二次确认重新测试
  window.__mbtiRetest = function () {
    $('confirmMask').classList.add('show');
  };
  $('confirmOk').addEventListener('click', function () {
    $('confirmMask').classList.remove('show');
    localStorage.removeItem(STORAGE_PROGRESS);
    localStorage.removeItem(STORAGE_RESULT);
    answers = []; lastResult = null;
    showScreen('home');
  });
  $('confirmCancel').addEventListener('click', function () {
    $('confirmMask').classList.remove('show');
  });

  // 保存图片
  window.__mbtiSaveImage = function () { saveResultImage(); };

  // ---------- 图鉴 ----------
  function renderGallery() {
    const grid = $('galleryGrid');
    grid.innerHTML = '';
    Object.keys(window.PERSONALITIES).forEach(function (code) {
      const p = window.PERSONALITIES[code];
      const card = document.createElement('div');
      card.className = 'gallery-card';
      card.innerHTML = '<div class="code grad-text">' + p.code + '</div><div class="name">' + p.type + '</div><div class="summary">' + p.overview + '</div>';
      card.addEventListener('click', function () { openModal(p); });
      grid.appendChild(card);
    });
  }

  function openModal(p) {
    let h = '<div class="modal-header"><span class="code grad-text">' + p.code + '</span><button class="close" onclick="window.__mbtiCloseModal()">×</button></div>';
    h += '<div class="type-name">' + p.type + '型</div>';
    h += '<p>' + p.overview + '</p>';
    h += '<h4>性格优势</h4><ul>' + p.strengths.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>';
    h += '<h4>性格短板</h4><ul>' + p.weaknesses.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>';
    h += '<h4>适合方向</h4><p>学习：' + p.directions.study + '</p><p>工作：' + p.directions.work + '</p><p>社交：' + p.directions.social + '</p>';
    h += '<h4>人格标签</h4><div class="tags">' + p.tags.map(function (t) { return '<span class="tag">' + t + '</span>'; }).join('') + '</div>';
    $('modalBody').innerHTML = h;
    $('modalMask').classList.add('show');
  }
  window.__mbtiCloseModal = function () { $('modalMask').classList.remove('show'); };
  $('modalMask').addEventListener('click', function (e) {
    if (e.target === this) $('modalMask').classList.remove('show');
  });

  function goHome() { showScreen('home'); }
  window.goHome = goHome;

  // ---------- 绑定事件 ----------
  $('startBtn').addEventListener('click', startTest);
  $('resumeBtn').addEventListener('click', resumeTest);
  $('lastResultBtn').addEventListener('click', function () {
    lastResult = loadResult();
    if (lastResult) { renderResult(); showScreen('result'); }
  });
  var _t = $('nextBtn'); if (_t) _t.addEventListener('click', nextQuestion);
  var _p = $('prevBtn'); if (_p) _p.addEventListener('click', prevQuestion);
  $('guideBtn').addEventListener('click', function () { showScreen('gallery'); });

  // 初始化
  refreshHomeButtons();

  // ---------- 保存结果图片 ----------
  // 把当前结果渲染成一张美观的 PNG 结果图并下载
  function saveResultImage() {
    if (!lastResult) return;
    const r = lastResult;
    const data = window.PERSONALITIES[r.code];
    const sm = r.scoreMap;

    // 创建离屏 canvas
    const cv = document.createElement('canvas');
    cv.width = 900; cv.height = 1200;
    const ctx = cv.getContext('2d');

    // 背景
    ctx.fillStyle = '#0d1226';
    ctx.fillRect(0, 0, 900, 1200);

    // 渐变装饰
    const bg = ctx.createLinearGradient(0, 0, 900, 1200);
    bg.addColorStop(0, 'rgba(123,92,255,0.15)');
    bg.addColorStop(1, 'rgba(255,107,203,0.15)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 900, 1200);

    // 标题
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('MBTI 16型人格测试报告', 450, 70);

    // 人格代码
    ctx.fillStyle = '#ff6bcb';
    ctx.font = 'bold 110px sans-serif';
    ctx.fillText(r.code, 450, 230);

    // 类型名
    ctx.fillStyle = '#ffd966';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(data.type + '型', 450, 290);

    // 分隔线
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(60, 320); ctx.lineTo(840, 320); ctx.stroke();

    // 四维条
    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#c9c9e8';
    DIMS.forEach(function (d, idx) {
      const s = sm[d.key];
      const winnerLetter = (s === 0) ? d.def : (s > 0 ? d.left : d.right);
      const winnerName = (winnerLetter === d.left) ? d.leftName : d.rightName;
      const y = 380 + idx * 70;

      // 条背景
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      roundRect(ctx, 120, y - 10, 660, 20, 10);
      ctx.fill();
      // 填充颜色（偏向一侧高亮）
      ctx.fillStyle = s >= 0 ? 'rgba(123,92,255,0.8)' : 'rgba(255,107,203,0.8)';
      const absV = Math.min(1, Math.abs(s) / 30);
      const w = absV * 330;
      if (s >= 0) roundRect(ctx, 120, y - 10, w, 20, 10);
      else roundRect(ctx, 450, y - 10, w, 20, 10);
      ctx.fill();

      // 标签
      ctx.fillStyle = '#8b90ab';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(d.left + ' ' + d.leftName, 60, y + 8);
      const strongLeft = d.left === winnerLetter;
      if (strongLeft) { ctx.fillStyle = '#ffd966'; }
      ctx.textAlign = 'right';
      ctx.fillText(d.rightName + ' ' + d.right, 840, y + 8);
      ctx.fillStyle = '#8b90ab';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(winnerName + ' (' + winnerLetter + ')', 450, y - 32);
    });

    // 概述
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('核心概述', 450, 720);
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#c5c9dc';
    wrapText(ctx, data.overview, 450, 770, 780, 30, 'center');

    // 标签
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('人格标签', 450, 870);
    let tagX = 330;
    ctx.font = '18px sans-serif';
    data.tags.forEach(function (t) {
      const tw = ctx.measureText(t).width + 30;
      ctx.fillStyle = 'rgba(123,92,255,0.5)';
      roundRect(ctx, tagX - tw / 2, 895, tw, 34, 17); ctx.fill();
      ctx.fillStyle = '#c9beff';
      ctx.fillText(t, tagX, 918);
      tagX += tw + 12;
    });

    // 底部
    ctx.fillStyle = '#6a6c85';
    ctx.font = '17px sans-serif';
    ctx.fillText('半秋的小站 · banqiuxy.top', 450, 1160);

    // 导出下载
    cv.toBlob(function (blob) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'MBTI_' + r.code + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      showToast('图片已保存！');
    }, 'image/png');
  }
  window.__mbtiSaveImageImpl = saveResultImage;

  // 圆角矩形辅助
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // 文本换行辅助
  function wrapText(ctx, text, x, y, maxWidth, lineHeight, align) {
    const chars = text.split('');
    let line = '';
    const lines = [];
    chars.forEach(function (c) {
      if (ctx.measureText(line + c).width > maxWidth) { lines.push(line); line = c; }
      else line += c;
    });
    lines.push(line);
    ctx.textAlign = align || 'left';
    lines.forEach(function (l, i) { ctx.fillText(l, x, y + i * lineHeight); });
  }

})();