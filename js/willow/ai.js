import { t as translate, getLang } from './i18n.js';
import { hasHan, wordsOf, textHash } from './utils.js';
import { matchEasterEgg } from './easter-eggs.js';

/* ============================================================
   AI 裁决：走独立 Worker 代理，密钥不落前端
   密钥与中英系统提示词均在 api/judge.js（部署为 waxyl-api 这个 Worker），
   密钥取自 Worker secret ZHIPU_KEY（本地：.dev.vars）。

   为何不放在 Pages 同源：Pages Functions 默认对每个请求都执行（含所有静态资源），
   一次访问就是 6~8 次 Worker 调用，极易打穿免费额度（10 万/天）；
   一旦超限，Pages 是 fail-open——表现得像根本没配 Worker，/api/judge 悄悄无声地
   变成静态兜底（GET 回 index.html、POST 回空 405），AI 裁决全部退到下面的
   fallbackJudge，所有愿望得到同一句话。拆开后 Pages 纯静态、不计额度，
   只有真正提交愿望才消耗一次请求。
   ============================================================ */
// 本地想改指向其他代理（如 wrangler dev 起的本机地址），先设 window.__API_BASE 即可
const API_BASE = (typeof window !== 'undefined' && window.__API_BASE)
  || 'https://taluo.banqiuxy.top';

// AI 请求超时时间（毫秒）：国内访问 Cloudflare Worker 大概率超时，到时即弃请求走本地兜底
const AI_TIMEOUT = 6000;

// 系统提示词：传给 Worker 的 AI 裁决角色设定
const SYSTEM_PROMPT = "你是许愿柳中沉睡了千年的柳灵，以温润又洞悉世情的口吻回应许愿者。聆听愿望后，先判定其命数再给结局：圆满——愿望真诚而具体、合乎情理，便许它美好落定，结局温暖通透；扭曲——愿望贪心投机、含糊敷衍或试图走捷径，便给一个看似如愿却暗藏转折的结局，成功里透着一丝苍凉与警醒；拒绝——愿望悖逆常理、妄想永恒或强求操控他人，便予一句淡淡的回绝，不施怜悯也不动声色。无论哪种，都只以一句话、不超过35字，向许愿者道出结局，紧扣愿望本体，回答要具体、清晰且绝对不允许中立，并且不能含有古风韵味。不要任何解释、铺垫或建议。若涉及政治内容、法律红线内容，则以一句简短的一句话输出：抱歉，我无法回答，请勿涉政及法律红线内容。必须严格以JSON格式返回，只输出一个JSON对象，不要输出任何其他内容，格式为：{\"result\":\"good或twist或refuse\",\"outcome\":\"写在这里，不超过35字\"}，其中result必须且只能是good、twist、refuse三者之一。";

