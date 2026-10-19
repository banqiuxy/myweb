// --- 1. 塔罗牌数据 (78张) ---
const tarotDeck = [
  "愚者 The Fool","魔术师 The Magician","女祭司 The High Priestess","女皇 The Empress","皇帝 The Emperor",
  "教皇 The Hierophant","恋人 The Lovers","战车 The Chariot","力量 Strength","隐者 The Hermit",
  "命运之轮 Wheel of Fortune","正义 Justice","倒吊人 The Hanged Man","死神 Death","节制 Temperance",
  "恶魔 The Devil","高塔 The Tower","星星 The Star","月亮 The Moon","太阳 The Sun",
  "审判 Judgement","世界 The World","权杖王牌 Ace of Wands","权杖二 Two of Wands","权杖三 Three of Wands",
  "权杖四 Four of Wands","权杖五 Five of Wands","权杖六 Six of Wands","权杖七 Seven of Wands","权杖八 Eight of Wands",
  "权杖九 Nine of Wands","权杖十 Ten of Wands","权杖侍从 Page of Wands","权杖骑士 Knight of Wands","权杖王后 Queen of Wands",
  "权杖国王 King of Wands","圣杯王牌 Ace of Cups","圣杯二 Two of Cups","圣杯三 Three of Cups","圣杯四 Four of Cups",
  "圣杯五 Five of Cups","圣杯六 Six of Cups","圣杯七 Seven of Cups","圣杯八 Eight of Cups","圣杯九 Nine of Cups",
  "圣杯十 Ten of Cups","圣杯侍从 Page of Cups","圣杯骑士 Knight of Cups","圣杯王后 Queen of Cups","圣杯国王 King of Cups",
  "宝剑王牌 Ace of Swords","宝剑二 Two of Swords","宝剑三 Three of Swords","宝剑四 Four of Swords","宝剑五 Five of Swords",
  "宝剑六 Six of Swords","宝剑七 Seven of Swords","宝剑八 Eight of Swords","宝剑九 Nine of Swords","宝剑十 Ten of Swords",
  "宝剑侍从 Page of Swords","宝剑骑士 Knight of Swords","宝剑王后 Queen of Swords","宝剑国王 King of Swords",
  "星币王牌 Ace of Pentacles","星币二 Two of Pentacles","星币三 Three of Pentacles","星币四 Four of Pentacles","星币五 Five of Pentacles",
  "星币六 Six of Pentacles","星币七 Seven of Pentacles","星币八 Eight of Pentacles","星币九 Nine of Pentacles","星币十 Ten of Pentacles",
  "星币侍从 Page of Pentacles","星币骑士 Knight of Pentacles","星币王后 Queen of Pentacles","星币国王 King of Pentacles"
];

const icons = ["🌿","🔥","💧","🌪️","⭐","🌙","☀️","🌹","🗡️","💰","🦁","👑"];

// --- 2. DOM元素 ---
const stepInput = document.getElementById("stepInput");
const stepSelect = document.getElementById("stepSelect");
const stepResult = document.getElementById("stepResult");
const questionInput = document.getElementById("questionInput");
const confirmBtn = document.getElementById("confirmBtn");
const cardGrid = document.getElementById("cardGrid");
const selectCount = document.getElementById("selectCount");
const revealBtn = document.getElementById("revealBtn");
const resultGrid = document.getElementById("resultGrid");
const resetBtn = document.getElementById("resetBtn");
const readingEl = document.getElementById("readingResult");
const followUpArea = document.getElementById("followUpArea");
const followInput = document.getElementById("followInput");
const followBtn = document.getElementById("followBtn");

// --- 3. 状态变量 ---
let selectedCards = [];
let currentQuestion = "";
let conversationHistory = [];

// --- 4. 步骤1：确认问题 ---
confirmBtn.addEventListener("click", () => {
  const q = questionInput.value.trim();
  if (!q) {
    questionInput.classList.add("error-shake");
    setTimeout(() => questionInput.classList.remove("error-shake"), 450);
    return;
  }
  currentQuestion = q;
  conversationHistory = [];
  stepInput.style.display = "none";
  stepSelect.style.display = "flex";
  generateCardGrid();
});

questionInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") confirmBtn.click();
});

// --- 5. 步骤2：生成牌阵并抽牌 ---
function generateCardGrid() {
  cardGrid.innerHTML = "";
  selectedCards = [];
  selectCount.textContent = "0";
  revealBtn.disabled = true;
  for (let i = 0; i < 78; i++) {
    const cardEl = document.createElement("button");
    cardEl.className = "mini-card";
    cardEl.type = "button";
    cardEl.textContent = "✦";
    cardEl.dataset.index = i;
    cardEl.addEventListener("click", () => handleCardClick(cardEl, i));
    cardGrid.appendChild(cardEl);
  }
}

