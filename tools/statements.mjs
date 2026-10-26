/**
 * AlgoPick · 题干抓取 / 翻译 模块
 *
 * 被两个地方复用：
 *   tools/fetch-statements.mjs （离线批量预取，生成 data/stmt-*.js）
 *   tools/serve.mjs            （按需抓取，网页点「获取中文题干」时调用）
 *
 * 核心原则（用户要求）：
 *   1. 站点本身有中文的，直接拉中文，绝不翻译。
 *   2. 只有英文/俄文的，才翻译成中文。
 *   3. 原文链接始终保留，随时能跳回原站核对。
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/* ============================================================
 * 工具
 * ============================================================ */
export async function timedFetch(url, opts = {}, ms = 15000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    return await fetch(url, { redirect: 'follow', ...opts, signal: c.signal });
  } finally {
    clearTimeout(t);
  }
}

/** HTML -> 纯文本，保留段落、代码块、$公式$ 与图片 alt 里的公式 */
export function htmlToText(html) {
  if (!html) return '';
  let s = String(html);
  s = s.replace(/<script[\s\S]*?<\/script>/gi, '');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, '');
  // 图片里的公式：Codeforces 老题用 <img alt="..."> 承载公式
  s = s.replace(/<img[^>]*\balt="([^"]*)"[^>]*>/gi, (m, alt) => (alt && alt.trim() ? ' ' + alt.trim() + ' ' : ' [图] '));
  s = s.replace(/<img[^>]*>/gi, ' [图] ');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/(p|div|li|h[1-6]|tr|pre|blockquote)>/gi, '\n');
  s = s.replace(/<(p|div|li|h[1-6]|tr|pre|blockquote)[^>]*>/gi, '\n');
  s = s.replace(/<li[^>]*>/gi, '\n· ');
  s = s.replace(/<[^>]+>/g, '');
  // 实体
  s = s.replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(Number(d)));
  s = s.replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)));
  const ent = { '&nbsp;': ' ', '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&#39;': "'", '&hellip;': '…', '&mdash;': '—', '&ndash;': '–', '&times;': '×', '&le;': '≤', '&ge;': '≥' };
  s = s.replace(/&[a-z#0-9]+;/gi, (m) => (ent[m] !== undefined ? ent[m] : m));
  s = s.replace(/[ \t\u00a0]+/g, ' ');
  s = s.replace(/ *\n */g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

/** 判断文本是不是中文（中文汉字占比） */
export function isChinese(text) {
  if (!text) return false;
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const letters = (text.match(/[A-Za-z\u4e00-\u9fff]/g) || []).length;
  return letters > 0 && cjk / letters > 0.25;
}

/** 看着像人机校验页 / 空页，就当作抓取失败 */
function looksBlocked(html) {
  if (!html || html.length < 200) return true;
  return /Just a moment|being checked|cf-browser-verification|Enable JavaScript and cookies|Attention Required/i.test(html);
}

/* ============================================================
 * 各站点抓取
 * ============================================================ */

/** LeetCode 官方中文（leetcode.cn 的 translatedContent 就是官方中文译文）
 *  注意：leetcode.cn 有反爬校验，偶发会返回 HTML 校验页，失败时上层会用下面那个源兜底。 */
export async function fetchLeetCodeCN(slug) {
  const q = `query q($t:String!){question(titleSlug:$t){title translatedTitle content translatedContent}}`;
  const r = await timedFetch('https://leetcode.cn/graphql/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.cn/problems/' + slug + '/', 'User-Agent': UA, Origin: 'https://leetcode.cn' },
    body: JSON.stringify({ query: q, variables: { t: slug } })
  }, 18000);
  if (!r.ok) throw new Error('leetcode.cn HTTP ' + r.status);
  const raw = await r.text();
  if (raw.trimStart()[0] !== '{') throw new Error('leetcode.cn 触发了人机校验');
  const d = JSON.parse(raw);
  const qq = d && d.data && d.data.question;
  if (!qq) throw new Error('leetcode.cn 没有这道题');
  const zh = qq.translatedContent && qq.translatedContent.trim();
  const text = htmlToText(zh || qq.content || '');
  if (!text) throw new Error('题干为空');
  return { text, from: zh ? 'leetcode-cn' : 'leetcode-en', chinese: !!zh, title: qq.translatedTitle || qq.title };
}

/** LeetCode 国际站（没有反爬校验，但只有英文；拿到后交给翻译） */
export async function fetchLeetCodeCom(slug) {
  const q = `query q($t:String!){question(titleSlug:$t){title content}}`;
  const r = await timedFetch('https://leetcode.com/graphql/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com/problems/' + slug + '/', 'User-Agent': UA, Origin: 'https://leetcode.com' },
    body: JSON.stringify({ query: q, variables: { t: slug } })
  }, 18000);
  if (!r.ok) throw new Error('leetcode.com HTTP ' + r.status);
  const d = await r.json();
  const qq = d && d.data && d.data.question;
  if (!qq || !qq.content) throw new Error('leetcode.com 没有这道题');
  const text = htmlToText(qq.content);
  if (!text) throw new Error('题干为空');
  return { text, from: 'leetcode-en', chinese: false, title: qq.title };
}

