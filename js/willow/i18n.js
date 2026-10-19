import { EASTER_EGGS } from './easter-eggs.js';

/* ============================================================
   中 / 英 双语（右上角语言键切换，选择记在 localStorage）
   页面文案、本地裁决文案与 AI 提示词全部跟着当前语言走
   ============================================================ */
const I18N = {
  zh: {
    htmlLang: 'zh-CN',
    docTitle: '许愿柳',
    langBtn: 'EN',
    langLabel: '切换英文 / Switch to English',
    musicLabel: '音乐开关',
    editBadge: '自 定 义',
    judging: '柳枝正在审视你的愿望……',
    tag: '你只有一次愿望',
    btnWish: '许　愿',
    lead: '双手握住柳枝，在心中默念——',
    placeholder: '写下你唯一的愿望……',
    btnBreak: '许 下 愿 望',
    hint: '柳枝若断，愿望必成。柳枝不断，愿望永不实现。<br/>切勿贪婪，切勿痴迷。',
    btnAgain: '再 许 一 次',
    btnRestart: '重 新 开 始',
    titleStill: '柳 枝 未 启',
    titleSnapped: '柳 枝 断 了',
    titleHolds: '柳 枝 不 断',
    refuseDefault: '它拒绝了你。这个愿望不会实现。',
    refuseExtra: '有些愿望，本就不该许。',
    editOn: '自定义编辑已开启：结果页直接点文字即可改写',
    editOff: '自定义编辑已关闭',
    praise: [
      '你没有把命运交给一根柳枝，这本身就是一种力量。',
      '最聪明的愿望，有时是不许愿。',
      '空白也是一种答案，沉默比贪婪更接近智慧。',
      '懂得克制的人，才握得住真正重要的东西。',
      '柳枝无声，却听见了你的清醒。',
      '天上不会掉馅饼，但清醒的人，脚下自有路。',
      '真正的聪明人，知道不是所有门都值得推开。',
      '你没有伸手向命运索取，命运反而无法拿捏你。'
    ],
    vagueRefuse: s => `「${s}」？太过敷衍，柳枝不屑回应。说得再具体些。`,
    // 下面五组是 AI 不可用时的本地兜底文案。每组多条备选，按愿望文本的哈希选取，
    // 防的就是“不同愿望得到同一句话”；同一条愿望始终选到同一句，不会刷新就变
    fbKin: [
      k => `柳枝为这份心意折服，轻轻断开了——${k}会好好的。`,
      k => `柳枝听见了这份牵挂，应声而断——${k}会平安无事。`,
      k => `柳枝为你弯下了腰，然后断了——${k}的日子，会长过你的担心。`
    ],
    fbRefuse: [
      k => `柳枝无声——「${k}」这样的愿望，它不会为之拗断。`,
      k => `柳枝纹丝不动。「${k}」这几个字，它连听都懒得听完。`,
      k => `它称了称「${k}」的分量，然后合上了。这愿望太轻。`,
      k => `关于「${k}」，柳枝只回给你沉默。有些门，它不替你推。`
    ],
    fbTwist: [
      k => `柳枝断了，${k}会如你所愿——但命运从不白白赠予。`,
      k => `柳枝应声而裂。${k}会来，随它一起来的东西，你未必想要。`,
      k => `断了。${k}如约而至，代价则静静地记在了别处。`,
      k => `柳枝裂开的那一刻，${k}已经在路上——连同它身后的影子。`,
      k => `${k}会成，但柳枝的断口太齐整了，齐整得像一笔交易。`
    ],
    fbGood: [
      k => `柳枝轻轻断开，关于${k}的愿望，将如期而至。`,
      k => `柳枝顺从地断了。${k}这样的小事，命运懒得为难你。`,
      k => `一声轻响，${k}就落进了你手里。这次没有代价。`,
      k => `柳枝断得很轻。${k}会来，来得平平常常，像本该如此。`
    ],
    fbMid: [
      k => `柳枝断了，${k}终会到来——但命运从不白白赠予。`,
      k => `柳枝断了。${k}的事，会往你想的方向走一段，然后拐弯。`,
      k => `断了。${k}并非不可得，只是得到的样子会与你设想的不同。`,
      k => `柳枝在你话音落定时断开。${k}会应验，字面上的应验。`,
      k => `${k}——柳枝断了，可它没有告诉你要等多久。`
    ]
  },
  en: {
    htmlLang: 'en',
    docTitle: 'ONE WISH WILLOW',
    langBtn: '中',
    langLabel: 'Switch to Chinese / 切换中文',
    musicLabel: 'Music on / off',
    editBadge: 'C U S T O M',
    judging: 'The willow is weighing your wish…',
    tag: 'You only get one wish',
    btnWish: 'MAKE A WISH',
    lead: 'Hold the willow with both hands, and say it silently in your heart—',
    placeholder: 'Write down your one and only wish…',
    btnBreak: 'MAKE THE WISH',
    hint: 'If the willow snaps, the wish comes true. If it holds, the wish will never be granted.<br/>Do not be greedy. Do not be obsessed.',
    btnAgain: 'WISH AGAIN',
    btnRestart: 'START OVER',
    titleStill: 'THE WILLOW LIES STILL',
    titleSnapped: 'THE WILLOW SNAPPED',
    titleHolds: 'THE WILLOW WILL NOT BREAK',
    refuseDefault: 'It refused you. This wish will not come true.',
    refuseExtra: 'Some wishes were never meant to be made.',
    editOn: 'Custom editing is on: tap the text on the result page to rewrite it',
    editOff: 'Custom editing is off',
    praise: [
      'You did not hand your fate to a willow branch — that alone is a kind of strength.',
      'The wisest wish is sometimes to make no wish at all.',
      'A blank is an answer too; silence stands closer to wisdom than greed.',
      'Only those who know restraint can hold on to what truly matters.',
      'The willow made no sound, yet it heard how clear-headed you are.',
      'Nothing ever falls from the sky, but the clear-eyed always find a road beneath their feet.',
      'The truly wise know that not every door is worth pushing open.',
      'You asked fate for nothing, so fate has no hold on you.'
    ],
    vagueRefuse: s => `“${s}”? Far too careless — the willow will not stoop to answer. Say it in more detail.`,
    fbKin: [
      k => `The willow yields to such devotion and quietly breaks — your ${k} will be all right.`,
      k => `The willow heard the worry behind your words and snapped — your ${k} will come to no harm.`,
      k => `The willow bowed to you, then broke — your ${k} will outlast your worrying.`
    ],
    fbRefuse: [
      k => `The willow makes no sound — for a wish like “${k}”, it will not break itself.`,
      k => `The willow does not stir. It would not even hear out the words “${k}”.`,
      k => `It weighed “${k}” in its hand and closed again. The wish was too light.`,
      k => `To “${k}” the willow gives you only silence. Some doors it will not push for you.`
    ],
    fbTwist: [
      k => `The willow snapped. ${k} will be yours — but fate never gives anything away for free.`,
      k => `The willow split at once. ${k} will come, and so will whatever travels beside it.`,
      k => `Broken. ${k} arrives as promised; the price is quietly written down elsewhere.`,
      k => `The moment the willow cracked, ${k} was already on its way — shadow and all.`,
      k => `${k} will happen. But the break is too clean, clean as a signed bargain.`
    ],
    fbGood: [
      k => `The willow breaks softly; the wish about ${k} will arrive right on time.`,
      k => `The willow gave way without protest. For something as small as ${k}, fate cannot be bothered to charge you.`,
      k => `One faint snap, and ${k} is already in your hands. No price this time.`,
      k => `The willow broke lightly. ${k} will come, plainly, as if it always should have.`
    ],
    fbMid: [
      k => `The willow snapped. ${k} will come to you in the end — but fate never gives anything away for free.`,
      k => `The willow snapped. ${k} will move your way for a while, then turn a corner.`,
      k => `Broken. ${k} is not beyond reach; it simply will not look the way you pictured it.`,
      k => `The willow parted as your voice died away. ${k} will come true — true to the letter.`,
      k => `${k} — the willow broke, but it never told you how long you would wait.`
    ]
  }
};
// 两种语言共用的动态文案（彩蛋自带中英文两份，按当前语言取）
const I18N_SHARED = { egg: i => EASTER_EGGS[i][LANG] };

let LANG = 'zh';
try { if (localStorage.getItem('oww-lang') === 'en') LANG = 'en'; } catch (e) { /* 隐私模式下忽略 */ }

// LANG 是模块内可变状态：外部只通过 getter/setter 访问，
// 避免各模块各自缓存一份语言值导致切换后不同步
export function getLang() { return LANG; }
export function setLangValue(lang) { LANG = lang === 'en' ? 'en' : 'zh'; }

// t：取原始文案；tf：取带参数的文案
// 文案值可以是字符串 / 函数模版 / 数组（多条备选，用最后一个参数当下标选取）
export function t(key) {
  const dict = I18N[LANG];
  if (key in dict) return dict[key];
  if (key in I18N_SHARED) return I18N_SHARED[key];
  return I18N.zh[key] ?? key;
}
export function tf(key, ...args) {
  let v = t(key);
  if (Array.isArray(v)) v = v[Math.abs(args[args.length - 1] | 0) % v.length];
  return typeof v === 'function' ? v(...args) : v;
}