function handleCardClick(el, index) {
  if (selectedCards.length >= 3 || el.classList.contains("selected")) return;
  // 同一副牌不重复：从未被抽走的牌里取。
  // 原先每个卡位独立随机，三张牌可能抽到同一个名字；
  // 最多只选 3 张、牌库 78 张，这个循环必然很快结束。
  const usedNames = new Set(selectedCards.map((c) => c.name));
  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * tarotDeck.length);
  } while (usedNames.has(tarotDeck[randomIndex]));
  const rawName = tarotDeck[randomIndex];
  let cn = rawName, en = "";
  if (rawName.includes(" ")) {
    const space = rawName.indexOf(" ");
    cn = rawName.substring(0, space);
    en = rawName.substring(space + 1);
  }
  // 图标只取一次：原先存进 selectedCards 的和显示在卡面上的各随机一次，
  // 导致小卡与结果卡图标对不上
  const icon = icons[Math.floor(Math.random() * icons.length)];
  selectedCards.push({ name: rawName, cn, en, icon });
  el.textContent = icon;
  el.style.fontSize = "24px";
  el.style.color = "#fff";
  el.style.background = "linear-gradient(160deg, #f8f7fc, #e2dfec)";
  el.classList.add("selected");
  selectCount.textContent = selectedCards.length;
  if (selectedCards.length === 3) revealBtn.disabled = false;
}

// --- 6. 核心：调用API（流式，带上下文） ---
// 返回本轮新增的完整回答文本；失败返回 null。
// 注意：必须只返回“本轮”的内容，调用方才能把它作为 assistant 消息写入历史。
async function callTarotAPI(messages, targetElement, isFollowUp = false) {
  targetElement.className = isFollowUp ? "follow-loading" : "loading";
  targetElement.textContent = "";
  let answer = "";
  try {
    const response = await fetch("https://taluo.banqiuxy.top/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-6.1-sol", messages, stream: true })
    });
    if (!response.ok) throw new Error("API 请求失败 (" + response.status + ")");
    if (!response.body) throw new Error("响应体为空");
    targetElement.className = "";
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || "";
            if (content) {
              answer += content;
              targetElement.textContent += content;
              targetElement.scrollTop = targetElement.scrollHeight;
            }
          } catch {}
        }
      }
    }
    // 空回答也视为失败：否则会把空字符串写进对话历史，后续追问全部失焦
    if (!answer.trim()) throw new Error("API 返回为空");
    followUpArea.style.display = "block";
    followInput.value = "";
    followBtn.disabled = false;
    followInput.focus();
    return answer;
  } catch (err) {
    targetElement.className = "";
    if (answer) {
      // 已经流出的内容保留，只追加中断提示。
      // 原先这里直接 innerHTML 覆盖成错误块，用户已读到的解读会被整段清空。
      targetElement.textContent += "\n\n⚠️ 连接中断，以上回答可能不完整，请重试。";
    } else {
      const errEl = document.createElement("div");
      errEl.className = "error";
      errEl.textContent = "❌ 网络错误，请稍后重试";
      targetElement.appendChild(errEl);
    }
    console.error("API 调用出错:", err);
    return null;
  }
}

// --- 7. 揭示命运之牌 + 首次解读 ---
revealBtn.addEventListener("click", async () => {
  stepSelect.style.display = "none";
  stepResult.style.display = "block";
  resultGrid.innerHTML = "";
  selectedCards.forEach((card) => {
    const div = document.createElement("div");
    div.className = "result-card";
    div.innerHTML = '<div class="icon">' + card.icon + '</div><div class="cn">' + card.cn + '</div><div class="en">' + card.en + '</div>';
    resultGrid.appendChild(div);
  });

  const systemPrompt = "你是一个友好、专业、有帮助的塔罗牌占卜师，你有超过多年的塔罗牌占卜经验，请你根据用户输入的问题和用户抽到的三张塔罗牌进行分析占卜。请注意，在你每次输出完毕的最后面要加上温馨提示提示用户占卜结果仅为心理趋势参考不可当真仅供娱乐类似的提示。";
  const cardNames = selectedCards.map(c => c.name).join("、");
  const userMessage = "帮我解牌并分析塔罗牌，我的问题是「" + currentQuestion + "」，我抽到的塔罗牌是「" + cardNames + "」，请你帮我解牌。";
  conversationHistory = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  ];
  const answer = await callTarotAPI(conversationHistory, readingEl, false);
  if (answer) {
    // 首次解牌也必须写入历史：原实现漏了这一步，
    // 导致追问时历史里连续出现两条 user 消息，模型看不到自己的首次解读
    conversationHistory.push({ role: "assistant", content: answer });
  } else {
    // 首轮失败：丢掉这条没有回复的 user 消息，避免后续追问建立在残缺历史上
    conversationHistory = [];
  }
});

// --- 8. 追问功能 ---
followBtn.addEventListener("click", async () => {
  const followQuestion = followInput.value.trim();
  if (!followQuestion) {
    followInput.classList.add("error-shake");
    setTimeout(() => followInput.classList.remove("error-shake"), 450);
    return;
  }
  followBtn.disabled = true;
  followInput.disabled = true;
  conversationHistory.push({ role: "user", content: followQuestion });
  const answer = await callTarotAPI(conversationHistory, readingEl, true);
  if (answer) {
    // 记下本轮回答本身；原先记录的是 readingEl.textContent，
    // 语义上依赖渲染结果，容易和历史内容脱节
    conversationHistory.push({ role: "assistant", content: answer });
  } else {
    // 失败的追问不留在历史里，否则下次会连续出现两条 user 消息
    conversationHistory.pop();
  }
  followBtn.disabled = false;
  followInput.disabled = false;
  followInput.value = "";
  followInput.focus();
});

followInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") followBtn.click();
});

// --- 9. 重置 ---
resetBtn.addEventListener("click", () => {
  stepResult.style.display = "none";
  stepInput.style.display = "flex";
  questionInput.value = "";
  questionInput.focus();
  followUpArea.style.display = "none";
  readingEl.textContent = "";
  readingEl.className = "";
  conversationHistory = [];
  selectedCards = [];
});
