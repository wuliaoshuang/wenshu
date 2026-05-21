// 纯语C角色卡 —— 字段定义、JSON 导入归一化、提示词片段生成

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
};

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
  const src = unwrapRoleCard(input);
  for (const field of ROLE_CARD_FIELDS) {
    base[field.key] = cleanText(pick(src, field.key));
  }
  base.examples = normalizeExamples(pick(src, 'examples'));
  base.backgrounds = normalizeBackgrounds(pick(src, 'backgrounds'));
  base.customRules = cleanText(pick(src, 'customRules'));
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
  return cur;
}

export function roleCardHasContent(card) {
  const c = normalizeRoleCard(card);
  return ROLE_CARD_FIELDS.some((f) => !!c[f.key])
    || c.examples.some((x) => x.scene || x.correct || x.wrong)
    || c.backgrounds.some(Boolean)
    || !!c.customRules;
}

export function roleCardDisplayName(card) {
  const c = normalizeRoleCard(card);
  return c.roleName || '';
}

export function roleCardInitial(card, fallback = '角') {
  const name = roleCardDisplayName(card) || fallback;
  return [...String(name).trim()][0] || fallback;
}

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

export function roleCardToMarkdown(card) {
  const c = normalizeRoleCard(card);
  const value = (v) => v || '未填写';
  let md = `### 核心参数表\n\n| 参数类别 | 内容 |\n|---|---|\n`;
  for (const field of ROLE_CARD_FIELDS) {
    md += `| ${field.label} | ${oneLine(value(c[field.key]))} |\n`;
  }
  md += `\n### 对话示例\n\n| 场景 | 正确回应 | 错误回应 |\n|---|---|---|\n`;
  for (const ex of c.examples) {
    md += `| ${oneLine(value(ex.scene))} | ${oneLine(value(ex.correct))} | ${oneLine(value(ex.wrong))} |\n`;
  }
  md += `\n### 补充背景信息\n\n| 编号 | 背景碎片 |\n|---|---|\n`;
  c.backgrounds.forEach((bg, i) => {
    md += `| ${i + 1} | ${oneLine(value(bg))} |\n`;
  });
  if (c.customRules) {
    md += `\n### 用户自定义补充规则\n\n${c.customRules.trim()}\n`;
  }
  return md.trim();
}

function unwrapRoleCard(input) {
  return input.roleCard || input.characterCard || input['角色卡'] || input.card || input;
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

function cleanText(v) {
  if (v === undefined || v === null) return '';
  if (Array.isArray(v)) return v.map(cleanText).filter(Boolean).join('；');
  if (typeof v === 'object') return JSON.stringify(v, null, 2);
  return String(v).trim();
}

function oneLine(text) {
  return String(text || '').replace(/\s+/g, ' ').replace(/\|/g, '｜').trim();
}
