// localStorage 状态管理 —— 单一 key，整体存取
import { uid, nowIso, cnWordCount } from './utils.js';
import { createEmptyRoleCard, normalizeRoleCard } from './role-card.js';

const KEY = 'wenshu.v1';
const ROLE_CARDS_KEY = 'wenshu.roleCards.v1';

function emptyRoleCards() {
  return {
    ai: {},
    user: createEmptyRoleCard(),
    updatedAt: '',
  };
}

const DEFAULT_STATE = {
  prefs: {
    apiKey: '',
    model: 'deepseek-v4-flash',
    globalPrompt: '',          // 用户自定义全局 system prompt，前置到所有 AI 调用
    defaultMode: 'serial',     // serial | subagent-parallel | agent-teams
    strictness: 'standard',    // tolerant | standard | strict
    dialogueRatio: 30,
    forceHook: true,
    font: 'mincho',            // mincho | kaiti | songti
    fontSize: 15,
    tategaki: false,
    immersive: true,
    autoResume: true,
    captureInbox: true,
    genres: ['悬疑', '言情', '历史'],
    protagonists: ['单男主', '双主角'],
    viewpoint: '三人称限制',
    tones: ['冷峻克制', '温情治愈'],
    chapters: 15,
    user: { name: '文舒用户', signedAt: nowIso() },
  },
  novels: {},          // 立项流程产出的正式小说，library/editor/plan/export 都读这里
  agentSessions: {},   // Agent 聊天工坊产出物——独立沙盒，不进 library
  roleCards: emptyRoleCards(),
  drafts: [],
  ui: { currentNovelId: null },
  schemaVersion: 2,
};

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    const merged = mergeDeep(structuredClone(DEFAULT_STATE), parsed);
    return hydrateRoleCards(migrateAgentSessionModes(migrateIfNeeded(merged)));
  } catch {
    return hydrateRoleCards(structuredClone(DEFAULT_STATE));
  }
}

// v1 → v2：把曾经塞进 state.novels 里的 Agent 中间产物搬到独立的 agentSessions
function migrateIfNeeded(s) {
  if (s.schemaVersion >= 2) return s;
  s.agentSessions = s.agentSessions || {};
  for (const id of Object.keys(s.novels || {})) {
    const n = s.novels[id];
    if (n && n.agent && n.agent.active === true) {
      s.agentSessions[id] = {
        id,
        createdAt: n.createdAt || nowIso(),
        updatedAt: n.updatedAt || nowIso(),
        title: n.title && n.title !== '未命名 · Agent' ? n.title : null,
        titleCandidates: n.titleCandidates || null,
        spec: n.spec || {},
        chaptersN: n.chaptersN || null,
        outline: n.outline || null,
        characters: n.characters || null,
        chapters: n.chapters || [],
        messages: n.agent.messages || [],
        micro: n.agent.micro || [],
        microGranularity: n.agent.microGranularity || null,
      };
      delete s.novels[id];
    }
  }
  if (s.ui && s.ui.currentNovelId && !s.novels[s.ui.currentNovelId]) {
    s.ui.currentNovelId = null;
  }
  s.schemaVersion = 2;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  return s;
}

function inferAgentSessionMode(session = {}) {
  if (session.mode === 'writer' || session.mode === 'roleplay') return session.mode;
  const hasRoleplayMessages = Array.isArray(session.ycMessages)
    && session.ycMessages.some((m) => m && String(m.content || '').trim());
  return session.ycMode || hasRoleplayMessages ? 'roleplay' : 'writer';
}

function normalizeAgentSessionMode(session = {}) {
  const mode = inferAgentSessionMode(session);
  return {
    ...session,
    mode,
    ycMode: mode === 'roleplay',
    messages: Array.isArray(session.messages) ? session.messages : [],
    ycMessages: Array.isArray(session.ycMessages) ? session.ycMessages : [],
  };
}

