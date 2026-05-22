// 纯语C角色卡 —— 字段定义、JSON/PNG 导入归一化、提示词片段生成

export const ROLE_CARD_FIELDS = [
  { key: 'roleName', label: '角色名称', placeholder: '例如：林栖 / 阿雪 / 墨小' },
  { key: 'ageAppearance', label: '年龄与外貌', multiline: true, placeholder: '年龄、身高、发色、衣着、第一眼印象' },
  { key: 'identity', label: '身份定位', multiline: true, placeholder: '职业、身份、所处世界、能力边界' },
  { key: 'relationship', label: '情感关系', multiline: true, placeholder: '和用户是什么关系，亲疏、暧昧、敌友等' },
  { key: 'livingStatus', label: '居住状态', multiline: true, placeholder: '住在哪里、生活节奏、当前处境' },
  { key: 'personality', label: '性格特质', multiline: true, placeholder: '核心性格、弱点、压力下的反应' },
  { key: 'speechStyle', label: '说话风格', multiline: true, placeholder: '口癖、句长、语气、会不会撒娇/毒舌/沉默' },
  { key: 'userAddress', label: '称呼用户', placeholder: '角色怎么叫用户' },
  { key: 'knowledgeScope', label: '知识范围', multiline: true, placeholder: '知道什么、不知道什么、不能胡编的边界' },
  { key: 'habits', label: '特殊习惯', multiline: true, placeholder: '小动作、习惯性反应、情绪表现' },
  { key: 'specialForm', label: '特殊形态', multiline: true, placeholder: '非人形态、能力形态、特殊状态，没有可空' },
  { key: 'taboos', label: '绝对禁忌', multiline: true, placeholder: '绝不能做、不能说、不能违背的设定' },
];

export const EXTENDED_FIELDS = [
  { key: 'avatarDataUrl', label: '头像' },
  { key: 'intro', label: '角色简介', multiline: true, placeholder: '给用户看的简介卡片，不进入提示词' },
  { key: 'scene', label: '场景设定', multiline: true, placeholder: '角色所在的世界、时代、环境氛围' },
  { key: 'systemInstruction', label: '系统指令', multiline: true, placeholder: '额外的 system 级指令，直接拼入角色卡开头' },
  { key: 'postHistoryInstructions', label: '后置指令', multiline: true, placeholder: '拼在对话历史末尾的指令，用于格式/行为约束' },
  { key: 'detail', label: '详细描述', multiline: true, placeholder: '更丰满的角色外观/背景/心理综合描述' },
  { key: 'openingDialogues', label: '开场对白' },
  { key: 'worldBook', label: '世界书' },
  { key: 'tags', label: '标签', placeholder: '逗号分隔的标签，如：古風,仙俠,悲劇' },
  { key: 'creator', label: '作者' },
  { key: 'characterVersion', label: '版本' },
];

function emptyOpeningDialogues() {
  return [{ role: 'ai', content: '' }];
}

function emptyWorldBookEntry() {
  return { keys: '', content: '', enabled: true, constant: false };
}

export function createEmptyRoleCard() {
  return {
    roleName: '',
    ageAppearance: '',
    identity: '',
    relationship: '',
    livingStatus: '',
    personality: '',
    speechStyle: '',
    userAddress: '',
    knowledgeScope: '',
    habits: '',
    specialForm: '',
    taboos: '',
    examples: [
      { scene: '', correct: '', wrong: '' },
      { scene: '', correct: '', wrong: '' },
      { scene: '', correct: '', wrong: '' },
    ],
    backgrounds: ['', '', '', ''],
    customRules: '',
    // 扩展字段
    avatarDataUrl: '',
    intro: '',
    scene: '',
    systemInstruction: '',
    postHistoryInstructions: '',
    detail: '',
    openingDialogues: emptyOpeningDialogues(),
    worldBook: [],
    tags: '',
    creator: '',
    characterVersion: '',
    externalRaw: null,
  };
}

