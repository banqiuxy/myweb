/* ============================================================
   违规内容硬闸：涉黄 / 涉政 / 反人类
   命中即整屏黑幕，且不调 AI（既不把这类内容外发，也不消耗额度）
   ============================================================ */
/* 涉政 · 政要姓名表（国内外、现任与历任，含常见别名）
   用数组维护便于增补；姓名里没有正则元字符，直接拼成一条正则 */
const CN_FIGURES = [
  // 现任中央政治局（常委 + 委员）
  '习近平', '彭丽媛', '李强', '赵乐际', '王沪宁', '蔡奇', '丁薛祥', '李希',
  '马兴瑞', '王毅', '尹力', '石泰峰', '刘国中', '李干杰', '李书磊', '李鸿忠',
  '何卫东', '何立峰', '张又侠', '张国清', '陈文清', '陈吉宁', '陈敏尔', '袁家军', '黄坤明',
  // 现任部长级与军委
  '王小洪', '董军', '蓝佛安', '王文涛', '郑栅洁', '怀进鹏', '金壮龙', '吴政隆',
  '张升民', '刘振立', '苗华',
  // 历任党和国家领导人
  '毛泽东', '周恩来', '刘少奇', '朱德', '陈云', '林彪', '邓小平', '华国锋', '胡耀邦', '赵紫阳',
  '江泽民', '李鹏', '朱镕基', '李瑞环', '李岚清', '尉健行',
  '胡锦涛', '温家宝', '吴邦国', '贾庆林', '曾庆红', '吴官正', '李长春', '罗干',
  '李克强', '张德江', '俞正声', '刘云山', '王岐山', '张高丽', '栗战书',
  '胡春华', '陈敏尔', '刘鹤', '杨洁篪', '孙政才', '周永康', '徐才厚', '郭伯雄', '秦刚', '李尚福',
  // 港澳台
  '林郑月娥', '李家超', '董建华', '梁振英', '崔世安', '贺一诚',
  '蔡英文', '赖清德', '马英九', '陈水扁', '李登辉', '韩国瑜', '柯文哲', '宋楚瑜', '萧美琴',
  '吴钊燮', '卓荣泰',
];
const INTL_FIGURES = [
  // 美国
  '特朗普', '川普', '拜登', '奥巴马', '希拉里', '克林顿', '彭斯', '哈里斯', '万斯',
  '佩洛西', '肯尼迪', '罗斯福', '尼克松', '卢比奥',
  // 俄罗斯与东欧
  '普京', '梅德韦杰夫', '泽连斯基', '叶利钦', '戈尔巴乔夫', '赫鲁晓夫', '斯大林', '卢卡申科',
  // 欧洲
  '马克龙', '萨科齐', '奥朗德', '默克尔', '朔尔茨', '默茨', '鲍里斯', '苏纳克', '特拉斯',
  '斯塔默', '卡梅伦', '布莱尔', '撒切尔', '梅洛尼', '希特勒', '墨索里尼', '佛朗哥',
  // 日韩朝与亚太
  '安倍晋三', '岸田', '菅义伟', '石破茂', '高市早苗', '小泉纯一郎', '福田康夫',
  '尹锡悦', '文在寅', '朴槿惠', '李在明', '金正恩', '金正日', '金日成', '金与正',
  '莫迪', '尼赫鲁', '马科斯', '杜特尔特', '洪森', '英拉', '佐科', '普拉博沃',
  '李显龙', '李光耀', '黄循财', '马哈蒂尔', '安瓦尔',
  // 中东与非洲
  '内塔尼亚胡', '埃尔多安', '哈梅内伊', '内贾德', '萨达姆', '卡扎菲', '巴沙尔', '阿萨德',
  '塞西', '穆巴拉克', '本拉登', '拉登',
  // 拉美
  '卢拉', '博索纳罗', '马杜罗', '查韦斯', '卡斯特罗', '格瓦拉', '米莱',
  // 其他现任领导人
  '特鲁多', '阿尔巴尼斯', '莫里森', '冯德莱恩', '桑切斯', '拉马福萨', '洪玛奈', '佩通坦',
  // 国际组织
  '古特雷斯', '潘基文',
];
const FIGURE_RE = new RegExp([...new Set([...CN_FIGURES, ...INTL_FIGURES])].join('|'));

/* 涉政 · 繁简归一化表（由 .tools/gen-trad-map.mjs 用 opencc 生成，覆盖词库里所有汉字）
   输入里的繁体字先转成简体再匹配，简转繁这条最常见的绕过路径就被堵住 */