function migrateAgentSessionModes(s) {
  let changed = false;
  s.agentSessions = s.agentSessions || {};
  for (const [id, session] of Object.entries(s.agentSessions)) {
    const next = normalizeAgentSessionMode(session || {});
    if (next.mode !== session?.mode || next.ycMode !== session?.ycMode) changed = true;
    s.agentSessions[id] = next;
  }
  if (changed) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  }
  return s;
}

function mergeDeep(target, src) {
  for (const k of Object.keys(src)) {
    if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && typeof target[k] === 'object' && !Array.isArray(target[k])) {
      target[k] = mergeDeep(target[k], src[k]);
    } else {
      target[k] = src[k];
    }
  }
  return target;
}

function normalizeRoleCardsBox(box = {}) {
  const out = emptyRoleCards();
  out.updatedAt = box.updatedAt || '';
  out.user = normalizeRoleCard(box.user || {});
  const srcAi = box.ai && typeof box.ai === 'object' ? box.ai : {};
  for (const [id, card] of Object.entries(srcAi)) {
    const normalized = normalizeRoleCard(card);
    out.ai[id] = {
      ...normalized,
      id,
      title: normalized.roleName || card.title || '未命名角色',
      createdAt: card.createdAt || card.updatedAt || nowIso(),
      updatedAt: card.updatedAt || card.createdAt || out.updatedAt || nowIso(),
    };
  }
  return out;
}

function roleCardsStamp(box) {
  if (!box) return 0;
  let stamp = Date.parse(box.updatedAt || '') || 0;
  for (const card of Object.values(box.ai || {})) {
    stamp = Math.max(stamp, Date.parse(card.updatedAt || '') || 0);
  }
  return stamp;
}

