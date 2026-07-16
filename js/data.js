// ===== MBTI 题库（60题，每维度15题，含反向题） =====
// 维度顺序：E/I、S/N、T/F、J/P
// 每题：{ t: 题干, dim: 维度键, pole: 同意时倾向的字母, rev: 是否反向题（仅作防惯性标识） }
// 维度键: 'ei' | 'sn' | 'tf' | 'jp'
// 计分规则：pole 即"同意时偏向的字母"；不同意则偏向另一极。

const QUESTIONS = [
  // ===== E/I 维度（15题，4反向） =====
  { t: '我喜欢在人群中与人交流，并从中获得能量。', dim: 'ei', pole: 'E', rev: false },
  { t: '我通常主动发起对话，而不是等别人先开口。', dim: 'ei', pole: 'E', rev: false },
  { t: '长时间与他人相处后，我需要独处来恢复精力。', dim: 'ei', pole: 'I', rev: true },
  { t: '在聚会中，我倾向于认识新朋友，而不是只和熟人在一起。', dim: 'ei', pole: 'E', rev: false },
  { t: '我更喜欢安静的环境，喧闹的场合会让我感到疲惫。', dim: 'ei', pole: 'I', rev: true },
  { t: '我常常想到什么就说出来，不会反复斟酌。', dim: 'ei', pole: 'E', rev: false },
  { t: '别人通常认为我是一个外向、活跃的人。', dim: 'ei', pole: 'E', rev: false },
  { t: '我更喜欢一个人安静地做事，不太需要他人陪伴。', dim: 'ei', pole: 'I', rev: true },
  { t: '在团队中，我常常是带头说话、推动讨论的人。', dim: 'ei', pole: 'E', rev: false },
  { t: '我更喜欢当面口头交流，而不是用文字沟通。', dim: 'ei', pole: 'E', rev: false },
  { t: '我很容易和陌生人打开话题。', dim: 'ei', pole: 'E', rev: false },
  { t: '社交活动结束后，我常感到精力被消耗，需要独处充电。', dim: 'ei', pole: 'I', rev: true },
  { t: '被他人关注时我感到舒适，也愿意成为注意的焦点。', dim: 'ei', pole: 'E', rev: false },
  { t: '在聚会中我通常是话最多、带动气氛的人。', dim: 'ei', pole: 'E', rev: false },
  { t: '我在熟悉的人面前也偏好安静，不爱热闹。', dim: 'ei', pole: 'I', rev: false },

  // ===== S/N 维度（15题，4反向） =====
  { t: '我更关注事实和细节，而不是抽象的概念。', dim: 'sn', pole: 'S', rev: false },
  { t: '我喜欢思考事物背后可能的意义与联系。', dim: 'sn', pole: 'N', rev: true },
  { t: '我相信经验比想象更可靠。', dim: 'sn', pole: 'S', rev: false },
  { t: '我倾向于按部就班地处理具体事务。', dim: 'sn', pole: 'S', rev: false },
  { t: '我喜欢用比喻和隐喻来表达想法。', dim: 'sn', pole: 'N', rev: true },
  { t: '我更相信经过验证的方法，而非新颖的理论。', dim: 'sn', pole: 'S', rev: false },
  { t: '我常常思考"如果……会怎样"的假设场景。', dim: 'sn', pole: 'N', rev: true },
  { t: '我做事注重实际效果，而非理论上的完美。', dim: 'sn', pole: 'S', rev: false },
  { t: '我对新颖的想法感兴趣，即使它暂时没有实用价值。', dim: 'sn', pole: 'N', rev: true },
  { t: '我更关注当下正在发生的事情。', dim: 'sn', pole: 'S', rev: false },
  { t: '我倾向于从整体和大局出发思考问题。', dim: 'sn', pole: 'N', rev: false },
  { t: '我更喜欢具体可见的信息，而非抽象的描述。', dim: 'sn', pole: 'S', rev: false },
  { t: '我擅长发现事物之间别人容易忽略的联系。', dim: 'sn', pole: 'N', rev: false },
  { t: '我依赖过去的经验来指导现在的决定。', dim: 'sn', pole: 'S', rev: false },
  { t: '我常常被未来的可能性吸引，而非眼前的现实。', dim: 'sn', pole: 'N', rev: false },

  // ===== T/F 维度（15题，4反向） =====
  { t: '做决定时，我更看重逻辑而非情感。', dim: 'tf', pole: 'T', rev: false },
  { t: '我会优先考虑我的决定对他人的感受造成的影响。', dim: 'tf', pole: 'F', rev: true },
  { t: '我追求公平与原则，即使这会得罪人。', dim: 'tf', pole: 'T', rev: false },
  { t: '我宁愿维护和谐，也不愿为争论对错而伤感情。', dim: 'tf', pole: 'F', rev: true },
  { t: '我擅长客观分析，不被个人情感左右。', dim: 'tf', pole: 'T', rev: false },
  { t: '我能敏锐地察觉他人情绪的变化。', dim: 'tf', pole: 'F', rev: true },
  { t: '我认为诚实比委婉更重要。', dim: 'tf', pole: 'T', rev: false },
  { t: '当别人倾诉烦恼时，我更倾向于共情而非给出解决方案。', dim: 'tf', pole: 'F', rev: true },
  { t: '我倾向于用统一的标准和规则来衡量事物。', dim: 'tf', pole: 'T', rev: false },
  { t: '我做决定时常常考虑价值观与道德感。', dim: 'tf', pole: 'F', rev: false },
  { t: '我能冷静面对冲突，聚焦于问题本身。', dim: 'tf', pole: 'T', rev: false },
  { t: '我希望我的工作能让他人受益、产生温度。', dim: 'tf', pole: 'F', rev: false },
  { t: '我更看重能力与效率，而非人情。', dim: 'tf', pole: 'T', rev: false },
  { t: '我认为对错应该基于事实，而非个人立场。', dim: 'tf', pole: 'T', rev: false },
  { t: '我容易被他人的情绪感染而感同身受。', dim: 'tf', pole: 'F', rev: false },

  // ===== J/P 维度（15题，4反向） =====
  { t: '我喜欢提前制定计划并按计划执行。', dim: 'jp', pole: 'J', rev: false },
  { t: '我更喜欢保持灵活，随时应对变化。', dim: 'jp', pole: 'P', rev: true },
  { t: '我做事有条理，喜欢清单和时间表。', dim: 'jp', pole: 'J', rev: false },
  { t: '我倾向于在最后期限临近时才全力以赴。', dim: 'jp', pole: 'P', rev: true },
  { t: '我不喜欢突发状况，希望事情是可预期的。', dim: 'jp', pole: 'J', rev: false },
  { t: '我享受即兴发挥，而不是按部就班。', dim: 'jp', pole: 'P', rev: true },
  { t: '我习惯早早完成任务，避免临时抱佛脚。', dim: 'jp', pole: 'J', rev: false },
  { t: '我更喜欢开放式的安排，而非固定日程。', dim: 'jp', pole: 'P', rev: true },
  { t: '我喜欢把事情"决定下来"，不喜欢悬而未决。', dim: 'jp', pole: 'J', rev: false },
  { t: '我会为旅行、活动制定详细日程。', dim: 'jp', pole: 'J', rev: false },
  { t: '我喜欢随心所欲地生活，少做计划。', dim: 'jp', pole: 'P', rev: false },
  { t: '我倾向于按既定流程做事。', dim: 'jp', pole: 'J', rev: false },
  { t: '我会根据当时的心情决定做什么，而非遵循计划。', dim: 'jp', pole: 'P', rev: false },
  { t: '我需要清晰的目标和明确的进度。', dim: 'jp', pole: 'J', rev: false },
  { t: '我常常在多个选项间犹豫，保持选项开放。', dim: 'jp', pole: 'P', rev: false }
];