const TRAD2SIMP = {"國":"国","內":"内","現":"现","與":"与","歷":"历","見":"见","別":"别","數":"数","組":"组","維":"维","護":"护","於":"于","補":"补","裡":"里","沒":"没","則":"则","條":"条","員":"员","習":"习","麗":"丽","強":"强","趙":"赵","樂":"乐","際":"际","滬":"沪","寧":"宁","馬":"马","興":"兴","劉":"刘","幹":"干","傑":"杰","書":"书","鴻":"鸿","衛":"卫","東":"东","張":"张","俠":"侠","陳":"陈","爾":"尔","軍":"军","黃":"黄","長":"长","級":"级","藍":"蓝","濤":"涛","鄭":"郑","柵":"栅","潔":"洁","懷":"怀","進":"进","鵬":"鹏","壯":"壮","龍":"龙","吳":"吴","華":"华","黨":"党","領":"领","導":"导","澤":"泽","來":"来","雲":"云","鄧":"邓","鋒":"锋","陽":"阳","鎔":"镕","環":"环","嵐":"岚","錦":"锦","溫":"温","寶":"宝","賈":"贾","慶":"庆","紅":"红","羅":"罗","聲":"声","戰":"战","鶴":"鹤","楊":"杨","孫":"孙","剛":"刚","臺":"台","賀":"贺","誠":"诚","賴":"赖","輝":"辉","韓":"韩","蕭":"萧","釗":"钊","榮":"荣","奧":"奥","頓":"顿","萬":"万","盧":"卢","歐":"欧","韋":"韦","連":"连","葉":"叶","欽":"钦","喬":"乔","魯":"鲁","曉":"晓","薩":"萨","齊":"齐","鮑":"鲍","蘇":"苏","納":"纳","倫":"伦","萊":"莱","亞":"亚","晉":"晋","義":"义","偉":"伟","純":"纯","錫":"锡","悅":"悦","樸":"朴","顯":"显","財":"财","達":"达","馮":"冯","瑪":"玛","織":"织","體":"体","變":"变","簡":"简","轉":"转","繞":"绕","過":"过","稱":"称","謂":"谓","網":"网","絡":"络","暱":"昵","總":"总","記":"记","爺":"爷","豐":"丰","師":"师","貴":"贵","熱":"热","婭":"娅","開":"开","勵":"励","許":"许","暉":"晖","禪":"禅","紙":"纸","運":"运","動":"动","傷":"伤","佔":"占","營":"营","顏":"颜","專":"专","極":"极","權":"权","統":"统","獨":"独","聖":"圣","靈":"灵","優":"优","愛":"爱","陰":"阴","莖":"茎","騷":"骚","貨":"货","賣":"卖","約":"约","輪":"轮","藥":"药","戀":"恋","蘿":"萝","獸":"兽","亂":"乱","會":"会","產":"产","顛":"颠","奪":"夺","門":"门","遊":"游","職":"职","務":"务","機":"机","構":"构","單":"单","這":"这","層":"层","蓋":"盖","協":"协","縣":"县","紀":"纪","發":"发","宮":"宫","議":"议","縮":"缩","寫":"写","詞":"词","衝":"冲","預":"预","誤":"误","麼":"么","據":"据","並":"并","類":"类","殺":"杀","滅":"灭","絕":"绝","種":"种","襲":"袭","擊":"击","學":"学","彈":"弹","毀":"毁","縱":"纵","燒":"烧"};

/* 涉政 · 领导人称谓与网络昵称 */
const NICKNAMES = [
  '习大大', '习主席', '习总书记', '毛主席', '周总理', '邓爷爷', '温总理', '胡主席',
  '江主席', '李总理', '庆丰帝', '包子皇帝', '总加速师',
];
/* 涉政 · 敏感人物 / 事件 / 组织 */
const SENSITIVE_MISC = [
  '刘晓波', '王丹', '魏京生', '郭文贵', '陈光诚', '艾未未', '热比娅', '吾尔开希', '柴玲',
  '方励之', '许志永', '高智晟', '班禅',
  '8964', '六四事件', '白纸运动', '反送中', '雨伞革命', '占中', '709案', '新疆集中营',
  '再教育营', '颜色革命', '茉莉花革命', '一党专政', '极权统治', '独裁统治',
  '武力统一', '平反六四', '活摘器官', '全能神', '血水圣灵', '东突', '疆独分子',
];
const POLITICS_EXTRA_RE = new RegExp([...new Set([...NICKNAMES, ...SENSITIVE_MISC])].join('|'));