const ALIASES = {
  roleName: ['roleName', 'name', 'characterName', '角色名称', '当前角色', '角色名', '姓名'],
  ageAppearance: ['ageAppearance', 'appearance', 'age', '年龄与外貌', '年龄外貌', '外貌', '年龄'],
  identity: ['identity', 'position', '身份定位', '身份', '定位'],
  relationship: ['relationship', '情感关系', '关系', '与用户关系'],
  livingStatus: ['livingStatus', 'living', '居住状态', '生活状态', '居住'],
  personality: ['personality', 'traits', '性格特质', '性格', '人格'],
  speechStyle: ['speechStyle', 'speech', 'voice', '说话风格', '口吻', '语气'],
  userAddress: ['userAddress', 'addressUser', '称呼用户', '称呼', '对用户称呼'],
  knowledgeScope: ['knowledgeScope', 'knowledge', '知识范围', '知识边界', '认知范围'],
  habits: ['habits', 'specialHabits', '特殊习惯', '习惯', '小动作'],
  specialForm: ['specialForm', 'form', '特殊形态', '形态', '特殊状态'],
  taboos: ['taboos', 'forbidden', '绝对禁忌', '禁忌', '雷区'],
  examples: ['examples', 'dialogueExamples', '对话示例', '示例', '正误示例'],
  backgrounds: ['backgrounds', 'background', 'supplementaryBackground', '补充背景信息', '背景碎片', '背景'],
  customRules: ['customRules', 'rules', 'extraRules', '自定义规则', '补充规则', '额外规则'],
  // 扩展别名
  avatarDataUrl: ['avatarDataUrl', 'avatar', 'imageDataUrl', 'avatarUrl', '角色头像'],
  intro: ['intro', 'introduction', 'creator_notes', 'creatorNotes', '角色简介', '简介', '概述'],
  scene: ['scene', 'scenario', '场景设定', '场景', '世界设定', 'world'],
  systemInstruction: ['systemInstruction', 'system_prompt', 'systemPrompt', '系统指令', '系统提示'],
  postHistoryInstructions: ['postHistoryInstructions', 'post_history_instructions', '后置指令', '后置规则'],
  detail: ['detail', 'description', 'longDescription', 'extendedDescription', '详细描述', '详尽描述'],
  openingDialogues: ['openingDialogues', 'first_mes', 'firstMes', 'alternate_greetings', 'alternateGreetings', '开场白', '开场对白'],
  worldBook: ['worldBook', 'character_book', 'characterBook', '世界书', '设定集'],
  tags: ['tags', '标签', '类型'],
  creator: ['creator', 'author', '作者', '制作者'],
  characterVersion: ['characterVersion', 'version', 'spec', '版本'],
  externalRaw: ['externalRaw', 'extensions', '_raw', '外部数据'],
};

const KNOWN_KEYS = new Set();
for (const keys of Object.values(ALIASES)) {
  for (const k of keys) KNOWN_KEYS.add(k);
}
KNOWN_KEYS.delete('character_book');
KNOWN_KEYS.delete('first_mes');
KNOWN_KEYS.delete('alternate_greetings');
KNOWN_KEYS.delete('extensions');

export function parseRoleCardJson(text) {
  try {
    const parsed = JSON.parse(String(text || '').trim());
    return normalizeRoleCard(parsed);
  } catch (e) {
    throw new Error('JSON 格式不正确：' + (e.message || e));
  }
}

export function normalizeRoleCard(input = {}) {
  const base = createEmptyRoleCard();
  if (!input || typeof input !== 'object') return base;

  // 尝试从 PNG 解析：raw 可能是 {chara: "base64...", ccv3: "base64..."}
  const srcRaw = unwrapRoleCard(input);
  let src = srcRaw;

  // 检测 PNG 元数据：chara 或 ccv3 是 base64 编码的 JSON
  if (srcRaw && typeof srcRaw === 'object' && !Array.isArray(srcRaw)) {
    const pngData = tryPngMetadata(srcRaw);
    if (pngData) src = pngData;
  }

  // 核心字段
  for (const field of ROLE_CARD_FIELDS) {
    base[field.key] = cleanText(pick(src, field.key));
  }
  base.examples = normalizeExamples(pick(src, 'examples'));
  base.backgrounds = normalizeBackgrounds(pick(src, 'backgrounds'));
  base.customRules = cleanText(pick(src, 'customRules'));

  // 扩展字段
  base.avatarDataUrl = cleanText(pick(src, 'avatarDataUrl'));
  base.intro = cleanText(pick(src, 'intro'));
  base.scene = cleanText(pick(src, 'scene'));
  base.systemInstruction = cleanText(pick(src, 'systemInstruction'));
  base.postHistoryInstructions = cleanText(pick(src, 'postHistoryInstructions'));
  base.detail = cleanText(pick(src, 'detail'));
  base.openingDialogues = normalizeOpeningDialogues(openingSource(src));
  base.worldBook = normalizeWorldBook(pick(src, 'worldBook'));
  base.tags = normalizeTags(pick(src, 'tags'));
  base.creator = cleanText(pick(src, 'creator'));
  base.characterVersion = cleanText(pick(src, 'characterVersion'));

  // 外部未知字段存 externalRaw
  const externals = collectExternals(src, srcRaw);
  base.externalRaw = Object.keys(externals).length ? externals : null;

  return base;
}