/** 洛谷的 Codeforces 镜像：很多 CF 题有现成中文翻译，直接拉，不翻译 */
export async function fetchLuoguCF(contestId, index) {
  const pid = 'CF' + contestId + index;
  const r = await timedFetch('https://www.luogu.com.cn/problem/' + pid + '?_contentOnly=1', {
    headers: { 'User-Agent': UA, Accept: 'application/json', 'Accept-Language': 'zh-CN,zh;q=0.9', Referer: 'https://www.luogu.com.cn/problem/' + pid }
  }, 12000);
  if (!r.ok) throw new Error('洛谷 HTTP ' + r.status);
  const raw = await r.text();
  if (looksBlocked(raw)) throw new Error('洛谷返回了校验页');
  let j;
  try { j = JSON.parse(raw); } catch { throw new Error('洛谷返回的不是 JSON'); }
  const p = j && j.currentData && j.currentData.problem;
  if (!p || !p.content) throw new Error('洛谷没有这道题');
  const text = htmlToText(p.content);
  if (!text || text.length < 30) throw new Error('洛谷题干为空');
  return { text, from: 'luogu', chinese: isChinese(text), title: p.title };
}

/** Codeforces 官方页面（部分网络环境能直接访问） */
export async function fetchCodeforcesOfficial(contestId, index) {
  const url = `https://codeforces.com/problemset/problem/${contestId}/${index}`;
  const r = await timedFetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', Accept: 'text/html,application/xhtml+xml' }
  }, 15000);
  const html = await r.text();
  if (looksBlocked(html) || !/problem-statement/.test(html)) throw new Error('Codeforces 拦截或结构变化 (HTTP ' + r.status + ')');
  return { text: parseCFStatement(html), from: 'codeforces', chinese: false };
}

/** Codeforces 镜像站（m1/m2/m3），共享一个总时间预算，避免一个个干等 */
export async function fetchCodeforcesMirror(contestId, index, budgetMs = 10000) {
  const hosts = ['https://m1.codeforces.com', 'https://m2.codeforces.com', 'https://m3.codeforces.com'];
  const t0 = Date.now();
  let lastErr = 'no mirror';
  for (const h of hosts) {
    const left = budgetMs - (Date.now() - t0);
    if (left < 2000) break;
    try {
      const r = await timedFetch(`${h}/problemset/problem/${contestId}/${index}`, { headers: { 'User-Agent': UA } }, Math.min(8000, left));
      const html = await r.text();
      if (looksBlocked(html) || !/problem-statement/.test(html)) { lastErr = h + ' 校验页'; continue; }
      return { text: parseCFStatement(html), from: 'codeforces-mirror', chinese: false };
    } catch (e) { lastErr = h + ' ' + e.message; }
  }
  throw new Error(lastErr);
}