function readRoleCardsBackup() {
  try {
    const raw = localStorage.getItem(ROLE_CARDS_KEY);
    if (!raw) return null;
    return normalizeRoleCardsBox(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeRoleCardsBackup(box = state.roleCards) {
  try {
    localStorage.setItem(ROLE_CARDS_KEY, JSON.stringify(normalizeRoleCardsBox(box)));
  } catch {}
}

function hydrateRoleCards(s) {
  s.roleCards = normalizeRoleCardsBox(s.roleCards || {});
  const backup = readRoleCardsBackup();
  if (backup && roleCardsStamp(backup) >= roleCardsStamp(s.roleCards)) {
    s.roleCards = backup;
  }
  writeRoleCardsBackup(s.roleCards);
  return s;
}

function ensureRoleCards() {
  state.roleCards = normalizeRoleCardsBox(state.roleCards || {});
  const backup = readRoleCardsBackup();
  if (backup && roleCardsStamp(backup) > roleCardsStamp(state.roleCards)) {
    state.roleCards = backup;
  }
  return state.roleCards;
}

function touchRoleCards() {
  ensureRoleCards();
  state.roleCards.updatedAt = nowIso();
}

function persist({ syncRoleCards = true } = {}) {
  if (syncRoleCards) ensureRoleCards();
  localStorage.setItem(KEY, JSON.stringify(state));
  writeRoleCardsBackup(state.roleCards);
}

export function getState() { return state; }
export function reset() {
  state = structuredClone(DEFAULT_STATE);
  state.roleCards = normalizeRoleCardsBox(state.roleCards);
  writeRoleCardsBackup(state.roleCards);
  persist({ syncRoleCards: false });
}

// === prefs ===
export function getPrefs() { return state.prefs; }
export function setPrefs(patch) {
  state.prefs = { ...state.prefs, ...patch };
  persist();
}

// === drafts (闪念) ===
export function listDrafts() { return state.drafts; }
export function addDraft(d) {
  const item = { id: uid(), createdAt: nowIso(), ...d };
  state.drafts.unshift(item);
  persist();
  return item;
}
export function removeDraft(id) {
  state.drafts = state.drafts.filter((d) => d.id !== id);
  persist();
}

// === novels ===
export function listNovels() {
  return Object.values(state.novels).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}
export function getNovel(id) { return state.novels[id]; }
export function createNovel(data) {
  const id = uid();
  const novel = {
    id,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    title: data.title || '未命名',
    spec: data.spec || {},
    outline: data.outline || [],     // [{n,title,event,prev,hook,characters,scene}]
    characters: data.characters || [],
    chapters: data.chapters || [],   // [{n,title,status,body,wordCount,hook,scoredAt}]
    status: data.status || 'planning', // planning | writing | validating | completed
    mode: data.mode || state.prefs.defaultMode,
    currentChapter: data.currentChapter || 1,
    summaries: data.summaries || {}, // {n: "章节摘要"}
    ...data
  };
  state.novels[id] = novel;
  state.ui.currentNovelId = id;
  persist();
  return novel;
}
export function updateNovel(id, patch) {
  if (!state.novels[id]) return null;
  state.novels[id] = { ...state.novels[id], ...patch, updatedAt: nowIso() };
  persist();
  return state.novels[id];
}
export function deleteNovel(id) {
  delete state.novels[id];
  if (state.ui.currentNovelId === id) state.ui.currentNovelId = null;
  persist();
}
export function setCurrentNovel(id) {
  state.ui.currentNovelId = id;
  persist();
}
export function getCurrentNovel() {
  return state.novels[state.ui.currentNovelId] || null;
}

// 章节
export function upsertChapter(novelId, ch) {
  const novel = state.novels[novelId];
  if (!novel) return;
  const idx = novel.chapters.findIndex((c) => c.n === ch.n);
  if (idx === -1) novel.chapters.push(ch);
  else novel.chapters[idx] = { ...novel.chapters[idx], ...ch };
  novel.chapters.sort((a, b) => a.n - b.n);
  novel.updatedAt = nowIso();
  persist();
}
export function getChapter(novelId, n) {
  const novel = state.novels[novelId];
  if (!novel) return null;
  return novel.chapters.find((c) => c.n === n) || null;
}

// === Agent 会话 —— 独立沙盒，跟 state.novels 完全隔离 ===
// 流式时一秒能写几十次，单独 debounce 持久化避免 localStorage 雪崩
let _agentPersistTimer;
function persistAgentSoon() {
  clearTimeout(_agentPersistTimer);
  _agentPersistTimer = setTimeout(() => persist(), 200);
}

export function listAgentSessions(mode = null) {
  const sessions = Object.values(state.agentSessions).map(normalizeAgentSessionMode);
  const filtered = mode ? sessions.filter((s) => s.mode === mode) : sessions;
  return filtered.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}
export function getAgentSession(id) {
  if (!state.agentSessions[id]) return null;
  state.agentSessions[id] = normalizeAgentSessionMode(state.agentSessions[id]);
  return state.agentSessions[id];
}
export function createAgentSession(data = {}) {
  const id = uid();
  const mode = data.mode === 'roleplay' ? 'roleplay' : 'writer';
  const session = {
    id,
    mode,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    title: null,
    titleCandidates: null,
    spec: {},
    chaptersN: null,
    outline: null,
    characters: null,
    chapters: [],                  // [{n, title, body, summary}]
    messages: [],                  // [{id, role, kind, content, qcard?, chapterN?, ts}]
    ycMessages: [],                // 纯语C分页消息，不与 Q-Card 构建流共享
    micro: [],                     // 细纲：[{n, granularity, items}]
    microGranularity: null,
    model: state.prefs.model || 'deepseek-v4-flash',
    styleId: '',
    ycMode: mode === 'roleplay',
    roleCard: createEmptyRoleCard(),
    ...data,
    mode,
    ycMode: mode === 'roleplay',
  };
  state.agentSessions[id] = session;
  persist();
  return session;
}
export function updateAgentSession(id, patch) {
  if (!state.agentSessions[id]) return null;
  state.agentSessions[id] = { ...state.agentSessions[id], ...patch, updatedAt: nowIso() };
  persistAgentSoon();
  return state.agentSessions[id];
}
export function deleteAgentSession(id) {
  delete state.agentSessions[id];
  persist();
}
export function appendAgentMessage(sessionId, msg, lane = 'messages') {
  const s = state.agentSessions[sessionId];
  if (!s) return null;
  if (!Array.isArray(s[lane])) s[lane] = [];
  const item = { id: uid(), ts: nowIso(), ...msg };
  s[lane].push(item);
  s.updatedAt = nowIso();
  persistAgentSoon();
  return item;
}
export function patchAgentMessage(sessionId, msgId, patch, lane = 'messages') {
  const s = state.agentSessions[sessionId];
  if (!s) return null;
  if (!Array.isArray(s[lane])) s[lane] = [];
  const idx = s[lane].findIndex((m) => m.id === msgId);
  if (idx === -1) return null;
  s[lane][idx] = { ...s[lane][idx], ...patch };
  s.updatedAt = nowIso();
  persistAgentSoon();
  return s[lane][idx];
}
export function upsertAgentChapter(sessionId, ch) {
  const s = state.agentSessions[sessionId];
  if (!s) return;
  const idx = s.chapters.findIndex((c) => c.n === ch.n);
  if (idx === -1) s.chapters.push(ch);
  else s.chapters[idx] = { ...s.chapters[idx], ...ch };
  s.chapters.sort((a, b) => a.n - b.n);
  s.updatedAt = nowIso();
  persistAgentSoon();
}
export function setAgentMicro(sessionId, micro, granularity) {
  const s = state.agentSessions[sessionId];
  if (!s) return;
  if (micro !== undefined) s.micro = micro;
  if (granularity !== undefined) s.microGranularity = granularity;
  s.updatedAt = nowIso();
  persistAgentSoon();
}

// === 角色卡 ===
export function listAiRoleCards() {
  const box = ensureRoleCards().ai || {};
  return Object.values(box).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}
export function getAiRoleCard(id) {
  return ensureRoleCards().ai?.[id] || null;
}
export function saveAiRoleCard(card, id = null) {
  ensureRoleCards();
  const now = nowIso();
  const cardId = id || card.id || uid();
  const prev = state.roleCards.ai[cardId] || {};
  const normalized = normalizeRoleCard(card);
  const item = {
    ...prev,
    ...normalized,
    id: cardId,
    title: normalized.roleName || prev.title || '未命名角色',
    createdAt: prev.createdAt || now,
    updatedAt: now,
  };
  state.roleCards.ai[cardId] = item;
  state.roleCards.updatedAt = now;
  writeRoleCardsBackup(state.roleCards);
  persist({ syncRoleCards: false });
  return item;
}
export function deleteAiRoleCard(id) {
  ensureRoleCards();
  if (!state.roleCards.ai) return;
  delete state.roleCards.ai[id];
  for (const session of Object.values(state.agentSessions || {})) {
    if (session?.roleCardId !== id) continue;
    session.roleCardId = null;
    session.roleCard = createEmptyRoleCard();
    session.updatedAt = nowIso();
  }
  touchRoleCards();
  writeRoleCardsBackup(state.roleCards);
  persist({ syncRoleCards: false });
}
export function getUserRoleCard() {
  ensureRoleCards();
  state.roleCards.user = normalizeRoleCard(state.roleCards.user || {});
  return state.roleCards.user;
}
export function setUserRoleCard(card) {
  ensureRoleCards();
  state.roleCards.user = normalizeRoleCard(card);
  touchRoleCards();
  writeRoleCardsBackup(state.roleCards);
  persist({ syncRoleCards: false });
  return state.roleCards.user;
}
// 立即冲盘（页面卸载前用）
export function flushAgent() {
  clearTimeout(_agentPersistTimer);
  persist();
}

// 把 Agent 沙盒「采用」成正式 novel —— 用户显式动作触发
// session 原样保留（聊天工坊还可以继续改），novel 是当下这一刻的独立快照
export function promoteAgentSession(sessionId) {
  const s = state.agentSessions[sessionId];
  if (!s) return null;
  const hookByN = new Map((s.outline || []).map((r) => [r.n, r.hook || '']));
  const chapters = (s.chapters || []).map((c) => ({
    n: c.n,
    title: c.title || '',
    status: c.body ? 'completed' : 'pending',
    body: c.body || '',
    wordCount: c.body ? cnWordCount(c.body) : 0,
    hook: hookByN.get(c.n) || '',
  }));
  const summaries = {};
  for (const c of (s.chapters || [])) {
    if (c.summary) summaries[c.n] = c.summary;
  }
  const firstPending = chapters.find((c) => c.status !== 'completed');
  const novel = createNovel({
    title: s.title || s.titleCandidates?.[0] || '未命名',
    spec: { ...(s.spec || {}) },
    outline: [...(s.outline || [])],
    characters: [...(s.characters || [])],
    chapters,
    summaries,
    status: firstPending ? 'writing' : 'completed',
    currentChapter: firstPending ? firstPending.n : (chapters.at(-1)?.n || 1),
  });
  return novel;
}

// 项目导出包
export function exportNovelMd(novelId) {
  const n = state.novels[novelId];
  if (!n) return null;
  const files = {};
  files['00-人物档案.md'] = renderCharactersMd(n);
  files['01-大纲.md'] = renderOutlineMd(n);
  files['02-写作计划.json'] = JSON.stringify(renderPlanJson(n), null, 2);
  for (const c of n.chapters) {
    if (c.body) {
      files[`第${String(c.n).padStart(2, '0')}章-${c.title || '未命名'}.md`] = renderChapterMd(c);
    }
  }
  return files;
}

function renderCharactersMd(novel) {
  let md = `# ${novel.title} · 人物档案\n\n`;
  for (const c of (novel.characters || [])) {
    md += `## ${c.name}\n`;
    if (c.role) md += `- 角色：${c.role}\n`;
    if (c.core) md += `- 性格核心：${c.core}\n`;
    if (c.fatal) md += `- 致命缺陷：${c.fatal}\n`;
    if (c.speech) md += `- 说话风格：${c.speech}\n`;
    if (c.fear) md += `- 恐惧：${c.fear}\n`;
    if (c.relations) md += `- 关系：${c.relations}\n`;
    md += '\n';
  }
  return md;
}
function renderOutlineMd(novel) {
  let md = `# ${novel.title} · 大纲\n\n`;
  md += `> ${novel.spec?.logline || ''}\n\n`;
  md += `## 故事概述\n${novel.spec?.synopsis || ''}\n\n`;
  md += `## 章节规划\n\n`;
  md += `| 章节号 | 标题 | 核心事件 | 承接上章 | 悬念钩子 | 出场人物 | 场景 |\n`;
  md += `|---|---|---|---|---|---|---|\n`;
  for (const r of (novel.outline || [])) {
    md += `| ${r.n} | ${r.title || ''} | ${r.event || ''} | ${r.prev || ''} | ${r.hook || ''} | ${(r.characters || []).join('、')} | ${r.scene || ''} |\n`;
  }
  md += `\n## 已完成章节摘要\n\n`;
  for (const c of (novel.chapters || [])) {
    if (c.summary) md += `### 第${c.n}章 · ${c.title}\n${c.summary}\n\n`;
  }
  return md;
}
function renderPlanJson(novel) {
  return {
    schema: 'chinese-novelist.plan.v1',
    id: novel.id,
    title: novel.title,
    spec: novel.spec,
    mode: novel.mode,
    status: novel.status,
    currentChapter: novel.currentChapter,
    chapters: (novel.chapters || []).map((c) => ({
      n: c.n,
      title: c.title,
      status: c.status,
      wordCount: c.wordCount || 0,
      hook: c.hook || '',
      summary: c.summary || ''
    })),
    createdAt: novel.createdAt,
    updatedAt: novel.updatedAt,
  };
}
function renderChapterMd(ch) {
  return `# 第${ch.n}章 · ${ch.title || ''}\n\n${ch.body || ''}\n\n---\n章末钩：${ch.hook || ''}\n字数：${ch.wordCount || 0}\n`;
}

// 工厂：从 spec 与大纲构造初始章节清单
export function initChaptersFromOutline(novel) {
  const chapters = (novel.outline || []).map((r) => ({
    n: r.n,
    title: r.title,
    status: 'pending',
    body: '',
    wordCount: 0,
    hook: r.hook || ''
  }));
  return chapters;
}