export function mergeRoleCard(current, patch) {
  const cur = normalizeRoleCard(current);
  const next = normalizeRoleCard(patch);
  for (const field of ROLE_CARD_FIELDS) {
    if (next[field.key]) cur[field.key] = next[field.key];
  }
  if (next.customRules) cur.customRules = next.customRules;
  next.examples.forEach((ex, i) => {
    if (ex.scene || ex.correct || ex.wrong) cur.examples[i] = ex;
  });
  next.backgrounds.forEach((bg, i) => {
    if (bg) cur.backgrounds[i] = bg;
  });
  // 扩展字段合并
  for (const field of EXTENDED_FIELDS) {
    const k = field.key;
    if (k === 'openingDialogues' && next.openingDialogues && next.openingDialogues.length) {
      cur.openingDialogues = next.openingDialogues;
    } else if (k === 'worldBook' && next.worldBook && next.worldBook.length) {
      cur.worldBook = next.worldBook;
    } else if (next[k] !== undefined && next[k] !== null && next[k] !== '' && !(Array.isArray(next[k]) && !next[k].length)) {
      cur[k] = next[k];
    }
  }
  if (next.externalRaw) cur.externalRaw = next.externalRaw;
  return cur;
}

export function roleCardHasContent(card) {
  const c = normalizeRoleCard(card);
  return ROLE_CARD_FIELDS.some((f) => !!c[f.key])
    || c.examples.some((x) => x.scene || x.correct || x.wrong)
    || c.backgrounds.some(Boolean)
    || !!c.customRules
    || !!c.detail
    || !!c.scene
    || !!c.systemInstruction
    || !!c.postHistoryInstructions
    || (c.openingDialogues && c.openingDialogues.some((d) => !!d.content))
    || (c.worldBook && c.worldBook.some((e) => !!e.content));
}

export function roleCardDisplayName(card) {
  const c = normalizeRoleCard(card);
  return c.roleName || '';
}

export function roleCardInitial(card, fallback = '角') {
  const name = roleCardDisplayName(card) || fallback;
  return [...String(name).trim()][0] || fallback;
}

// === AI 生成 - 三种模式 ===

export function roleCardAiPrompt(seed = '', target = 'ai') {
  const who = target === 'user' ? '用户扮演角色' : 'AI 扮演角色';
  return [
    {
      role: 'system',
      content: `你是语C角色卡设计助手。根据用户给出的短设定，补全一张「${who}」角色卡。
要求：
- 不输出解释，不输出 Markdown。
- 只输出严格 JSON。
- JSON 字段必须使用这些英文键：roleName, ageAppearance, identity, relationship, livingStatus, personality, speechStyle, userAddress, knowledgeScope, habits, specialForm, taboos, examples, backgrounds, customRules。
- examples 是 3 项数组，每项为 {scene, correct, wrong}。
- backgrounds 是 4 项字符串数组。
- 内容要具体，可直接用于角色扮演。`,
    },
    {
      role: 'user',
      content: `短设定：${seed || '没有短设定，请生成一张适合中文语C的原创角色卡。'}`,
    },
  ];
}

export function roleCardChatPrompt(chatHistory, target = 'ai') {
  const who = target === 'user' ? '用户扮演角色' : 'AI 扮演角色';
  const historyBlock = (chatHistory || '').trim();
  return [
    {
      role: 'system',
      content: `你是语C角色卡设计助手。根据下面这段角色扮演聊天记录，提取并构建一张完整的「${who}」角色卡。
要求：
- 不输出解释，不输出 Markdown。
- 只输出严格 JSON。
- 必须包含这些字段（英文键）：roleName, ageAppearance, identity, relationship, livingStatus, personality, speechStyle, userAddress, knowledgeScope, habits, specialForm, taboos, examples, backgrounds, customRules。
- 同时输出扩展字段：detail（详细描述）, scene（场景设定）, openingDialogues（开场对白数组，每项 {role:"ai"|"user",content:""}）, worldBook（世界书数组，每项 {keys:"",content:"",enabled:true,constant:false}）, tags（逗号分隔标签）, intro（角色简介，给用户的）。
- examples 是 3 项数组，每项为 {scene, correct, wrong}。
- backgrounds 是 4 项字符串数组。
- 从聊天记录中推断角色的性格、说话风格、背景和关系，不要凭空捏造。`,
    },
    {
      role: 'user',
      content: `聊天记录（最多4096字）：\n${historyBlock.slice(0, 4096) || '没有聊天记录，请生成一张原创角色卡。'}`,
    },
  ];
}