/** VJudge 也镜像了 CF 题目 */
export async function fetchVjudge(contestId, index) {
  const r = await timedFetch(`https://vjudge.net/problem/CodeForces-${contestId}${index}`, {
    headers: { 'User-Agent': UA, Accept: 'text/html' }
  }, 12000);
  const html = await r.text();
  if (looksBlocked(html)) throw new Error('vjudge 校验页');
  const m = html.match(/<div[^>]*id="problem-desc"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*id="problem-[a-z]*input/i)
    || html.match(/<div[^>]*class="problem-description"[^>]*>([\s\S]*?)<\/div>/i);
  if (!m) throw new Error('vjudge 结构未识别');
  const text = htmlToText(m[1]);
  if (text.length < 30) throw new Error('vjudge 题干为空');
  return { text, from: 'vjudge', chinese: isChinese(text) };
}

export function parseCFStatement(html) {
  const start = html.indexOf('<div class="problem-statement">');
  if (start < 0) throw new Error('没有找到 problem-statement');
  // 从起点开始做括号配平，取出整个 statement 块
  let i = start, depth = 0, end = -1;
  const tagRe = /<div\b[^>]*>|<\/div>/g;
  tagRe.lastIndex = start;
  let m;
  while ((m = tagRe.exec(html))) {
    depth += m[0] === '</div>' ? -1 : 1;
    if (depth === 0) { end = tagRe.lastIndex; break; }
  }
  const frag = end > 0 ? html.slice(start, end) : html.slice(start, start + 40000);
  const text = htmlToText(frag);
  if (text.length < 30) throw new Error('题干为空');
  return text;
}

/* ============================================================
 * 翻译
 * ============================================================ */

/** 免费在线翻译（MyMemory），无需 Key；失败会抛错让上层切 AI */
export async function translateMyMemory(text, log = () => {}) {
  const chunks = splitChunks(text, 450);
  const out = [];
  for (const c of chunks) {
    const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(c) + '&langpair=en|zh-CN';
    const r = await timedFetch(url, { headers: { 'User-Agent': UA } }, 20000);
    if (!r.ok) throw new Error('MyMemory HTTP ' + r.status);
    const j = await r.json();
    const t = j && j.responseData && j.responseData.translatedText;
    if (!t) throw new Error('MyMemory 没有返回译文');
    out.push(t);
    log('.');
    await new Promise((res) => setTimeout(res, 300));
  }
  return out.join('');
}

function splitChunks(text, size) {
  const paras = String(text).split(/\n/);
  const chunks = [];
  let buf = '';
  for (const p of paras) {
    if (p.length > size) {
      if (buf) { chunks.push(buf); buf = ''; }
      for (let i = 0; i < p.length; i += size) chunks.push(p.slice(i, i + size));
      continue;
    }
    if ((buf + '\n' + p).length > size) { chunks.push(buf); buf = p; }
    else buf = buf ? buf + '\n' + p : p;
  }
  if (buf) chunks.push(buf);
  return chunks.filter((c) => c.trim());
}

/** 用 OpenAI 兼容接口翻译（质量最好，用户自己配的 Key） */
export async function translateAI(text, cfg, log = () => {}) {
  const base = String(cfg.baseUrl || '').replace(/\/+$/, '');
  const key = cfg.apiKey;
  if (!base || !key) throw new Error('缺少 API Key');
  const chunks = splitChunks(text, 3500);
  const out = [];
  for (const c of chunks) {
    const r = await timedFetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model: cfg.model || 'deepseek-chat',
        temperature: 0.1,
        messages: [
          { role: 'system', content: '你是算法竞赛题目的专业译者。把用户给的英文题面翻译成简体中文。要求：保留数据范围、变量名、公式与 $...$ 记号；保留“输入/输出/样例”的层次与换行；不要解释、不要总结、不要加任何额外说明，只输出译文。' },
          { role: 'user', content: c }
        ]
      })
    }, 90000);
    const t = await r.text();
    if (!r.ok) throw new Error('AI HTTP ' + r.status + ' ' + t.slice(0, 120));
    const j = JSON.parse(t);
    const content = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (!content) throw new Error('AI 没有返回内容');
    out.push(content.trim());
    log('.');
  }
  return out.join('\n\n');
}

/* ============================================================
 * 统一入口：给一道题，拿到中文题干
 * ============================================================ */

/**
 * 已经拿到原文（英文/俄文）之后的单独翻译。
 * 供「自动抓取成功但翻译失败」和「手动粘贴英文题干」两条路复用。
 * @returns {{text:string, translated:boolean, from:'ai'|'mt'|'none'}}
 */
export async function translateText(text, ai, log = () => {}) {
  const src = String(text || '').trim();
  if (!src) throw new Error('没有可翻译的内容');
  if (isChinese(src)) return { text: src, translated: false, from: 'none' };

  let aiErr = '';
  if (ai && ai.apiKey) {
    try {
      log('AI译 ');
      return { text: await translateAI(src, ai, log), translated: true, from: 'ai' };
    } catch (e) { aiErr = '（AI 翻译失败：' + e.message + '，已退回机器翻译）'; }
  }
  log('机译 ');
  return { text: (await translateMyMemory(src, log)) + aiErr, translated: true, from: 'mt' };
}


/**
 * @param {object} q  { id, src, url }
 * @param {object} opt { ai: {baseUrl, apiKey, model} | null, preferAI: boolean, log }
 * @returns {{ok:boolean, text:string, from:string, translated:boolean, tried:string[], error?:string}}
 */
