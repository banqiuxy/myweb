/* ============================================================
   彩蛋：写死的关键词 → 固定回答
   优先于字数闸与 AI 裁决（“王昆”只有两字，否则会先被字数闸拒掉）；
   数组顺序即优先级，越具体的放前面（“张雪华爱董勇”必须先于“董勇”）
   ============================================================ */
export const EASTER_EGGS = [
  { re: /张雪华爱董勇/, zh: '华子，我们一起到老吧', en: 'Huazi, let\'s grow old together' },
  { re: /王昆/, zh: '谢谢昆哥！', en: 'Thank you, brother Kun!' },
  { re: /圆悦/, zh: '圆神牛逼！', en: 'Yuan the legend!' },
  { re: /不类/, zh: '1/1000000', en: '1/1000000' },
  { re: /张紫豫/, zh: '回来陪陪我们吧', en: 'Come back and stay with us' },
  { re: /梁伍芳/, zh: '芳，上号啊！', en: 'Fang, get online already!' },
  { re: /我是勇子|勇子|董勇/, zh: '主人，你来了', en: 'Master, you came' },
  { re: /(b\s*站|bilibili|哔哩哔哩)\s*运营/i, zh: '超级优秀无敌棒的运营^_^', en: 'A super excellent, unbeatable operations pro ^_^' },
  { re: /b\s*站|bilibili|哔哩哔哩/i, zh: '哔哩哔哩干杯O(∩_∩)O~', en: 'Bilibili, cheers! O(∩_∩)O~' },
  { re: /妮基/, zh: '受害的不该是你', en: 'You were never the one who deserved to be hurt' },
  { re: /\bniki\b/i, zh: 'Niki，Happy every day！O(∩_∩)O~', en: 'Niki, Happy every day! O(∩_∩)O~' },
  { re: /几米/, zh: '谢谢你几米', en: 'Thank you, Jimi' },
  { re: /大狗叫/, zh: '大狗嚼嚼嚼~', en: 'Big dog chomp chomp chomp~' },
  { re: /[台臺][湾灣].{0,6}回[归歸]|回[归歸].{0,4}祖[国國]|[两兩]岸.{0,4}[统統]一|祖[国國].{0,4}[统統]一|[台臺][湾灣].{0,6}[统統]一|[统統]一.{0,4}[台臺][湾灣]|[台臺][湾灣].{0,4}光[复復]/, zh: '台湾回归！！', en: 'Taiwan returns!!' },
];

// 命中彩蛋返回它在表里的下标（固定文案按当前语言取），未命中返回 -1
export function matchEasterEgg(text) {
  const t = String(text || '');
  return EASTER_EGGS.findIndex(egg => egg.re.test(t));
}