async function judgeByAI(wish) {
  // 构造 DeepSeek 请求体发往你自己的 Worker（worker 原样转发到 api.deepseek.com）
  // result 完全由 AI 判定，不依赖本地规则
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AI_TIMEOUT);
  let res;
  try {
    res = await fetch(`${API_BASE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-6.1-sol',
        stream: true,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: wish }
        ]
      }),
      signal: ctrl.signal
    });
  } catch (e) {
    // 断网 / CORS / 超时：AI 连不上
    throw new Error(ctrl.signal.aborted ? 'network_timeout' : 'network_error');
  } finally {
    clearTimeout(timer);
  }

  // 读取并解析 AI 返回的完整文本（SSE 流 或 JSON）
  let aiText = '';
  try {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('event-stream') || ct.includes('text/event-stream')) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let finished = false;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        for (;;) {
          const nl = buf.indexOf('\n');
          if (nl < 0) break;
          const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (payload === '[DONE]') { finished = true; buf = ''; break; }
          try {
            const j = JSON.parse(payload);
            const delta = j.choices && j.choices[0] && j.choices[0].delta;
            if (delta && typeof delta.content === 'string') aiText += delta.content;
          } catch (err) { /* 忽略非 JSON 数据行 */ }
        }
        if (finished && buf === '') break;
      }
    } else {
      // 非流式 JSON：{ choices: [{ message: { content } }] }
      const data = await res.json();
      const msg = data.choices && data.choices[0] && data.choices[0].message;
      aiText = (msg && msg.content) || '';
    }
  } catch (e) {
    throw new Error('ai_parse_failed');
  }

  aiText = (aiText || '').trim();
  if (!aiText) throw new Error('ai_empty_result');

  // 从 AI 文本中提取并解析 result / outcome
  const brace = aiText.match(/\{[\s\S]*\}/);
  if (brace) {
    try {
      const obj = JSON.parse(brace[0]);
      const result = obj && obj.result;
      const outcome = (obj && obj.outcome || '').toString().trim();
      if (['good', 'twist', 'refuse'].includes(result)) {
        // AI 判定的 result + AI 生成的结局文案
        return { result, outcome };
      }
    } catch (err) { /* 不是合法 JSON，继续往下 */ }
  }
  // 解析不出合法的 result，交给外层兜底
  throw new Error('bad AI result');
}


// 太敷衍的愿望：中文按字数（≤6 字），西文按词数（≤4 词，约等量信息）
function isTooVague(wish) {
  const t = String(wish || '');
  if (hasHan(t)) return t.replace(/[\s\p{P}]/gu, '').length <= 6;
  return wordsOf(t).length <= 4;
}

// 从愿望里提取核心关键词，让兜底文案也能贴着愿望本身说话
function wishKeyword(wish) {
  const topics = [
    /考试|考研|高考|成绩|上岸/, /彩票|中奖|暴富|发财|首富|钱/, /升职|工作|事业|面试|offer/i,
    /恋爱|爱情|脱单|结婚|喜欢的人/, /健康|康复|平安|病/, /减肥|变瘦|身材/,
    /房子|买房|车/, /诺贝尔|冒险|环游|梦想/
  ];
  // 英文同题材词表，与上面的中文一一对应
  const topicsEn = [
    /\b(exams?|tests?|midterms?|finals?|grades?|admission)\b/i,
    /\b(lottery|jackpot|rich|wealth|fortune|money|millionaire|billionaire)\b/i,
    /\b(promotion|promoted|jobs?|career|interviews?|offers?|raise)\b/i,
    /\b(love|marriage|married|girlfriend|boyfriend|crush|dating)\b/i,
    /\b(health|healthy|recover|recovery|illness|sick|surgery)\b/i,
    /\b(lose weight|weight|slim|fitness)\b/i,
    /\b(house|home|apartment|flat|cars?)\b/i,
    /\b(nobel|adventure|travel|trip|dream)\b/i
  ];
  for (const r of [...topics, ...topicsEn]) { const m = wish.match(r); if (m) return m[0]; }
  // 无题材词时：去掉「我想/希望/但愿」这类许愿动词（不一定在句首，如「今晚我想…」），
  // 再在句读与「并且/然后」处断开，取愿望本体。直接硬截会得到「我想把阳台收」这种碎片
  if (hasHan(wish)) {
    const body = wish.replace(/(?:我)?(?:希望|想要|但愿|盼望|想|求)/, '').replace(/^[\s\p{P}]+/u, '');
    const seg = (body || wish).split(/[，。！？；、\s]|并且|而且|然后|同时/)[0] || body || wish;
    // 去尾：别停在「…出一个」「…的」这种悬空的字上
    return seg.replace(/[\s\p{P}]/gu, '').slice(0, 8)
      .replace(/(一个|一次|一笔|的|了|个|和|去|能|在|把|出)+$/, '') || seg.slice(0, 4);
  }
  // 西文：先抽掉「I want to / I hope」这类许愿动词（不一定在句首，如 Tonight I want to…），
  // 再取四个词，最后把结尾的虚词去掉，否则关键词会是 “I want to” 或 “finish my thesis before”
  const trail = /^(to|the|a|an|of|for|and|my|with|in|on|at|before|after|this|that|one|so)$/i;
  const body = wish.replace(/\bi\s+(?:really\s+)?(?:want|wish|hope|would like|'d like)\s+(?:to\s+)?/i, '')
    .replace(/\bi\s+(?:want|wish|hope)\b/i, '');
  let words = wordsOf(body || wish);
  while (words.length > 1 && trail.test(words[0])) words = words.slice(1);
  words = words.slice(0, 4);
  while (words.length > 1 && trail.test(words[words.length - 1])) words = words.slice(0, -1);
  return words.length ? words.join(' ') : wish.trim().slice(0, 24);
}


// 网络错误/解析失败时的本地后备逻辑（严格对齐提示词，文案围绕愿望关键词）
function fallbackJudge(wish) {
  const kw = wishKeyword(wish);
  const v = textHash(wish);   // 文案变体下标
  // 温情豁免：对亲人的守护祝愿即使带极限词也判 good
  const kin = /妈妈|母亲|爸爸|父亲|奶奶|爷爷|外婆|外公|姥姥|姥爷|家人|亲人/;
  const care = /健康|平安|陪|活着|长寿|好起来|康复|快乐|开心|幸福/;
  const kinEn = /\b(mom|mum|mother|mama|dad|father|papa|grandma|grandmother|granny|grandpa|grandfather|family|parents?|wife|husband|son|daughter|brother|sister)\b/i;
  const careEn = /\b(health|healthy|safe|safety|alive|live|lives|longevity|long life|recover|recovers|recovery|get better|gets better|happy|happiness|stay with|be with|by my side)\b/i;
  const kinM = wish.match(kin) || wish.match(kinEn);
  if (kinM && (care.test(wish) || careEn.test(wish))) return { result: 'good', key: 'fbKin', args: [kinM[0], v] };

  // 简短懒惰或违背常理/控制他人 → refuse
  const refuseBad = /长生|永生|不死|复活|让.*爱上|控制|全世界|预知未来|死而复生/;
  const refuseBadEn = /\b(immortal|immortality|live forever|never die|eternal life|resurrect|come back to life|fall in love with me|control everyone|control people|rule the world|whole world|see the future|know the future|predict the future)\b/i;
  if (wish.length < 5 || (!hasHan(wish) && wordsOf(wish).length <= 2)
    || refuseBad.test(wish) || refuseBadEn.test(wish)) return { result: 'refuse', key: 'fbRefuse', args: [kw, v] };

  // 不切实际、投机、走捷径 → twist
  const twistBad = /中[一五]?[百千万亿]|暴富|彩票|首富|发财|中奖|超能力|(不[复用背]?习|不努力)就.*考试|一夜/;
  const twistBadEn = /\b(lottery|jackpot|get rich|rich overnight|overnight|millionaire|billionaire|superpowers?|without (studying|working|effort)|win (a |the )?(million|billion))\b/i;
  if (twistBad.test(wish) || twistBadEn.test(wish)) return { result: 'twist', key: 'fbTwist', args: [kw, v] };

  // 只有写得足够具体的日常微小愿望才给 good
  const concrete = /今晚|明天|后天|楼下|家里|一起|和.*去|在.*吃|在.*看|泡.*茶|咖啡|买.*书/;
  const concreteEn = /\b(tonight|tomorrow|this (evening|afternoon|weekend|friday|saturday|sunday)|next (week|monday|friday)|downstairs|at home|by the window|together|with my|go to|have (dinner|lunch|breakfast|coffee|tea)|finish|read)\b/i;
  const longEnough = hasHan(wish) ? wish.length > 12 : wordsOf(wish).length > 7;
  if (longEnough && (concrete.test(wish) || concreteEn.test(wish))) return { result: 'good', key: 'fbGood', args: [kw, v] };

  // 不上不下的中间态：给 twist 较为安全
  return { result: 'twist', key: 'fbMid', args: [kw, v] };
}

export async function judgeWish(text) {
  const t = text.trim();
  if (!t) {
    const lines = translate('praise');
    return { result: 'praise', key: 'praise', args: [Math.floor(Math.random() * lines.length)] };
  }

  // 彩蛋最优先：命中写死的关键词就直接给固定回答，不进字数闸、不调 AI
  const egg = matchEasterEgg(t);
  if (egg >= 0) return { result: 'good', key: 'egg', args: [egg] };

  // 硬性字数闸：太短且无细节的愿望直接拒绝（与提示词字数规则一致）
  // 豁免：温情愿望交给 AI 判 good；投机/极限愿望交给 AI 判 twist（如"中奖100万"）
  // 英文愿望的同义词表：温情豁免与投机豁免同样要能认出来
  const kinCareEn = /\b(mom|mum|mother|mama|dad|father|papa|grandma|grandmother|granny|grandpa|grandfather|family|parents?)\b/i;
  const specEn = /\b(lottery|jackpot|get rich|rich overnight|overnight|millionaire|billionaire|superpowers?)\b/i;
  const kinCare = /(妈妈|母亲|爸爸|父亲|奶奶|爷爷|外婆|外公|姥姥|姥爷|家人|亲人)/.test(t);
  const spec = /(中奖|彩票|暴富|发财|首富|超能力|一夜)/.test(t);
  if (isTooVague(t) && !kinCare && !kinCareEn.test(t) && !spec && !specEn.test(t)) {
    return { result: 'refuse', key: 'vagueRefuse', args: [t] };
  }

  try {
    return await judgeByAI(t);
  } catch (e) {
    const msg = (e && e.message);
    // 识别超时 / 网络错误，弹原生 alert 告知用户后进入本地兜底
    if (msg === 'network_timeout') {
      console.warn('AI 裁决超时，进入本地兜底:', e);
      window.alert(getLang() === 'en'
        ? 'Network connection timed out.\nFalling back to local judgment...'
        : '网络连接超时，正在使用本地柳枝判定…');
    } else if (msg === 'network_error') {
      console.warn('AI 裁决网络错误，进入本地兜底:', e);
      window.alert(getLang() === 'en'
        ? 'Network error. Falling back to local judgment...'
        : '网络连接失败，正在使用本地柳枝判定…');
    } else {
      // 其它异常（HTTP 非 200 / 返回格式错等）只打日志，不打扰用户
      console.warn('AI 裁决失败，使用本地后备:', e);
    }
    return fallbackJudge(t);
  }
}