export async function getStatement(q, opt = {}) {
  const log = opt.log || (() => {});
  const tried = [];
  const startedAt = Date.now();
  const id = String(q.id || '');
  let titleSlug = null;
  let contestId = null, index = null;

  const mCF = id.match(/^cf-(\d+)([A-Z]\d*)$/i);
  if (mCF) { contestId = mCF[1]; index = mCF[2].toUpperCase(); }
  if (!contestId && q.url) {
    const m = String(q.url).match(/problemset\/problem\/(\d+)\/([A-Z]\d*)/i);
    if (m) { contestId = m[1]; index = m[2].toUpperCase(); }
  }
  if (q.url) {
    const m = String(q.url).match(/leetcode\.(?:cn|com)\/problems\/([a-z0-9-]+)/i);
    if (m) titleSlug = m[1];
  }

  const sources = [];
  if (titleSlug) {
    // 先要官方中文；leetcode.cn 被反爬挡住时退回国际站英文，再翻译
    sources.push(['leetcode', () => fetchLeetCodeCN(titleSlug)]);
    sources.push(['leetcode-en', () => fetchLeetCodeCom(titleSlug)]);
  }
  if (contestId && index) {
    // 先找有中文的（洛谷镜像），再找官方的英文
    sources.push(['luogu', () => fetchLuoguCF(contestId, index)]);
    sources.push(['codeforces', () => fetchCodeforcesOfficial(contestId, index)]);
    sources.push(['codeforces-mirror', () => fetchCodeforcesMirror(contestId, index)]);
    sources.push(['vjudge', () => fetchVjudge(contestId, index)]);
  }

  if (!sources.length) {
    return { ok: false, text: '', from: '', translated: false, tried, error: '无法从题号推断出原题地址' };
  }

  for (const [name, fn] of sources) {
    // 总时间预算：网络不通时别让用户干等
    if (Date.now() - startedAt > (opt.budgetMs || 40000)) {
      tried.push(name + ': 超出总时间预算，跳过');
      break;
    }
    let got;
    try {
      got = await fn();
    } catch (e) {
      tried.push(name + ': ' + e.message);
      log('x' + name + ' ');
      continue;
    }
    log('✓' + name + ' ');

    // 站点自带中文 -> 直接用，不翻译
    if (got.chinese || isChinese(got.text)) {
      return { ok: true, text: got.text, from: got.from, translated: false, tried, title: got.title };
    }

    // 英文/俄文 -> 翻译
    const aiCfg = opt.ai || null;
    const order = opt.preferAI === false ? ['mt', 'ai'] : ['ai', 'mt'];
    for (const engine of order) {
      try {
        if (engine === 'ai') {
          if (!aiCfg || !aiCfg.apiKey) { tried.push('ai: 未配置 Key'); continue; }
          log('AI译 ');
          const zh = await translateAI(got.text, aiCfg, log);
          return { ok: true, text: zh, from: got.from + '+ai', translated: true, original: got.text, tried, title: got.title };
        } else {
          log('机译 ');
          const zh = await translateMyMemory(got.text, log);
          return { ok: true, text: zh, from: got.from + '+mt', translated: true, original: got.text, tried, title: got.title };
        }
      } catch (e) {
        tried.push(engine + ': ' + e.message);
        log('x' + engine + ' ');
      }
    }
    // 翻译全失败：至少把英文原文给出来
    return { ok: true, text: got.text, from: got.from, translated: false, original: got.text, tried, title: got.title, note: '翻译失败，以下是原文' };
  }

  return { ok: false, text: '', from: '', translated: false, tried, error: '所有来源都抓不到题干（可能是网络无法访问外站）' };
}

export const SOURCE_LABEL = {
  'leetcode-cn': 'LeetCode 官方中文',
  'leetcode-en': 'LeetCode 英文原文',
  'luogu': '洛谷中文翻译',
  'codeforces': 'Codeforces 原文',
  'codeforces-mirror': 'Codeforces 镜像原文',
  'vjudge': 'VJudge 原文'
};

export function sourceLabel(from) {
  if (!from) return '';
  if (from.endsWith('+ai')) return (SOURCE_LABEL[from.slice(0, -3)] || from.slice(0, -3)) + ' · AI 翻译';
  if (from.endsWith('+mt')) return (SOURCE_LABEL[from.slice(0, -3)] || from.slice(0, -3)) + ' · 机器翻译';
  return SOURCE_LABEL[from] || from;
}
