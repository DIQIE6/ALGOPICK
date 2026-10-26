#!/usr/bin/env node
/**
 * AlgoPick · 题库自检
 *   node tools/validate.mjs
 *
 * 检查：知识点 id 是否合法、题目 id 是否重复、题干长度、答案是否为空、
 *       本地题库是否缺少解析，以及各来源/难度/知识点分布。
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PATTERNS = require(path.join(ROOT, 'assets/patterns.js'));
const IDS = new Set(PATTERNS.map((p) => p.id));

function loadBank(file, globalName) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return null;
  const src = fs.readFileSync(p, 'utf8');
  const win = {};
  try {
    new Function('window', src)(win);
  } catch (e) {
    throw new Error(file + ' 语法/执行错误: ' + e.message);
  }
  return win[globalName] || [];
}

const banks = [
  ['data/bank-a1.js', 'BANK_A1', true],
  ['data/bank-a2.js', 'BANK_A2', true],
  ['data/bank-a3.js', 'BANK_A3', true],
  ['data/bank-b.js', 'BANK_B', true],
  ['data/bank-cf.js', 'BANK_CF', false],
  ['data/bank-lc.js', 'BANK_LC', false],
];

let exitCode = 0;
const ids = new Map();          // id -> 首次出现的文件
const crossFile = [];
let totalCount = 0;
const bySrc = {}, byDiff = {}, byTag = {};

for (const [file, name, curated] of banks) {
  let list;
  try { list = loadBank(file, name); }
  catch (e) { console.error('✗ ' + e.message); exitCode = 1; continue; }
  if (list === null) { console.log(`- ${file} 不存在（可选）`); continue; }

  const issues = [];
  const localIds = new Set();
  list.forEach((q, i) => {
    const label = `${file}[${i}] ${q && q.title ? q.title : '?'}`;
    if (!q) { issues.push(label + ' 空条目'); return; }
    if (!q.id) issues.push(label + ' 缺少 id');
    else if (localIds.has(q.id)) issues.push(label + ` 本文件内 id 重复: ${q.id}`);
    else {
      localIds.add(q.id);
      if (ids.has(q.id)) crossFile.push(`${q.id}  同时出现在 ${ids.get(q.id)} 和 ${file}`);
      else ids.set(q.id, file);
    }

    const ans = q.answer || [];
    if (!ans.length) issues.push(label + ' answer 为空');
    ans.concat(q.alternatives || []).forEach((t) => {
      if (!IDS.has(t)) issues.push(`${label} 非法知识点 id: ${t}`);
    });
    if (curated) {
      const n = (q.statement || '').length;
      if (n < 30) issues.push(`${label} 题干太短(${n})`);
      if (n > 400) issues.push(`${label} 题干过长(${n})`);
      if (!q.explain) issues.push(label + ' 缺少 explain');
    }
    if (curated && q.src) bySrc[q.src] = (bySrc[q.src] || 0) + 1;
    byDiff[q.difficulty] = (byDiff[q.difficulty] || 0) + 1;
    (q.answer || []).forEach((t) => { byTag[t] = (byTag[t] || 0) + 1; });
  });

  totalCount += list.length;
  console.log(`${issues.length ? '⚠' : '✓'} ${file.padEnd(20)} ${String(list.length).padStart(6)} 题` +
    (curated ? '  (含题干)' : '  (仅标签+链接)') + (issues.length ? `  ${issues.length} 个问题` : ''));
  issues.slice(0, 12).forEach((s) => console.log('    · ' + s));
  if (issues.length > 12) console.log(`    … 另有 ${issues.length - 12} 条`);
  if (issues.length) exitCode = 1;
}

if (crossFile.length) {
  console.log(`\nℹ ${crossFile.length} 道题同时被多个题库文件收录（例如精选与大题库撞题）。`);
  console.log('  运行时只会保留带题干的那一份，属于正常现象，不是错误。');
  crossFile.slice(0, 3).forEach((s) => console.log('    · ' + s));
}

console.log('\n合计 ' + totalCount + ' 题');
console.log('\n难度分布: ' + Object.entries(byDiff).map(([k, v]) => `${k}=${v}`).join('  '));
if (Object.keys(bySrc).length) {
  console.log('本地题库来源: ' + Object.entries(bySrc).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join('  '));
}
const tagRows = Object.entries(byTag).sort((a, b) => b[1] - a[1]);
console.log('\n知识点覆盖: ' + tagRows.length + ' / ' + IDS.size + ' 种');
console.log('  ' + tagRows.map(([k, v]) => `${k}:${v}`).join('  '));
const uncovered = PATTERNS.filter((p) => !byTag[p.id]).map((p) => p.zh);
if (uncovered.length) console.log('\n未被任何题目覆盖: ' + uncovered.join('、'));

/* ---------- 中文题干覆盖情况 ---------- */
for (const [f, n, qf] of [['data/stmt-lc.js', 'STMT_LC', 'data/bank-lc.js'], ['data/stmt-cf.js', 'STMT_CF', 'data/bank-cf.js']]) {
  if (!fs.existsSync(path.join(ROOT, f))) { console.log(`\n- ${f} 不存在（未预取中文题干，可选）`); continue; }
  let dict, bank;
  try {
    const w = {}; new Function('window', fs.readFileSync(path.join(ROOT, f), 'utf8'))(w); dict = w[n];
    const w2 = {}; new Function('window', fs.readFileSync(path.join(ROOT, qf), 'utf8'))(w2); bank = w2[qf.replace('data/', '').replace('.js', '').replace('bank-', 'BANK_').toUpperCase()] || [];
  } catch (e) { console.error(`✗ ${f} 读取失败: ${e.message}`); exitCode = 1; continue; }
  const keys = Object.keys(dict || {});
  const bad = keys.filter((k) => { const v = dict[k]; const t = Array.isArray(v) ? v[0] : v; return !t || String(t).trim().length < 20; });
  const cjk = keys.filter((k) => { const v = dict[k]; const t = String(Array.isArray(v) ? v[0] : v); return /[\u4e00-\u9fff]/.test(t); });
  const missing = (bank || []).map((q) => q.id).filter((id) => !dict[id]).length;
  console.log(`\n${bad.length ? '⚠' : '✓'} ${f.padEnd(20)} ${keys.length} 条中文题干，其中含中文 ${cjk.length} 条` +
    (bank.length ? `（该题库共 ${bank.length} 题，未预取 ${missing} 题，会走按需抓取）` : ''));
  if (bad.length) { console.log(`    · ${bad.length} 条题干过短或为空`); exitCode = 1; }
}