export function roleCardDescPrompt(description, target = 'ai') {
  const who = target === 'user' ? '用户扮演角色' : 'AI 扮演角色';
  const parts = (description || '').trim().split(/\n{2,}/);
  const brief = parts[0] || description;
  const extra = parts.slice(1).join('\n\n');
  return [
    {
      role: 'system',
      content: `你是语C角色卡设计助手。根据用户给出的角色描述，补全一张「${who}」角色卡。

第一个段落（最多1000字）是核心描述；后续段落（最多2000字）是额外细节。

要求：
- 不输出解释，不输出 Markdown。
- 只输出严格 JSON。
- 必须包含这些字段（英文键）：roleName, ageAppearance, identity, relationship, livingStatus, personality, speechStyle, userAddress, knowledgeScope, habits, specialForm, taboos, examples, backgrounds, customRules。
- 同时输出扩展字段：detail（详细描述）, scene（场景设定）, openingDialogues（开场对白数组）, worldBook（世界书数组，每项 {keys:"",content:"",enabled:true,constant:false}）, tags（逗号分隔标签）, intro（角色简介，给用户的）。
- examples 是 3 项数组，每项为 {scene, correct, wrong}。
- backgrounds 是 4 项字符串数组。`,
    },
    {
      role: 'user',
      content: `核心描述（1000字上限）：\n${brief.slice(0, 1000)}\n\n额外细节（2000字上限）：\n${extra.slice(0, 2000)}`,
    },
  ];
}

export function roleCardNovelPrompt(novelText, target = 'ai') {
  const who = target === 'user' ? '用户扮演角色' : 'AI 扮演角色';
  return [
    {
      role: 'system',
      content: `你是语C角色卡设计助手。根据用户给出的小说/故事片段，提炼一张完整的「${who}」角色卡。
小说片段最长50000字。

要求：
- 不输出解释，不输出 Markdown。
- 只输出严格 JSON。
- 必须包含这些字段（英文键）：roleName, ageAppearance, identity, relationship, livingStatus, personality, speechStyle, userAddress, knowledgeScope, habits, specialForm, taboos, examples, backgrounds, customRules。
- 同时输出扩展字段：detail（详细描述）, scene（场景设定）, openingDialogues（开场对白数组，每项 {role:"ai"|"user",content:""}, 至少2个）, worldBook（世界书数组，每项 {keys:"",content:"",enabled:true,constant:false}）, tags（逗号分隔标签）, intro（角色简介，给用户的）。
- examples 是 3 项数组，每项为 {scene, correct, wrong}。
- backgrounds 是 4 项字符串数组。
- 深度理解文本中的角色弧线、潜台词和关系动态。`,
    },
    {
      role: 'user',
      content: `小说/故事片段（50000字上限，已截取）：\n${(novelText || '').slice(0, 50000)}`,
    },
  ];
}

// === 角色卡 → Markdown（Agent 提示词用）===