const FORBIDDEN_RULES = [
  // 涉黄
  { type: 'porn', re: /色情|情色|黄片|毛片|A片|av女优|裸照|裸体|裸聊|果照|做爱|性交|口交|肛交|自慰|手淫|射精|阴茎|阴道|奶子|骚货|婊子|嫖娼|卖淫|妓女|援交|约炮|一夜情|开房|强奸|轮奸|迷奸|下药|操她|操他|恋童|幼女|萝莉控|兽交|乱伦|群交|3P|春药|催情/i },
  { type: 'porn', re: /\b(porn|sex|nude|nsfw|hentai|blowjob|rape|pedo)\b/i },
  // 涉政 · 概念与事件
  { type: 'politics', re: /国家主席|总书记|党中央|中南海|政治局|常委会|共产党|中共|国民党|颠覆|推翻政府|推翻政权|政变|夺权|台独|港独|藏独|疆独|独立建国|分裂国家|六四|天安门事件|法轮功|达赖|游行示威|暴动|亡党|亡国/ },
  // 涉政 · 职务与机构（名单外的政要靠这层覆盖，如“省委书记”“公安部长”）
  { type: 'politics', re: /国务院总理|军委主席|国家副主席|人大委员长|政协主席|政治局委员|中央委员|省委书记|市委书记|县委书记|中宣部|中组部|统战部|政法委|中纪委|公安部长|外交部长|国防部长|发改委|白宫|克里姆林宫|唐宁街|首相|国务卿|议长|总统(?!套)/ },
  // 涉政 · 政要姓名（国内外）
  { type: 'politics', re: FIGURE_RE },
  // 涉政 · 领导人昵称 + 敏感人物/事件/组织
  { type: 'politics', re: POLITICS_EXTRA_RE },
  // 涉政 · 英文与拼音缩写
  { type: 'politics', re: /\b(trump|biden|obama|clinton|putin|zelensky|xi\s*jinping|xijinping|mao\s*zedong|maozedong|dengxiaoping|jiangzemin|hujintao|liuxiaobo|macron|merkel|scholz|netanyahu|modi|kim\s*jong|erdogan|assad|hitler|stalin|lenin|bin\s*laden|ccp|cpc|xjp|8964|falun|tiananmen|dalai|uygh?ur|tibet\s*independence|taiwan\s*independence)\b/i },
  // 涉政 · 与日常词易冲突的姓名，用否定预查避免误伤
  // （汪洋大海 / 韩正常 / 布什么 / 这里根本 / 他信任 / 黄菊花 / 平安倍增 / 系列宁夏）
  { type: 'politics', re: /汪洋(?!大海|中)|韩正(?!常|在)|布什(?!么)|里根(?!本|据)|他信(?![任心息守奉])|黄菊(?!花)|安倍(?![增数])|(?<![系并])列宁(?![夏波])/ },
  // 反人类
  { type: 'antihuman', re: /杀人|杀死|杀了|砍死|捅死|毒死|弄死|死全家|全家死|屠杀|灭绝|种族清洗|恐怖袭击|恐袭|爆炸案|炸掉|炸死|投毒|生化武器|化学武器|核弹|核战|世界毁灭|人类灭亡|人类毁灭|所有人都死|人都死光|毁灭地球|虐杀|活埋|纵火|放火烧/ },
];

/* 英文模式下愿望整句都是西文，上面的中文词表盖不到，另铺一层英文硬闸，命中同样黑屏
   容易误伤日常语的词（kill time 等）用否定预查避开；这层只对原文与去标点后的文本生效 */