/* ---------- 知识点讲解（learn-*.js） ---------- */
const LEARN_DOMAINS = ['search.bilibili.com', 'oi-wiki.org', 'cp-algorithms.com', 'www.runoob.com',
  'docs.python.org', 'leetcode.cn', 'www.luogu.com.cn', 'zh.wikipedia.org'];
{
  const files = fs.readdirSync(path.join(ROOT, 'data')).filter((f) => /^learn-\d+\.js$/.test(f)).sort();
  const dict = {}; const dup = []; const issues = []; let totalLinks = 0; let totalOps = 0;
  for (const f of files) {
    let o;
    try {
      const w = {}; new Function('window', fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'))(w);
      o = w[Object.keys(w).find((k) => /^LEARN_/.test(k))];
    } catch (e) { issues.push(`${f} 运行期报错: ${e.message}`); continue; }
    if (!o) { issues.push(`${f} 没有导出 LEARN_*`); continue; }
    for (const [id, d] of Object.entries(o)) {
      if (dict[id]) dup.push(id);
      dict[id] = d;
      const at = `${f}:${id}`;
      if (!IDS.has(id)) issues.push(`${at} 不是合法的知识点 id`);
      if (!d.intro || d.intro.length < 15) issues.push(`${at} intro 太短`);
      if (!Array.isArray(d.identify) || d.identify.length < 2) issues.push(`${at} identify 至少 2 条`);
      if (!Array.isArray(d.ops) || d.ops.length < 4) issues.push(`${at} ops 至少 4 条`);
      if (!d.template || String(d.template).length < 40) issues.push(`${at} template 太短`);
      else if (!/def |for |while |if |return |=/.test(String(d.template))) issues.push(`${at} template 不像代码`);
      if (!d.complexity) issues.push(`${at} 缺 complexity`);
      if (!Array.isArray(d.applications) || d.applications.length < 3) issues.push(`${at} applications 至少 3 条`);
      if (!Array.isArray(d.pitfalls) || d.pitfalls.length < 2) issues.push(`${at} pitfalls 至少 2 条`);
      if (!Array.isArray(d.links) || d.links.length < 3) issues.push(`${at} links 至少 3 条`);
      totalOps += (d.ops || []).length;
      for (const l of (d.links || [])) {
        totalLinks++;
        const u = String(l.u || l.url || '');
        if (!/^https?:\/\//.test(u)) { issues.push(`${at} 链接不是 http(s): ${u}`); continue; }
        let host = '';
        try { host = new URL(u).host; } catch { issues.push(`${at} 链接无法解析: ${u}`); continue; }
        if (!LEARN_DOMAINS.includes(host)) issues.push(`${at} 链接域名不在白名单: ${host}`);
        if (!l.t) issues.push(`${at} 链接缺少说明文字: ${u}`);
      }
      for (const op of (d.ops || [])) {
        const py = Array.isArray(op.py) ? op.py.join('\n') : String(op.py || '');
        if (!py.trim()) issues.push(`${at} 有一个 op 的 py 为空`);
      }
    }
  }
  const missing = PATTERNS.filter((p) => !dict[p.id]).map((p) => p.id);
  console.log(`\n${issues.length || missing.length ? '⚠' : '✓'} 知识点讲解     ${Object.keys(dict).length} / ${PATTERNS.length} 个知识点，` +
    `${totalOps} 条基本操作，${totalLinks} 个学习链接（${files.length} 个文件）`);
  if (dup.length) console.log(`    ℹ 重复定义（后者生效）: ${dup.join('、')}`);
  if (missing.length) { console.log(`    · 缺少讲解的知识点(${missing.length}): ${missing.join('、')}`); }
  issues.slice(0, 12).forEach((s) => console.log('    · ' + s));
  if (issues.length > 12) console.log(`    … 另有 ${issues.length - 12} 条`);
  if (issues.length) exitCode = 1;
}

console.log(exitCode ? '\n❌ 存在问题，见上。' : '\n✅ 全部通过。');
process.exit(exitCode);
