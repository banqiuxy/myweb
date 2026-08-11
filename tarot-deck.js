/* ============================================================
 *  塔罗牌库：完整 78 张（大阿卡纳 22 + 小阿卡纳 56）
 *  每张：中文名 + 英文名。
 *  【注意】牌库为结构占位内容，委托方提供完整牌名后整体替换。
 * ============================================================ */
window.TAROT_DECK = [
  // ---- 大阿卡纳 Major Arcana (22) ----
  { cn: '愚者', en: 'The Fool' },
  { cn: '魔术师', en: 'The Magician' },
  { cn: '女祭司', en: 'The High Priestess' },
  { cn: '皇后', en: 'The Empress' },
  { cn: '皇帝', en: 'The Emperor' },
  { cn: '教皇', en: 'The Hierophant' },
  { cn: '恋人', en: 'The Lovers' },
  { cn: '战车', en: 'The Chariot' },
  { cn: '力量', en: 'Strength' },
  { cn: '隐士', en: 'The Hermit' },
  { cn: '命运之轮', en: 'Wheel of Fortune' },
  { cn: '正义', en: 'Justice' },
  { cn: '倒吊人', en: 'The Hanged Man' },
  { cn: '死神', en: 'Death' },
  { cn: '节制', en: 'Temperance' },
  { cn: '恶魔', en: 'The Devil' },
  { cn: '高塔', en: 'The Tower' },
  { cn: '星星', en: 'The Star' },
  { cn: '月亮', en: 'The Moon' },
  { cn: '太阳', en: 'The Sun' },
  { cn: '审判', en: 'Judgement' },
  { cn: '世界', en: 'The World' },

  // ---- 小阿卡纳 Minor Arcana：权杖 Wands (14) ----
  { cn: '权杖王牌', en: 'Ace of Wands' },
  { cn: '权杖二', en: 'Two of Wands' },
  { cn: '权杖三', en: 'Three of Wands' },
  { cn: '权杖四', en: 'Four of Wands' },
  { cn: '权杖五', en: 'Five of Wands' },
  { cn: '权杖六', en: 'Six of Wands' },
  { cn: '权杖七', en: 'Seven of Wands' },
  { cn: '权杖八', en: 'Eight of Wands' },
  { cn: '权杖九', en: 'Nine of Wands' },
  { cn: '权杖十', en: 'Ten of Wands' },
  { cn: '权杖侍从', en: 'Page of Wands' },
  { cn: '权杖骑士', en: 'Knight of Wands' },
  { cn: '权杖王后', en: 'Queen of Wands' },
  { cn: '权杖国王', en: 'King of Wands' },

  // ---- 小阿卡纳：圣杯 Cups (14) ----
  { cn: '圣杯王牌', en: 'Ace of Cups' },
  { cn: '圣杯二', en: 'Two of Cups' },
  { cn: '圣杯三', en: 'Three of Cups' },
  { cn: '圣杯四', en: 'Four of Cups' },
  { cn: '圣杯五', en: 'Five of Cups' },
  { cn: '圣杯六', en: 'Six of Cups' },
  { cn: '圣杯七', en: 'Seven of Cups' },
  { cn: '圣杯八', en: 'Eight of Cups' },
  { cn: '圣杯九', en: 'Nine of Cups' },
  { cn: '圣杯十', en: 'Ten of Cups' },
  { cn: '圣杯侍从', en: 'Page of Cups' },
  { cn: '圣杯骑士', en: 'Knight of Cups' },
  { cn: '圣杯王后', en: 'Queen of Cups' },
  { cn: '圣杯国王', en: 'King of Cups' },

  // ---- 小阿卡纳：宝剑 Swords (14) ----
  { cn: '宝剑王牌', en: 'Ace of Swords' },
  { cn: '宝剑二', en: 'Two of Swords' },
  { cn: '宝剑三', en: 'Three of Swords' },
  { cn: '宝剑四', en: 'Four of Swords' },
  { cn: '宝剑五', en: 'Five of Swords' },
  { cn: '宝剑六', en: 'Six of Swords' },
  { cn: '宝剑七', en: 'Seven of Swords' },
  { cn: '宝剑八', en: 'Eight of Swords' },
  { cn: '宝剑九', en: 'Nine of Swords' },
  { cn: '宝剑十', en: 'Ten of Swords' },
  { cn: '宝剑侍从', en: 'Page of Swords' },
  { cn: '宝剑骑士', en: 'Knight of Swords' },
  { cn: '宝剑王后', en: 'Queen of Swords' },
  { cn: '宝剑国王', en: 'King of Swords' },

  // ---- 小阿卡纳：星币 Pentacles (14) ----
  { cn: '星币王牌', en: 'Ace of Pentacles' },
  { cn: '星币二', en: 'Two of Pentacles' },
  { cn: '星币三', en: 'Three of Pentacles' },
  { cn: '星币四', en: 'Four of Pentacles' },
  { cn: '星币五', en: 'Five of Pentacles' },
  { cn: '星币六', en: 'Six of Pentacles' },
  { cn: '星币七', en: 'Seven of Pentacles' },
  { cn: '星币八', en: 'Eight of Pentacles' },
  { cn: '星币九', en: 'Nine of Pentacles' },
  { cn: '星币十', en: 'Ten of Pentacles' },
  { cn: '星币侍从', en: 'Page of Pentacles' },
  { cn: '星币骑士', en: 'Knight of Pentacles' },
  { cn: '星币王后', en: 'Queen of Pentacles' },
  { cn: '星币国王', en: 'King of Pentacles' }
];

/* 12 个规范 SVG 图标，用于随机点缀牌面（不使用 emoji） */
window.TAROT_ICONS = [
  '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.6"><line x1="12" y1="21" x2="12" y2="9"/><line x1="12" y1="13" x2="18" y2="4"/><line x1="12" y1="13" x2="6" y2="4"/><line x1="12" y1="9" x2="16" y2="2"/><line x1="12" y1="9" x2="8" y2="2"/></svg>',
  '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3h14v7a7 7 0 0 1-14 0z"/><path d="M5 3v7a7 7 0 0 0 14 0V3"/><path d="M8 3v7a4 4 0 0 0 8 0V3"/><path d="M2 21h20"/></svg>',
  '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg>',
  '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/></svg>',
  '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
  '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2l2.6 5.6L20 8.6l-4 3.9 1 5.8-5-2.7-5 2.7 1-5.8-4-3.9 5.4-1z"/></svg>',
  '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3l1.9 5.7 5.7 1.9-5.7 1.9L12 18l-1.9-5.5L4.4 10.6l5.7-1.9z"/></svg>',
  '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.5"/></svg>',
  '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'
];