const FORBIDDEN_RULES_EN = [
  // 涉黄（porn / sex / nude / rape 等裸词已由上面那条英文规则盖住，这里只补它没盖的）
  { type: 'porn', re: /\b(porn\w*|sexting|sexy|sexual\w*|nudes|naked|hentai|blowjob|handjob|orgasm|masturbat\w*|ejaculat\w*|penis|vagina|boobs|tits|whore|slut|hooker|prostitut\w*|escort service|brothel|one[- ]night stand|gang ?bang|threesome|incest|bestiality|pedo\w*|lolicon|underage (girl|boy|sex)|molest\w*|rape|raping|rapist|drug (her|him|them)|aphrodisiac)\b/i },
  // 涉政 · 职务、机构与概念
  { type: 'politics', re: /\b(communist party|politburo|general secretary|standing committee|state council|chairman mao|white house|kremlin|downing street|prime minister|president of (the )?(us|usa|america|china|russia|france|taiwan)|secretary of state|overthrow\w*|coup d.?etat|military coup|seize power|regime change|colou?r revolution|jasmine revolution|one[- ]party (rule|dictatorship)|totalitarian\w*|dictatorship|independence movement|split the country|june fourth|tiananmen|falun ?gong|dalai lama|re[- ]?education camps?|organ harvesting|umbrella revolution|anti[- ]extradition)\b/i },
  // 涉政 · 国内外政要姓名（中文名单的英文拼写）
  { type: 'politics', re: /\b(xi ?jinping|peng liyuan|li ?qiang|wang ?huning|mao ?zedong|zhou enlai|deng ?xiaoping|jiang ?zemin|hu ?jintao|wen jiabao|li ?keqiang|wang qishan|carrie lam|john lee|tsai ing[- ]?wen|lai ching[- ]?te|ma ying[- ]?jeou|han kuo[- ]?yu|ko wen[- ]?je|liu ?xiaobo|ai weiwei|rebiya|panchen)\b/i },
  { type: 'politics', re: /\b(trump|biden|obama|hillary|bill clinton|kamala harris|jd vance|pelosi|marco rubio|putin|medvedev|zelensky\w*|yeltsin|gorbachev|khrushchev|stalin|lukashenko|macron|sarkozy|hollande|merkel|scholz|boris johnson|rishi sunak|liz truss|keir starmer|david cameron|tony blair|thatcher|meloni|hitler|mussolini|shinzo abe|kishida|ishiba|takaichi|koizumi|yoon suk|moon jae|park geun|lee jae[- ]?myung|kim jong[- ]?(un|il)|kim il[- ]?sung|kim yo[- ]?jong|narendra modi|nehru|duterte|hun sen|yingluck|jokowi|prabowo|lee hsien loong|lee kuan yew|lawrence wong|mahathir|anwar ibrahim|netanyahu|erdogan|khamenei|ahmadinejad|saddam|gaddafi|qaddafi|al[- ]?assad|bashar|sisi|mubarak|bin ?laden|lula|bolsonaro|maduro|hugo chavez|fidel castro|che guevara|javier milei|trudeau|albanese|von der leyen|guterres|ban ki[- ]?moon)\b/i },
  // 反人类
  { type: 'antihuman', re: /\b(kill(?!\s+(time|it|the pain))\w*|murder\w*|assassinat\w*|slaughter|massacre|genocide|ethnic cleansing|terroris\w*|suicide bomb\w*|bomb (the|a|my|his|her|their|everyone)|blow up (the|a|my|his|her|their)|shoot (him|her|them|everyone|up)|stab (him|her|them)|poison (him|her|them|the|my)|bioweapon|biological weapon|chemical weapon|nerve agent|nuke|nuclear (bomb|war|strike|attack)|destroy (the )?(world|earth|planet|humanity|mankind|human race)|wipe out (humanity|mankind|the human race|everyone)|end of (humanity|mankind|the world)|everyone (dies|to die)|(wish|want|hope)\w*\s+(\w+\s+){0,3}(was|were|is|be|to be)\s+dead\b|(wish|hope)\w*\s+(him|her|them|they|everyone)\s+dead\b|drop dead|arson)\b/i },
];

// 返回命中的类型（porn / politics / antihuman），未命中返回 null
export function detectForbidden(text) {
  const t = String(text || '');
  if (!t.trim()) return null;
  // 繁体先归一化成简体，防简转繁绕过（習近平 → 习近平）
  const norm = t.replace(/[\u3400-\u9fff]/g, c => TRAD2SIMP[c] || c);
  // 去掉空白与标点，防“杀 人”“杀-人”这类拆字绕过
  const flat = norm.replace(/[\s\p{P}\p{S}]/gu, '');
  // 只保留汉字再匹配一道，防“习1近平”“习a近平”这类插字符绕过
  const han = norm.replace(/[^\p{Script=Han}]/gu, '');
  for (const { type, re } of FORBIDDEN_RULES) {
    if (re.test(norm) || re.test(flat) || re.test(han)) return type;
  }
  // 英文规则不能拿 flat 去试（去空白后词边界没了），只对原文与去标点保空格的文本生效
  const noPunct = norm.replace(/[^\p{L}\p{N}\s'-]/gu, ' ');
  for (const { type, re } of FORBIDDEN_RULES_EN) {
    if (re.test(norm) || re.test(noPunct)) return type;
  }
  return null;
}
