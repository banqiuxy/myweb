/* ============================================================
 *  MBTI 题库：共 60 题，覆盖四维度(ei/sn/tf/jp)，每维度 15 题，含反向题。
 *  数据来源：委托方（站长）提供。
 *  数据结构：
 *    dim   - 维度键 (ei|sn|tf|jp)
 *    pole  - "同意时倾向的字母"（该维度两极之一，如 'E'）
 *    text  - 题干
 *    rev   - 是否反向题（仅作防惯性标识，不影响计分）
 *  五级计分：
 *    非常同意 v=+2 / 同意 v=+1 / 中立 v=0 / 不同意 v=-1 / 非常不同意 v=-2
 *  每维度累加：pole==左极则 score+=v，pole==右极则 score-=v。
 *  最终 score>0 取左极，score<0 取右极，等于 0 取该维度默认值。
 * ============================================================ */
window.QUESTIONS = [
  // ===== E/I 维度（外向-内向，15题） =====
  { dim: 'ei', pole: 'E', text: '我喜欢在人群中与人交流，并从中获得能量。', rev: false },
  { dim: 'ei', pole: 'E', text: '我通常主动发起对话，而不是等别人先开口。', rev: false },
  { dim: 'ei', pole: 'I', text: '长时间与他人相处后，我需要独处来恢复精力。', rev: true },
  { dim: 'ei', pole: 'E', text: '在聚会中，我倾向于认识新朋友，而不是只和熟人在一起。', rev: false },
  { dim: 'ei', pole: 'I', text: '我更喜欢安静的环境，喧闹的场合会让我感到疲惫。', rev: true },
  { dim: 'ei', pole: 'E', text: '我常常想到什么就说出来，不会反复斟酌。', rev: false },
  { dim: 'ei', pole: 'E', text: '别人通常认为我是一个外向、活跃的人。', rev: false },
  { dim: 'ei', pole: 'I', text: '我更喜欢一个人安静地做事，不太需要他人陪伴。', rev: true },
  { dim: 'ei', pole: 'E', text: '在团队中，我常常是带头说话、推动讨论的人。', rev: false },
  { dim: 'ei', pole: 'E', text: '我更喜欢当面口头交流，而不是用文字沟通。', rev: false },
  { dim: 'ei', pole: 'E', text: '我很容易和陌生人打开话题。', rev: false },
  { dim: 'ei', pole: 'I', text: '社交活动结束后，我常感到精力被消耗，需要独处充电。', rev: true },
  { dim: 'ei', pole: 'E', text: '被他人关注时我感到舒适，也愿意成为注意的焦点。', rev: false },
  { dim: 'ei', pole: 'E', text: '在聚会中我通常是话最多、带动气氛的人。', rev: false },
  { dim: 'ei', pole: 'I', text: '我在熟悉的人面前也偏好安静，不爱热闹。', rev: false },

  // ===== S/N 维度（实感-直觉，15题） =====
  { dim: 'sn', pole: 'S', text: '我更关注事实和细节，而不是抽象的概念。', rev: false },
  { dim: 'sn', pole: 'N', text: '我喜欢思考事物背后可能的意义与联系。', rev: true },
  { dim: 'sn', pole: 'S', text: '我相信经验比想象更可靠。', rev: false },
  { dim: 'sn', pole: 'S', text: '我倾向于按部就班地处理具体事务。', rev: false },
  { dim: 'sn', pole: 'N', text: '我喜欢用比喻和隐喻来表达想法。', rev: true },
  { dim: 'sn', pole: 'S', text: '我更相信经过验证的方法，而非新颖的理论。', rev: false },
  { dim: 'sn', pole: 'N', text: '我常常思考"如果……会怎样"的假设场景。', rev: true },
  { dim: 'sn', pole: 'S', text: '我做事注重实际效果，而非理论上的完美。', rev: false },
  { dim: 'sn', pole: 'N', text: '我对新颖的想法感兴趣，即使它暂时没有实用价值。', rev: true },
  { dim: 'sn', pole: 'S', text: '我更关注当下正在发生的事情。', rev: false },
  { dim: 'sn', pole: 'N', text: '我倾向于从整体和大局出发思考问题。', rev: false },
  { dim: 'sn', pole: 'S', text: '我更喜欢具体可见的信息，而非抽象的描述。', rev: false },
  { dim: 'sn', pole: 'N', text: '我擅长发现事物之间别人容易忽略的联系。', rev: false },
  { dim: 'sn', pole: 'S', text: '我依赖过去的经验来指导现在的决定。', rev: false },
  { dim: 'sn', pole: 'N', text: '我常常被未来的可能性吸引，而非眼前的现实。', rev: false },

  // ===== T/F 维度（理性-感性，15题） =====
  { dim: 'tf', pole: 'T', text: '做决定时，我更看重逻辑而非情感。', rev: false },
  { dim: 'tf', pole: 'F', text: '我会优先考虑我的决定对他人的感受造成的影响。', rev: true },
  { dim: 'tf', pole: 'T', text: '我追求公平与原则，即使这会得罪人。', rev: false },
  { dim: 'tf', pole: 'F', text: '我宁愿维护和谐，也不愿为争论对错而伤感情。', rev: true },
  { dim: 'tf', pole: 'T', text: '我擅长客观分析，不被个人情感左右。', rev: false },
  { dim: 'tf', pole: 'F', text: '我能敏锐地察觉他人情绪的变化。', rev: true },
  { dim: 'tf', pole: 'T', text: '我认为诚实比委婉更重要。', rev: false },
  { dim: 'tf', pole: 'F', text: '当别人倾诉烦恼时，我更倾向于共情而非给出解决方案。', rev: true },
  { dim: 'tf', pole: 'T', text: '我倾向于用统一的标准和规则来衡量事物。', rev: false },
  { dim: 'tf', pole: 'F', text: '我做决定时常常考虑价值观与道德感。', rev: false },
  { dim: 'tf', pole: 'T', text: '我能冷静面对冲突，聚焦于问题本身。', rev: false },
  { dim: 'tf', pole: 'F', text: '我希望我的工作能让他人受益、产生温度。', rev: false },
  { dim: 'tf', pole: 'T', text: '我更看重能力与效率，而非人情。', rev: false },
  { dim: 'tf', pole: 'T', text: '我认为对错应该基于事实，而非个人立场。', rev: false },
  { dim: 'tf', pole: 'F', text: '我容易被他人的情绪感染而感同身受。', rev: false },

  // ===== J/P 维度（计划-随性，15题） =====
  { dim: 'jp', pole: 'J', text: '我喜欢提前制定计划并按计划执行。', rev: false },
  { dim: 'jp', pole: 'P', text: '我更喜欢保持灵活，随时应对变化。', rev: true },
  { dim: 'jp', pole: 'J', text: '我做事有条理，喜欢清单和时间表。', rev: false },
  { dim: 'jp', pole: 'P', text: '我倾向于在最后期限临近时才全力以赴。', rev: true },
  { dim: 'jp', pole: 'J', text: '我不喜欢突发状况，希望事情是可预期的。', rev: false },
  { dim: 'jp', pole: 'P', text: '我享受即兴发挥，而不是按部就班。', rev: true },
  { dim: 'jp', pole: 'J', text: '我习惯早早完成任务，避免临时抱佛脚。', rev: false },
  { dim: 'jp', pole: 'P', text: '我更喜欢开放式的安排，而非固定日程。', rev: true },
  { dim: 'jp', pole: 'J', text: '我喜欢把事情"决定下来"，不喜欢悬而未决。', rev: false },
  { dim: 'jp', pole: 'J', text: '我会为旅行、活动制定详细日程。', rev: false },
  { dim: 'jp', pole: 'P', text: '我喜欢随心所欲地生活，少做计划。', rev: false },
  { dim: 'jp', pole: 'J', text: '我倾向于按既定流程做事。', rev: false },
  { dim: 'jp', pole: 'P', text: '我会根据当时的心情决定做什么，而非遵循计划。', rev: false },
  { dim: 'jp', pole: 'J', text: '我需要清晰的目标和明确的进度。', rev: false },
  { dim: 'jp', pole: 'P', text: '我常常在多个选项间犹豫，保持选项开放。', rev: false }
];