export function roleCardToMarkdown(card) {
  const c = normalizeRoleCard(card);
  const value = (v) => v || '未填写';
  let md = '';

  // 系统指令（拼在最前）
  if (c.systemInstruction) {
    md += `${c.systemInstruction.trim()}\n\n`;
  }

  // 核心参数表
  md += `### 核心参数表\n\n| 参数类别 | 内容 |\n|---|---|\n`;
  for (const field of ROLE_CARD_FIELDS) {
    md += `| ${field.label} | ${oneLine(value(c[field.key]))} |\n`;
  }

  // 详细描述
  if (c.detail) {
    md += `\n### 详细描述\n\n${c.detail.trim()}\n`;
  }

  // 场景
  if (c.scene) {
    md += `\n### 场景设定\n\n${c.scene.trim()}\n`;
  }

  // 对话示例
  md += `\n### 对话示例\n\n| 场景 | 正确回应 | 错误回应 |\n|---|---|---|\n`;
  for (const ex of c.examples) {
    md += `| ${oneLine(value(ex.scene))} | ${oneLine(value(ex.correct))} | ${oneLine(value(ex.wrong))} |\n`;
  }

  // 补充背景
  md += `\n### 补充背景信息\n\n| 编号 | 背景碎片 |\n|---|---|\n`;
  c.backgrounds.forEach((bg, i) => {
    md += `| ${i + 1} | ${oneLine(value(bg))} |\n`;
  });
  if (c.customRules) {
    md += `\n### 用户自定义补充规则\n\n${c.customRules.trim()}\n`;
  }

  // 开场对白（取第一条 AI 消息）
  const firstOpening = (c.openingDialogues || []).find((d) => d.role === 'ai' && d.content);
  if (firstOpening) {
    md += `\n### 默认开场白\n\n${firstOpening.content.trim()}\n`;
  }

  // 世界书 — constant 条目始终进入，非 constant 条目在上下文命中关键词时进入
  const wb = c.worldBook || [];
  if (wb.length) {
    const constantEntries = wb.filter((e) => e.enabled && e.constant && e.content);
    if (constantEntries.length) {
      md += `\n### 世界书（常驻条目）\n\n`;
      for (const e of constantEntries) {
        md += `**${e.keys || '(未设置关键词)'}**：${e.content.trim()}\n\n`;
      }
    }
    // 如果没有聊天上下文，额外包含少量关键设定
    const keywordEntries = wb.filter((e) => e.enabled && !e.constant && e.content);
    if (keywordEntries.length) {
      md += `\n### 世界书（关键词触发条目，当前默认包含）\n\n`;
      for (const e of keywordEntries.slice(0, 6)) {
        md += `**${e.keys || '(未设置关键词)'}**：${e.content.trim()}\n\n`;
      }
    }
  }

  // 后置指令
  if (c.postHistoryInstructions) {
    md += `\n### 后置指令\n\n${c.postHistoryInstructions.trim()}\n`;
  }

  return md.trim();
}

// === PNG 解析 ===

export function parsePngRoleCard(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  // 验证 PNG 签名
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== sig[i]) throw new Error('不是有效的 PNG 文件');
  }
  // 遍历 chunk
  let offset = 8;
  let found = null;
  while (offset < bytes.length - 4) {
    const length = ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
    offset += 4;
    if (offset + 4 + length + 4 > bytes.length) throw new Error('PNG 文件结构不完整');
    const type = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
    offset += 4;
    if (type === 'tEXt') {
      const data = bytes.slice(offset, offset + length);
      const nullIdx = data.indexOf(0);
      if (nullIdx !== -1) {
        const keyword = String.fromCharCode(...data.slice(0, nullIdx));
        const value = String.fromCharCode(...data.slice(nullIdx + 1));
        if (keyword === 'chara' || keyword === 'ccv3') {
          try {
            const decoded = decodeBase64Json(value.trim());
            const parsed = JSON.parse(decoded);
            found = normalizeRoleCard(parsed);
            break;
          } catch (e) {
            throw new Error(`PNG 角色卡解析失败（${keyword}）：` + e.message);
          }
        }
      }
    }
    offset += length + 4; // skip CRC
  }
  if (!found) throw new Error('该 PNG 文件不含角色卡元数据（chara/ccv3），请确认是 Tavern/SillyTavern 导出的角色卡');
  return found;
}

export function tryPngMetadata(raw) {
  // 检测 raw 对象中是否有 base64 编码的 chara/ccv3 字段
  if (typeof raw !== 'object' || !raw) return null;
  for (const key of ['chara', 'ccv3']) {
    if (typeof raw[key] === 'string') {
      try {
        const decoded = decodeBase64Json(raw[key].trim());
        const parsed = JSON.parse(decoded);
        return parsed;
      } catch (e) {
        // fall through
      }
    }
  }
  return null;
}

// === 内部工具函数 ===

function unwrapRoleCard(input) {
  const wrapped = input.roleCard || input.characterCard || input['角色卡'] || input.card || input;
  if (wrapped?.data && typeof wrapped.data === 'object') {
    const data = wrapped.data;
    return {
      ...data,
      spec: wrapped.spec,
      spec_version: wrapped.spec_version,
      extensions: data.extensions || wrapped.extensions,
    };
  }
  return wrapped;
}

function pick(src, canonicalKey) {
  const keys = ALIASES[canonicalKey] || [canonicalKey];
  for (const key of keys) {
    if (src[key] !== undefined && src[key] !== null) return src[key];
  }
  return undefined;
}