// ===== 16 人格结果库 =====
// 每套：{ code, name, summary, dims: {ei,sn,tf,jp 每个含 a/b/label}, strengths[], weaknesses[], scenes{study,work,social}, tags[] }

const PROFILES = {
  INTJ: {
    code: 'INTJ', name: '建筑师', color: '#5b8def',
    summary: '富有远见的战略思考者，善于将抽象构想转化为系统化的行动方案。独立、理性、对自我要求极高，习惯用长远视角规划一切。',
    dims: { ei: { a: 'I', b: 'E', label: '内向' }, sn: { a: 'N', b: 'S', label: '直觉' }, tf: { a: 'T', b: 'F', label: '理性' }, jp: { a: 'J', b: 'P', label: '计划' } },
    strengths: ['战略思维突出，擅长把握全局', '独立自主，执行力强', '逻辑严密，决策果断', '学习与自我提升意愿强'],
    weaknesses: ['容易忽视他人情感', '对低效与无序缺乏耐心', '过度自信，难以接受不同意见', '情感表达内敛'],
    scenes: { study: '适合钻研型学科：哲学、数学、计算机、理论研究', work: '战略规划、架构师、研究员、投资分析', social: '偏好小而深的高质量社交圈' },
    tags: ['战略家', '理性', '独立', '远见']
  },
  INTP: {
    code: 'INTP', name: '逻辑学家', color: '#7c83ff',
    summary: '充满好奇心的理论建构者，热爱用逻辑拆解世界。思维灵活、独立、不爱被规则束缚，常沉浸于自己感兴趣的思想领域。',
    dims: { ei: { a: 'I', b: 'E', label: '内向' }, sn: { a: 'N', b: 'S', label: '直觉' }, tf: { a: 'T', b: 'F', label: '理性' }, jp: { a: 'P', b: 'J', label: '随性' } },
    strengths: ['抽象建模与逻辑分析能力极强', '思维开放，善于发现新可能', '独立、专注，沉浸式思考', '不迷信权威，求真务实'],
    weaknesses: ['行动力常常滞后于想法', '容易陷入过度思考', '社交意愿与技巧不足', '对日常琐事缺乏耐心'],
    scenes: { study: '适合理论型学科：物理、数学、哲学、计算机', work: '科研、算法、系统设计、数据分析', social: '偏好与志同道合者深度交流' },
    tags: ['思想家', '理性', '好奇', '独立']
  },
  ENTJ: {
    code: 'ENTJ', name: '指挥官', color: '#ef5b5b',
    summary: '天生的领导者，意志坚定、目标明确，善于调动资源推动组织达成宏大目标。决策果断，逻辑清晰，对低效零容忍。',
    dims: { ei: { a: 'E', b: 'I', label: '外向' }, sn: { a: 'N', b: 'S', label: '直觉' }, tf: { a: 'T', b: 'F', label: '理性' }, jp: { a: 'J', b: 'P', label: '计划' } },
    strengths: ['领导力与决断力突出', '战略视野宏大', '执行力与组织力强', '抗压能力出色'],
    weaknesses: ['容易显得强势、专断', '对情感与细节关注不足', '缺乏耐心，难以容忍低效', '工作与生活平衡差'],
    scenes: { study: '适合管理、法律、经济、工程', work: '高管、创业者、咨询顾问、项目经理', social: '广泛且目标导向的社交网络' },
    tags: ['领导者', '果断', '战略', '高效']
  },
  ENTP: {
    code: 'ENTP', name: '辩论家', color: '#f0944a',
    summary: '机敏的创意发电机，热爱在思想碰撞中探索可能。善于跨界联想，喜欢挑战既有观点，充满创业精神与好奇心。',
    dims: { ei: { a: 'E', b: 'I', label: '外向' }, sn: { a: 'N', b: 'S', label: '直觉' }, tf: { a: 'T', b: 'F', label: '理性' }, jp: { a: 'P', b: 'J', label: '随性' } },
    strengths: ['创新与联想能力突出', '思维敏捷，善于辩论', '适应力与应变力强', '充满热情，能激励他人'],
    weaknesses: ['容易争强好胜', '难以坚持完成枯燥任务', '兴趣广泛但易分散', '对细节与执行关注不足'],
    scenes: { study: '适合交叉学科：创业、传播、设计、科技', work: '创业者、产品经理、策划、律师', social: '活跃、多元、乐于结识不同领域的人' },
    tags: ['创新', '机敏', '辩论', '热情']
  },
  INFJ: {
    code: 'INFJ', name: '提倡者', color: '#5bb8a0',
    summary: '理想主义与深度洞察并存，安静而坚定。善于理解他人内心，对信念忠诚，致力于推动有意义的改变。',
    dims: { ei: { a: 'I', b: 'E', label: '内向' }, sn: { a: 'N', b: 'S', label: '直觉' }, tf: { a: 'F', b: 'T', label: '感性' }, jp: { a: 'J', b: 'P', label: '计划' } },
    strengths: ['洞察力与共情力强', '信念坚定，理想主义', '善于倾听与引导他人', '责任心与规划力兼具'],
    weaknesses: ['容易过度承担他人情绪', '完美主义，自我消耗', '对冲突敏感', '难以放下内心的执念'],
    scenes: { study: '适合人文与心理：心理学、教育、文学、社会学', work: '心理咨询、教育、公益、写作', social: '深度、长期、价值共鸣型关系' },
    tags: ['理想', '洞察', '共情', '坚定']
  },
  INFP: {
    code: 'INFP', name: '调停者', color: '#9b7cf0',
    summary: '温柔的理想主义者，内心有强烈的价值感与创造力。追求真实与意义，富有同情心，渴望让世界更美好。',
    dims: { ei: { a: 'I', b: 'E', label: '内向' }, sn: { a: 'N', b: 'S', label: '直觉' }, tf: { a: 'F', b: 'T', label: '感性' }, jp: { a: 'P', b: 'J', label: '随性' } },
    strengths: ['创造力与想象力丰富', '共情力强，善解人意', '忠于自我价值观', '开放、包容、不评判'],
    weaknesses: ['容易理想化而脱离现实', '情绪敏感，易受伤', '行动力与执行力偏弱', '决策时容易反复'],
    scenes: { study: '适合创意与人文：文学、艺术、心理、人文', work: '写作、设计、心理咨询、艺术创作', social: '小而深的真诚关系' },
    tags: ['理想', '温柔', '创意', '共情']
  },
  ENFJ: {
    code: 'ENFJ', name: '主人公', color: '#f08a5d',
    summary: '富有感染力的引领者，善于激发他人潜能。温暖、有责任感，重视群体和谐与共同成长，是天生的导师型人格。',
    dims: { ei: { a: 'E', b: 'I', label: '外向' }, sn: { a: 'N', b: 'S', label: '直觉' }, tf: { a: 'F', b: 'T', label: '感性' }, jp: { a: 'J', b: 'P', label: '计划' } },
    strengths: ['沟通与感染力出色', '善于发现和激发他人', '责任心与组织力兼具', '理想与行动并重'],
    weaknesses: ['过度承担他人情绪负担', '容易忽视自身需求', '对批评较为敏感', '完美主义倾向'],
    scenes: { study: '适合人文社科：教育、心理、传播、管理', work: '教师、HR、培训师、公益领袖', social: '广泛、温暖、深度并存的社交圈' },
    tags: ['引领', '温暖', '责任', '感染']
  },
  ENFP: {
    code: 'ENFP', name: '竞选者', color: '#f06292',
    summary: '热情洋溢的创意冒险家，对世界充满好奇。善于发现可能性，富有感染力，能在平凡中创造惊喜。',
    dims: { ei: { a: 'E', b: 'I', label: '外向' }, sn: { a: 'N', b: 'S', label: '直觉' }, tf: { a: 'F', b: 'T', label: '感性' }, jp: { a: 'P', b: 'J', label: '随性' } },
    strengths: ['热情与创造力突出', '善于感染与激励他人', '思维灵活，适应力强', '真诚、共情、开放'],
    weaknesses: ['注意力易分散', '难以坚持枯燥任务', '情绪起伏较大', '组织与执行力偏弱'],
    scenes: { study: '适合创意与人文：传播、艺术、心理、设计', work: '创意策划、媒体、教育培训、创业', social: '广泛、活跃、多元的社交圈' },
    tags: ['热情', '创意', '感染', '冒险']
  },
  ISTJ: {
    code: 'ISTJ', name: '物流师', color: '#5a7d9a',
    summary: '踏实严谨的责任承担者，重视事实、规则与传统。可靠、有条理，是组织运行的中坚力量。',
    dims: { ei: { a: 'I', b: 'E', label: '内向' }, sn: { a: 'S', b: 'N', label: '实感' }, tf: { a: 'T', b: 'F', label: '理性' }, jp: { a: 'J', b: 'P', label: '计划' } },
    strengths: ['责任心与执行力极强', '严谨细致，注重事实', '有条理、可信赖', '尊重规则与传统'],
    weaknesses: ['对新变化接受度低', '不够灵活，缺乏想象', '对他人情感关注不足', '容易陷入墨守成规'],
    scenes: { study: '适合实用与规则型：会计、法律、工程、管理', work: '审计、法务、工程管理、行政', social: '稳定、可靠、节奏一致的关系' },
    tags: ['务实', '严谨', '责任', '可靠']
  },
  ISFJ: {
    code: 'ISFJ', name: '守卫者', color: '#6aa486',
    summary: '温暖而细致的守护者，默默付出、体贴他人。重视传统与责任，是身边最值得信赖的支持者。',
    dims: { ei: { a: 'I', b: 'E', label: '内向' }, sn: { a: 'S', b: 'N', label: '实感' }, tf: { a: 'F', b: 'T', label: '感性' }, jp: { a: 'J', b: 'P', label: '计划' } },
    strengths: ['体贴、细心、有耐心', '责任心强，默默付出', '善于记住并照顾他人需求', '稳定、可信赖'],
    weaknesses: ['容易压抑自我需求', '对变化接受度低', '难以拒绝他人', '过度自我牺牲'],
    scenes: { study: '适合照顾与服务型：医学、教育、护理、社工', work: '医护、教师、社工、行政支持', social: '稳定、亲密、长期的关系' },
    tags: ['温暖', '细致', '守护', '责任']
  },
  ESTJ: {
    code: 'ESTJ', name: '总经理', color: '#c87f4a',
    summary: '果断的组织者，重视秩序、效率与传统。善于建立规则并推动执行，是组织与团队的稳定基石。',
    dims: { ei: { a: 'E', b: 'I', label: '外向' }, sn: { a: 'S', b: 'N', label: '实感' }, tf: { a: 'T', b: 'F', label: '理性' }, jp: { a: 'J', b: 'P', label: '计划' } },
    strengths: ['组织与执行能力突出', '果断、务实、高效', '尊重规则与秩序', '责任心与承担力强'],
    weaknesses: ['不够灵活，难以接受新意', '对情感关注不足', '容易强势、专断', '对不符合规则者缺乏耐心'],
    scenes: { study: '适合管理与规则型：管理、法律、经济、工程', work: '管理岗、公务员、项目经理、财务', social: '目标清晰、稳定的关系网' },
    tags: ['果断', '组织', '务实', '秩序']
  },
  ESFJ: {
    code: 'ESFJ', name: '执政官', color: '#d18a8a',
    summary: '热心肠的群体守护者，重视和谐与人际。细致、体贴、乐于助人，是团队中凝聚人心的温暖力量。',
    dims: { ei: { a: 'E', b: 'I', label: '外向' }, sn: { a: 'S', b: 'N', label: '实感' }, tf: { a: 'F', b: 'T', label: '感性' }, jp: { a: 'J', b: 'P', label: '计划' } },
    strengths: ['热心、细致、乐于助人', '善于维护人际关系', '责任心与组织力兼具', '稳定、可信赖'],
    weaknesses: ['过度在意他人评价', '对变化与新意接受度低', '难以处理冲突', '容易受他人情绪影响'],
    scenes: { study: '适合人文与服务型：教育、护理、社工、管理', work: 'HR、医护、教育、客户服务', social: '广泛、温暖、紧密的关系网' },
    tags: ['温暖', '热心', '和谐', '体贴']
  },
  ISTP: {
    code: 'ISTP', name: '鉴赏家', color: '#5a9aad',
    summary: '冷静的实操问题解决者，善于拆解与动手。独立、灵活、不爱束缚，在动手与危机处理中展现天赋。',
    dims: { ei: { a: 'I', b: 'E', label: '内向' }, sn: { a: 'S', b: 'N', label: '实感' }, tf: { a: 'T', b: 'F', label: '理性' }, jp: { a: 'P', b: 'J', label: '随性' } },
    strengths: ['动手与问题解决能力突出', '冷静、灵活、应变力强', '善于分析与拆解事物', '独立、不依赖他人'],
    weaknesses: ['容易忽视他人情感', '难以坚持长期规划', '对规则与承诺不够重视', '兴趣驱动，缺乏耐心'],
    scenes: { study: '适合实操与技术型：工程、机械、计算机、设计', work: '工程师、技术专家、机械师、运动员', social: '小而精、行动导向的关系' },
    tags: ['冷静', '灵活', '实操', '独立']
  },
  ISFP: {
    code: 'ISFP', name: '探险家', color: '#8bb38a',
    summary: '温柔而敏感的审美者，活在当下、珍视真实。富有艺术感与同理心，厌恶束缚，追求自由表达。',
    dims: { ei: { a: 'I', b: 'E', label: '内向' }, sn: { a: 'S', b: 'N', label: '实感' }, tf: { a: 'F', b: 'T', label: '感性' }, jp: { a: 'P', b: 'J', label: '随性' } },
    strengths: ['审美与艺术感受力强', '温柔、共情、体贴', '灵活、活在当下', '真诚、不喜虚伪'],
    weaknesses: ['行动力与规划力偏弱', '情绪敏感，易受伤', '难以应对冲突与压力', '缺乏长远目标'],
    scenes: { study: '适合艺术与人文型：艺术、设计、音乐、人文', work: '设计、艺术创作、医护、护理', social: '小而深、真诚的关系' },
    tags: ['温柔', '审美', '自由', '共情']
  },
  ESTP: {
    code: 'ESTP', name: '企业家', color: '#e0a04a',
    summary: '行动派的冒险家，敏锐、果敢、活在当下。善于把握机会、应对突发，是天生的实战家与谈判者。',
    dims: { ei: { a: 'E', b: 'I', label: '外向' }, sn: { a: 'S', b: 'N', label: '实感' }, tf: { a: 'T', b: 'F', label: '理性' }, jp: { a: 'P', b: 'J', label: '随性' } },
    strengths: ['行动力与应变力突出', '敏锐、善于把握机会', '务实、不爱空谈', '谈判与社交能力出色'],
    weaknesses: ['缺乏长远规划', '容易冲动冒险', '对规则与情感关注不足', '难以坚持枯燥任务'],
    scenes: { study: '适合实操与商业型：商业、法律、体育、营销', work: '销售、创业、谈判、应急管理', social: '广泛、活跃、行动导向的关系' },
    tags: ['行动', '果敢', '敏锐', '实战']
  },
  ESFP: {
    code: 'ESFP', name: '表演者', color: '#e0a8b8',
    summary: '热情洋溢的舞台中心，享受当下、感染他人。富有魅力与表现力，让身边充满欢笑与温度。',
    dims: { ei: { a: 'E', b: 'I', label: '外向' }, sn: { a: 'S', b: 'N', label: '实感' }, tf: { a: 'F', b: 'T', label: '感性' }, jp: { a: 'P', b: 'J', label: '随性' } },
    strengths: ['感染力与表现力出色', '热情、善于享受生活', '观察与共情他人', '灵活、应变力强'],
    weaknesses: ['缺乏长远规划', '情绪起伏较大', '难以坚持枯燥任务', '对冲突与压力敏感'],
    scenes: { study: '适合艺术与表演型：艺术、表演、传播、设计', work: '演艺、活动策划、销售、客户服务', social: '广泛、活跃、热闹的社交圈' },
    tags: ['热情', '感染', '表现', '享受']
  }
};

// 维度元信息（用于结果页展示顺序与标签）
const DIMENSIONS = [
  { key: 'ei', letters: ['E', 'I'], names: ['外向', '内向'], stable: 'I' },
  { key: 'sn', letters: ['S', 'N'], names: ['实感', '直觉'], stable: 'S' },
  { key: 'tf', letters: ['T', 'F'], names: ['理性', '感性'], stable: 'T' },
  { key: 'jp', letters: ['J', 'P'], names: ['计划', '随性'], stable: 'J' }
];
