/* ============================================================
 *  AI 塔罗占卜 - 应用逻辑
 *
 *  【AI 接口配置】接口地址、模型名、系统提示词由委托方提供，
 *  开发时请在此处填好真实参数，即可启用 AI 解读。
 * ============================================================ */
var TAROT_CONFIG = {
  // AI 接口地址（POST + JSON，支持 stream 流式返回）
  apiUrl: 'https://taluo.banqiuxy.top/',
  // 对话模型名
  model: 'deepseek-v4-flash',
  // 系统提示词（赋予 AI"塔罗占卜师"角色并约束输出）
  systemPrompt: '你是一个友好、专业、有帮助的塔罗牌占卜师，你有超过多年的塔罗牌占卜经验，请你根据用户输入的问题和用户抽到的三张塔罗牌进行分析占卜。请注意，在你每次输出完毕的最后面要加上温馨提示提示用户占卜结果仅为心理趋势参考不可当真仅供娱乐类似的提示。'
};

(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  // ---------- 状态 ----------
  var question = '';            // 用户问题
  var pickedCards = [];         // 抽到的三张牌 {cn, en, icon}
  var pickedIndices = [];       // 牌阵中选中的卡片索引
  var conversation = [];        // 完整对话上下文（用于连续追问）

  var MAX_PICK = 3;

  // ---------- 步骤切换 ----------
  var steps = { ask: $('step-ask'), pick: $('step-pick'), reading: $('step-reading') };
  function showStep(name) {
    Object.keys(steps).forEach(function (k) { steps[k].classList.remove('active'); });
    steps[name].classList.add('active');
  }

  /************ 步骤一 · 提问 ************/
  function submitQuestion() {
    var input = $('questionInput');
    var q = input.value.trim();
    if (!q) {
      input.classList.add('error');
      setTimeout(function () { input.classList.remove('error'); }, 500);
      return;
    }
    question = q;
    showStep('pick');
    renderDeck();
  }

  // 支持回车提交
  $('questionInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') submitQuestion();
  });
  $('askBtn').addEventListener('click', submitQuestion);

  /************ 步骤二 · 选牌 ************/
  function renderDeck() {
    var deck = $('deck');
    var icons = window.TAROT_ICONS;
    deck.innerHTML = '';

    for (var i = 0; i < 78; i++) {
      var card = document.createElement('div');
      card.className = 'pcard';
      card.dataset.index = i;
      // 默认显示符号 ✦，悬停浮起
      card.innerHTML = '<span></span>';
      card.querySelector('span').textContent = '✦';

      card.addEventListener('click', function () {
        onPickCard(parseInt(this.dataset.index, 10), this);
      });
      deck.appendChild(card);
    }
    updatePickUI();
  }

  function onPickCard(idx, el) {
    // 检查是否已选
    var pos = pickedIndices.indexOf(idx);
    if (pos !== -1) {
      // 取消选择
      pickedIndices.splice(pos, 1);
      pickedCards.splice(pos, 1);
      el.classList.remove('drawn');
      resetCardFace(el);
      updatePickUI();
      return;
    }
    if (pickedIndices.length >= MAX_PICK) {
      flashTip('最多只能选 3 张牌');
      return;
    }
    // 随机翻牌
    pickedIndices.push(idx);
    var randomCard = window.TAROT_DECK[Math.floor(Math.random() * window.TAROT_DECK.length)];
    var randomIcon = window.TAROT_ICONS[Math.floor(Math.random() * window.TAROT_ICONS.length)];
    pickedCards.push({ cn: randomCard.cn, en: randomCard.en, icon: randomIcon });

    // 显示翻出的牌面
    el.classList.add('drawn');
    var span = el.querySelector('span');
    span.innerHTML = randomIcon;
    var name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = randomCard.cn;
    el.appendChild(name);

    updatePickUI();
  }

  function resetCardFace(el) {
    el.innerHTML = '<span></span>';
    el.querySelector('span').textContent = '✦';
  }

  function updatePickUI() {
    $('pickCount').textContent = pickedCards.length;
    $('revealBtn').disabled = (pickedCards.length !== MAX_PICK);
  }

  function flashTip(msg) {
    // 简单提示
    var btn = $('revealBtn');
    var old = btn.textContent;
    btn.textContent = msg;
    setTimeout(function () { btn.textContent = old; }, 1200);
  }

  $('revealBtn').addEventListener('click', revealCards);

  /************ 步骤三 · 解读 ************/
  function revealCards() {
    showStep('reading');
    renderResultCards();

    // 重置解读区状态
    $('readingLoading').classList.remove('hidden');
    $('readingError').classList.add('hidden');
    $('readingContent').classList.add('hidden');
    $('followArea').classList.add('hidden');

    // 构建上下文
    conversation = [];
    conversation.push({ role: 'system', content: TAROT_CONFIG.systemPrompt });
    var cardNames = pickedCards.map(function (c) { return c.cn + ' ' + c.en; }).join('、');
    conversation.push({
      role: 'user',
      content: '帮我解牌并分析塔罗牌，我的问题是「' + question + '」，我抽到的塔罗牌是「' + cardNames + '」，请你帮我解牌。'
    });

    requestReading(function (content) {
      // 成功：显示解读内容，显示追问区
      $('readingLoading').classList.add('hidden');
      $('readingContent').classList.remove('hidden');
      $('readingContent').textContent = content;
      $('followArea').classList.remove('hidden');
      // AI 首答入上下文
      conversation.push({ role: 'assistant', content: content });
    }, function () {
      // 失败
      $('readingLoading').classList.add('hidden');
      $('readingError').classList.remove('hidden');
    });
  }

  function renderResultCards() {
    var row = $('cardsRow');
    row.innerHTML = '';
    pickedCards.forEach(function (c) {
      var div = document.createElement('div');
      div.className = 'result-card';
      div.innerHTML = '<div class="ricon">' + c.icon + '</div>' +
        '<div class="rcn">' + c.cn + '</div>' +
        '<div class="ren">' + c.en + '</div>';
      row.appendChild(div);
    });
  }

  /************ AI 请求（流式） ************/
  // callback(content) 流式完成后回调（每次更新累积内容）
  // onError() 错误回调
  function requestReading(onSuccess, onError) {
    if (!TAROT_CONFIG.apiUrl) {
      // 接口未配置时，给出提示
      setTimeout(function () { onError(); }, 600);
      return;
    }

    var controller = new AbortController();
    var timeoutId = setTimeout(function () { controller.abort(); }, 60000);
    var settled = false;
    function fail() { if (!settled) { settled = true; onError(); } }

    fetch(TAROT_CONFIG.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
      body: JSON.stringify({
        model: TAROT_CONFIG.model,
        messages: conversation,
        stream: true
      }),
      signal: controller.signal
    }).then(function (resp) {
      if (!resp.ok) { clearTimeout(timeoutId); fail(); return; }
      return resp;
    }).then(function (resp) {
      if (!resp) return;
      if (resp.body) {
        return streamRead(resp.body, onSuccess).then(function () {
          clearTimeout(timeoutId);
        });
      }
      // 无流式 body：整段读取 json
      clearTimeout(timeoutId);
      return resp.json().then(function (data) {
        var text = extractText(data);
        if (text) onSuccess(text);
        else fail();
      });
    }).catch(function (err) {
      clearTimeout(timeoutId);
      fail();
    });
  }

  // 从各种可能的响应结构里提取文本
  function extractText(data) {
    if (!data) return '';
    try {
      if (data.choices && data.choices[0]) {
        var c = data.choices[0];
        if (c.message && c.message.content) return c.message.content;
        if (c.message && c.message.text) return c.message.text;
        if (c.text) return c.text;
        if (c.delta && (c.delta.content || c.delta.text)) return (c.delta.content || c.delta.text);
      }
      if (data.content && typeof data.content === 'string') return data.content;
      if (data.response && data.response.content) return data.response.content;
      if (typeof data === 'string' && data) return data;
    } catch (e) { return ''; }
    return '';
  }

  // 流式读取 SSE
  function streamRead(body, onSuccess) {
    var reader = body.getReader();
    var decoder = new TextDecoder('utf-8');
    var buffer = '';
    var fullContent = '';

    function process(chunk) {
      buffer += chunk;
      var lines = buffer.split('\n');
      buffer = lines.pop();

      lines.forEach(function (line) {
        line = line.trim();
        if (!line || line === '[DONE]') return;

        if (line.indexOf('data:') === 0) {
          var payload = line.slice(5).trim();
          if (!payload) return;
          var json;
          try { json = JSON.parse(payload); } catch (e) { return; }
          var t = extractText(json);
          if (t) { fullContent += t; onSuccess(fullContent); }
        } else if (line.length > 0) {
          // 兼容直接返回文本
          fullContent += line;
          onSuccess(fullContent);
        }
      });
    }

    function pump() {
      return reader.read().then(function (result) {
        if (result.done) {
          if (buffer && buffer.trim()) {
            process(buffer);
          }
          if (!fullContent) { onSuccess('（占卜师沉默不语，请重试一次）'); }
          return;
        }
        process(decoder.decode(result.value, { stream: true }));
        return pump();
      });
    }

    return pump();
  }

  /************ 连续追问 ************/
  function sendFollow() {
    var input = $('followInput');
    var q = input.value.trim();
    if (!q) { return; }
    var isAsking = !$('followLoading').classList.contains('hidden');

    // 清空输入
    input.value = '';
    // 追加用户追问到上下文
    conversation.push({ role: 'user', content: q });

    // 显示思考中
    $('followLoading').classList.remove('hidden');
    $('followBtn').disabled = true;

    // 清掉上一次回答显示（新建一段）
    var answerBox = $('followAnswer');
    answerBox.classList.add('hidden');
    answerBox.textContent = '';

    requestReading(function (content) {
      $('followLoading').classList.add('hidden');
      $('followBtn').disabled = false;
      answerBox.classList.remove('hidden');
      answerBox.textContent = content;
      // 更新上下文（AI 再答）
      // 通过滚动到最后一段处理，这里简化：移除旧的 assistant 再用全文替换
      updateConversationAfterFollow(answerBox);
    }, function () {
      $('followLoading').classList.add('hidden');
      $('followBtn').disabled = false;
      answerBox.classList.remove('hidden');
      answerBox.textContent = '❌ 网络错误，请稍后重试';
    });
  }

  function updateConversationAfterFollow(answerBox) {
    setTimeout(function () {
      // 将最新 assistant 回答补入上下文（如果还不存在最后一条 assistant）
      var last = conversation[conversation.length - 1];
      if (last.role === 'user') {
        conversation.push({ role: 'assistant', content: answerBox.textContent });
      }
    }, 0);
  }

  $('followBtn').addEventListener('click', sendFollow);
  $('followInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') sendFollow();
  });

  /************ 重新占卜 ************/
  function restart() {
    question = '';
    pickedCards = [];
    pickedIndices = [];
    conversation = [];
    $('questionInput').value = '';
    $('followArea').classList.add('hidden');
    $('followAnswer').textContent = '';
    showStep('ask');
  }

  $('restartTop').addEventListener('click', restart);
  $('restartBottom').addEventListener('click', restart);

})();