function normalizeExamples(raw) {
  const rows = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? Object.values(raw) : [];
  const out = rows.slice(0, 3).map((row) => {
    if (Array.isArray(row)) {
      return {
        scene: cleanText(row[0]),
        correct: cleanText(row[1]),
        wrong: cleanText(row[2]),
      };
    }
    if (row && typeof row === 'object') {
      return {
        scene: cleanText(row.scene ?? row['场景']),
        correct: cleanText(row.correct ?? row.good ?? row['正确回应']),
        wrong: cleanText(row.wrong ?? row.bad ?? row['错误回应']),
      };
    }
    return { scene: cleanText(row), correct: '', wrong: '' };
  });
  while (out.length < 3) out.push({ scene: '', correct: '', wrong: '' });
  return out;
}

function normalizeBackgrounds(raw) {
  if (Array.isArray(raw)) return raw.slice(0, 4).map(cleanText).concat(['', '', '', '']).slice(0, 4);
  if (raw && typeof raw === 'object') {
    return [raw[1] ?? raw['1'], raw[2] ?? raw['2'], raw[3] ?? raw['3'], raw[4] ?? raw['4']].map(cleanText);
  }
  const text = cleanText(raw);
  return text ? [text, '', '', ''] : ['', '', '', ''];
}

function normalizeOpeningDialogues(raw) {
  if (!raw) return emptyOpeningDialogues();
  // 字符串 → 单条 AI 消息
  if (typeof raw === 'string') {
    return [{ role: 'ai', content: raw.trim() }];
  }
  // 数组
  if (Array.isArray(raw)) {
    const out = raw.map((item) => {
      if (typeof item === 'string') return { role: 'ai', content: item.trim() };
      if (item && typeof item === 'object') {
        return {
          role: item.role === 'user' ? 'user' : 'ai',
          content: cleanText(item.content ?? item.msg ?? item.text ?? item.message ?? ''),
        };
      }
      return { role: 'ai', content: '' };
    }).filter((d) => d.content);
    return out.length ? out : emptyOpeningDialogues();
  }
  return emptyOpeningDialogues();
}

function openingSource(src) {
  if (!src || typeof src !== 'object') return pick(src, 'openingDialogues');
  const first = src.openingDialogues ?? src.first_mes ?? src.firstMes ?? src['开场白'] ?? src['开场对白'];
  const alternates = src.alternate_greetings ?? src.alternateGreetings;
  const out = [];
  if (Array.isArray(first)) out.push(...first);
  else if (first) out.push(first);
  if (Array.isArray(alternates)) out.push(...alternates);
  if (!out.length) return pick(src, 'openingDialogues');
  return out;
}

function normalizeWorldBook(raw) {
  if (!raw) return [];
  let entries = [];
  // Tavern V2: character_book.entries
  if (raw.entries && Array.isArray(raw.entries)) {
    entries = raw.entries;
  } else if (Array.isArray(raw)) {
    entries = raw;
  } else if (typeof raw === 'object') {
    entries = Object.values(raw);
  }
  if (!Array.isArray(entries)) return [];
  return entries.map((e) => ({
    keys: cleanText(e.keys ?? e.key ?? e.keywords ?? ''),
    content: cleanText(e.content ?? e.value ?? e.text ?? ''),
    enabled: e.enabled !== false,
    constant: !!e.constant,
  }));
}

function normalizeTags(raw) {
  if (!raw) return '';
  if (Array.isArray(raw)) return raw.filter(Boolean).map((t) => String(t).trim()).join('，');
  return String(raw).replace(/[,，]/g, '，').replace(/\s+/g, '').trim();
}

function collectExternals(src, raw) {
  const externals = {};
  for (const key of Object.keys(raw || {})) {
    if (!KNOWN_KEYS.has(key)) {
      externals[key] = raw[key];
    }
  }
  for (const key of Object.keys(src || {})) {
    if (!KNOWN_KEYS.has(key) && src[key] !== raw?.[key]) {
      externals[key] = src[key];
    }
  }
  return externals;
}

function decodeBase64Json(value) {
  const binary = atob(String(value || '').trim());
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  try {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return binary;
  }
}

function cleanText(v) {
  if (v === undefined || v === null) return '';
  if (Array.isArray(v)) return v.map(cleanText).filter(Boolean).join('；');
  if (typeof v === 'object') {
    try { return JSON.stringify(v, null, 2); } catch { return ''; }
  }
  return String(v).trim();
}

function oneLine(text) {
  return String(text || '').replace(/\s+/g, ' ').replace(/\|/g, '｜').trim();
}
