#!/usr/bin/env node
/**
 * AlgoPick · 题干预取（离线批量）
 *
 *   node tools/fetch-statements.mjs --lc              # LeetCode 官方中文（直接拉，不翻译）
 *   node tools/fetch-statements.mjs --cf --limit 100  # Codeforces：优先洛谷中文，没中文才翻译
 *   node tools/fetch-statements.mjs --cf --limit 100 --ai   # 用自己配的 AI 翻译（质量最好）
 *
 * 产出：
 *   data/stmt-lc.js   window.STMT_LC = { "lc-1": "中文题干", ... }
 *   data/stmt-cf.js   window.STMT_CF = { "cf-4A": ["中文题干", "luogu"], ... }
 *
 * 已存在的结果会被跳过，可以反复运行慢慢补齐。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { htmlToText, getStatement, SOURCE_LABEL } from './statements.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const MAX_LEN = 2200;

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const LIMIT = Number(val('--limit', 0)) || 0;
const USE_AI = has('--ai');
const BATCH = Number(val('--batch', 40)) || 40;
const doLC = has('--lc') || (!has('--cf') && !has('--lc-cf'));
const doCF = has('--cf');

const AI = USE_AI ? {
  baseUrl: process.env.ALGOPICK_BASE || val('--base', 'https://api.deepseek.com/v1'),
  apiKey: process.env.ALGOPICK_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '',
  model: process.env.ALGOPICK_MODEL || val('--model', 'deepseek-chat')
} : null;

function loadBank(file, name) {
  const p = path.join(DATA, file);
  if (!fs.existsSync(p)) throw new Error(file + ' 不存在，先运行 node tools/build-banks.mjs');
  const win = {};
  new Function('window', fs.readFileSync(p, 'utf8'))(win);
  if (!win[name]) throw new Error(file + ' 里没有 ' + name);
  return win[name];
}

function loadExisting(file, name) {
  const p = path.join(DATA, file);
  if (!fs.existsSync(p)) return {};
  try {
    const win = {};
    new Function('window', fs.readFileSync(p, 'utf8'))(win);
    return win[name] || {};
  } catch { return {}; }
}

function save(file, name, obj, comment) {
  const keys = Object.keys(obj);
  const body = keys.map((k) => JSON.stringify(k) + ':' + JSON.stringify(obj[k])).join(',\n');
  const src = `/* AlgoPick 题干库 —— 由 tools/fetch-statements.mjs 自动生成，请勿手工编辑。\n * ${comment}\n * 生成时间: ${new Date().toISOString()}   条目: ${keys.length}\n */\nwindow.${name} = {\n${body}\n};\n`;
  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(path.join(DATA, file), src, 'utf8');
  return `${(Buffer.byteLength(src, 'utf8') / 1024 / 1024).toFixed(2)} MB`;
}

function clip(t) {
  t = String(t || '').trim();
  return t.length > MAX_LEN ? t.slice(0, MAX_LEN) + '\n…（题干较长，完整内容请点「打开原题」）' : t;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ============================================================
 * LeetCode：批量抓官方中文（一次请求多个题，用 GraphQL 别名）
 * ============================================================ */
async function runLC() {
  console.log('→ LeetCode 官方中文题干（直接拉取，不翻译）');
  const bank = loadBank('bank-lc.js', 'BANK_LC');
  const out = loadExisting('stmt-lc.js', 'STMT_LC');
  const stripped = {};   // id -> slug
  for (const q of bank) {
    const m = String(q.url || '').match(/leetcode\.(?:cn|com)\/problems\/([a-z0-9-]+)/i);
    if (m) stripped[q.id] = m[1];
  }
  let todo = Object.keys(stripped).filter((id) => !out[id]);
  console.log(`  题库 ${bank.length} 道，已有 ${Object.keys(out).length} 道，待抓 ${todo.length} 道`);
  if (LIMIT) todo = todo.slice(0, LIMIT);

  let done = 0, failed = 0, noZh = 0, streak = 0;
  for (let i = 0; i < todo.length; i += BATCH) {
    const ids = todo.slice(i, i + BATCH);
    const parts = ids.map((id, k) => `q${k}:question(titleSlug:${JSON.stringify(stripped[id])}){title translatedTitle translatedContent}`);
    const query = `query{${parts.join(' ')}}`;
    let json = null;
    for (let attempt = 1; attempt <= 4 && !json; attempt++) {
      try {
        const r = await fetch('https://leetcode.cn/graphql/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.cn/problemset/', 'User-Agent': UA, Origin: 'https://leetcode.cn' },
          body: JSON.stringify({ query })
        });
        const raw = await r.text();
        if (!r.ok || raw.trimStart()[0] === '<') {
          // leetcode.cn 的人机校验：退回等待，别硬撞
          const snippet = raw.replace(/\s+/g, ' ').slice(0, 160);
          if (process.env.ALGOPICK_DEBUG) console.error('\n  [debug] HTTP ' + r.status + ' body: ' + snippet);
          throw new Error('触发了人机校验');
        }
        json = JSON.parse(raw);
      } catch (e) {
        if (attempt === 4) console.error('\n  ! 批次失败:', e.message);
        else {
          const wait = 30000 * attempt;      // 30s / 60s / 90s
          process.stdout.write(`\r  ⏳ ${e.message}，等 ${wait / 1000}s 再试…                    `);
          await sleep(wait);
        }
      }
    }
    if (json && json.data) {
      streak = 0;
      ids.forEach((id, k) => {
        const q = json.data['q' + k];
        if (!q) { failed++; return; }
        const zh = q.translatedContent && q.translatedContent.trim();
        if (!zh) { noZh++; return; }               // 没有官方中文 -> 留给按需翻译
        const text = clip(htmlToText(zh));
        if (text.length >= 20) { out[id] = text; done++; } else failed++;
      });
    } else {
      failed += ids.length;
      if (++streak >= 3) {
        console.error('\n  !! 被 leetcode.cn 连续拦截 3 批，先停在这里（已抓到的都已存盘）。');
        console.error('     稍后重跑同一条命令会自动接着抓；想立刻补齐剩下的题，加 --translate 走国际站+翻译。');
        break;
      }
    }
    if (i % (BATCH * 2) === 0 || i + BATCH >= todo.length) {
      process.stdout.write(`\r  进度 ${Math.min(i + BATCH, todo.length)}/${todo.length}  成功 ${done}  无中文 ${noZh}  失败 ${failed}   `);
      save('stmt-lc.js', 'STMT_LC', out, '来源：leetcode.cn translatedContent（官方中文）');
    }
    await sleep(7000 + Math.random() * 1500);   // leetcode.cn 对请求间隔很敏感，宁慢勿断
  }
  const size = save('stmt-lc.js', 'STMT_LC', out, '来源：leetcode.cn translatedContent（官方中文）');
  console.log(`\n  ✓ data/stmt-lc.js  ${Object.keys(out).length} 道  ${size}  （本次新增 ${done}，官方无中文 ${noZh}，失败 ${failed}）`);

  /* --translate：官方中文拿不到的，用国际站英文 + 翻译补齐 */
  if (has('--translate')) {
    let rest = Object.keys(stripped).filter((id) => !out[id]);
    if (LIMIT) rest = rest.slice(0, LIMIT);
    console.log(`\n→ --translate：剩余 ${rest.length} 道改用「英文原文 + 翻译」补齐`);
    let n = 0, f = 0;
    for (let i = 0; i < rest.length; i++) {
      const id = rest[i];
      try {
        const r = await getStatement({ id, url: 'https://leetcode.cn/problems/' + stripped[id] + '/' },
          { ai: AI && AI.apiKey ? AI : null, preferAI: !!(AI && AI.apiKey), log: () => {} });
        if (r.ok && r.text && r.text.length >= 20) { out[id] = [clip(r.text), r.from]; n++; } else f++;
      } catch { f++; }
      if (i % 5 === 0 || i === rest.length - 1) {
        process.stdout.write(`\r  进度 ${i + 1}/${rest.length}  成功 ${n}  失败 ${f}   `);
        save('stmt-lc.js', 'STMT_LC', out, '来源：leetcode.cn 官方中文 / 国际站英文+翻译');
      }
      await sleep(1500);
    }
    const s2 = save('stmt-lc.js', 'STMT_LC', out, '来源：leetcode.cn 官方中文 / 国际站英文+翻译');
    console.log(`\n  ✓ data/stmt-lc.js  ${Object.keys(out).length} 道  ${s2}  （翻译补齐 ${n}，失败 ${f}）`);
  }
}

/* ============================================================
 * Codeforces：优先洛谷现成中文，没中文才翻译
 * ============================================================ */
async function runCF() {
  console.log('→ Codeforces 题干（优先抓现成中文，其次翻译）');
  const bank = loadBank('bank-cf.js', 'BANK_CF');
  const out = loadExisting('stmt-cf.js', 'STMT_CF');
  let todo = bank.filter((q) => !out[q.id]);
  // 优先拉简单题：更容易命中洛谷的中文翻译，性价比最高
  todo.sort((a, b) => (a.rating || 9999) - (b.rating || 9999));
  console.log(`  题库 ${bank.length} 道，已有 ${Object.keys(out).length} 道，待抓 ${todo.length} 道`);
  if (LIMIT) todo = todo.slice(0, LIMIT);
  if (AI && !AI.apiKey) { console.error('  ! --ai 需要设置 ALGOPICK_API_KEY 环境变量，已退回机器翻译'); }

  let done = 0, failed = 0, zh = 0;
  for (let i = 0; i < todo.length; i++) {
    const q = todo[i];
    try {
      const r = await getStatement({ id: q.id, url: q.url }, {
        ai: AI && AI.apiKey ? AI : null,
        preferAI: !!(AI && AI.apiKey),
        log: () => {}
      });
      if (r.ok && r.text && r.text.length >= 20) {
        out[q.id] = [clip(r.text), r.from];
        done++;
        if (!r.translated) zh++;
      } else failed++;
    } catch (e) { failed++; }
    if (i % 5 === 0 || i === todo.length - 1) {
      process.stdout.write(`\r  进度 ${i + 1}/${todo.length}  成功 ${done}（其中现成中文 ${zh}）  失败 ${failed}   `);
      save('stmt-cf.js', 'STMT_CF', out, '来源：洛谷中文翻译 / Codeforces 原文+机翻 / AI 翻译');
    }
    await sleep(600);
  }
  const size = save('stmt-cf.js', 'STMT_CF', out, '来源：洛谷中文翻译 / Codeforces 原文+机翻 / AI 翻译');
  console.log(`\n  ✓ data/stmt-cf.js  ${Object.keys(out).length} 道  ${size}  （本次新增 ${done}，其中现成中文 ${zh}，失败 ${failed}）`);
}

(async () => {
  console.log('AlgoPick 题干预取工具');
  if (doLC) { try { await runLC(); } catch (e) { console.error('LeetCode 失败: ' + e.message); } }
  if (doCF) { try { await runCF(); } catch (e) { console.error('Codeforces 失败: ' + e.message); } }
  console.log('\n刷新 index.html 即可看到中文题干。');
  console.log('网页里遇到还没预取的题，会自动向本地服务请求抓取+翻译（需运行 node tools/serve.mjs）。');
  console.log('可用来源: ' + Object.entries(SOURCE_LABEL).map(([k, v]) => k + '=' + v).join(' / '));
})();
